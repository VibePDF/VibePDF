/**
 * Security utilities for PDF documents
 */

import { 
  EncryptionOptions, 
  PDFPermissions, 
  PDFSecurityError,
  PDFError 
} from '../types/index.js';

export class SecurityManager {
  private static readonly ENCRYPTION_ALGORITHMS = {
    RC4_40: 'RC4-40',
    RC4_128: 'RC4-128',
    AES_128: 'AES-128',
    AES_256: 'AES-256'
  } as const;

  private static readonly PERMISSION_FLAGS = {
    PRINT: 1 << 2,
    MODIFY: 1 << 3,
    COPY: 1 << 4,
    ANNOTATE: 1 << 5,
    FILL_FORMS: 1 << 8,
    EXTRACT_ACCESSIBILITY: 1 << 9,
    ASSEMBLE: 1 << 10,
    PRINT_HIGH_RES: 1 << 11
  } as const;

  static validateEncryptionOptions(options: EncryptionOptions): void {
    if (!options.algorithm) {
      throw new PDFSecurityError('Encryption algorithm is required');
    }

    if (!Object.values(this.ENCRYPTION_ALGORITHMS).includes(options.algorithm as any)) {
      throw new PDFSecurityError(`Unsupported encryption algorithm: ${options.algorithm}`);
    }

    if (options.userPassword && options.userPassword.length > 127) {
      throw new PDFSecurityError('User password cannot exceed 127 characters');
    }

    if (options.ownerPassword && options.ownerPassword.length > 127) {
      throw new PDFSecurityError('Owner password cannot exceed 127 characters');
    }

    // Validate AES-256 specific requirements
    if (options.algorithm === 'AES-256') {
      if (!options.userPassword && !options.ownerPassword) {
        throw new PDFSecurityError('AES-256 encryption requires at least one password');
      }
    }
  }

  static generateSecurePassword(length: number = 16): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset[array[i] % charset.length];
    }
    
    return password;
  }

  static validatePasswordStrength(password: string): {
    score: number;
    strength: 'weak' | 'fair' | 'good' | 'strong';
    suggestions: string[];
  } {
    const suggestions: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 12) score += 2;
    else if (password.length >= 8) score += 1;
    else suggestions.push('Use at least 8 characters');

    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    else suggestions.push('Include lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else suggestions.push('Include uppercase letters');

    if (/[0-9]/.test(password)) score += 1;
    else suggestions.push('Include numbers');

    if (/[^a-zA-Z0-9]/.test(password)) score += 2;
    else suggestions.push('Include special characters');

    // Common patterns check
    if (!/(.)\1{2,}/.test(password)) score += 1;
    else suggestions.push('Avoid repeating characters');

    if (!/123|abc|qwe|password|admin/i.test(password)) score += 1;
    else suggestions.push('Avoid common patterns');

    let strength: 'weak' | 'fair' | 'good' | 'strong';
    if (score >= 7) strength = 'strong';
    else if (score >= 5) strength = 'good';
    else if (score >= 3) strength = 'fair';
    else strength = 'weak';

    return { score, strength, suggestions };
  }

  static encodePermissions(permissions: PDFPermissions): number {
    let flags = -4; // Base value with reserved bits set

    if (!permissions.print) flags &= ~this.PERMISSION_FLAGS.PRINT;
    if (!permissions.modify) flags &= ~this.PERMISSION_FLAGS.MODIFY;
    if (!permissions.copy) flags &= ~this.PERMISSION_FLAGS.COPY;
    if (!permissions.annotate) flags &= ~this.PERMISSION_FLAGS.ANNOTATE;
    if (!permissions.fillForms) flags &= ~this.PERMISSION_FLAGS.FILL_FORMS;
    if (!permissions.extractForAccessibility) flags &= ~this.PERMISSION_FLAGS.EXTRACT_ACCESSIBILITY;
    if (!permissions.assemble) flags &= ~this.PERMISSION_FLAGS.ASSEMBLE;
    if (!permissions.printHighRes) flags &= ~this.PERMISSION_FLAGS.PRINT_HIGH_RES;

    return flags;
  }

  static decodePermissions(flags: number): PDFPermissions {
    return {
      print: (flags & this.PERMISSION_FLAGS.PRINT) !== 0,
      modify: (flags & this.PERMISSION_FLAGS.MODIFY) !== 0,
      copy: (flags & this.PERMISSION_FLAGS.COPY) !== 0,
      annotate: (flags & this.PERMISSION_FLAGS.ANNOTATE) !== 0,
      fillForms: (flags & this.PERMISSION_FLAGS.FILL_FORMS) !== 0,
      extractForAccessibility: (flags & this.PERMISSION_FLAGS.EXTRACT_ACCESSIBILITY) !== 0,
      assemble: (flags & this.PERMISSION_FLAGS.ASSEMBLE) !== 0,
      printHighRes: (flags & this.PERMISSION_FLAGS.PRINT_HIGH_RES) !== 0
    };
  }

  static async generateEncryptionKey(
    password: string,
    salt: Uint8Array,
    algorithm: string,
    iterations: number = 10000
  ): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordData,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const keyLength = this.getKeyLength(algorithm);
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      keyLength * 8
    );

    return new Uint8Array(derivedBits);
  }

  private static getKeyLength(algorithm: string): number {
    switch (algorithm) {
      case 'RC4-40': return 5;
      case 'RC4-128': return 16;
      case 'AES-128': return 16;
      case 'AES-256': return 32;
      default: throw new PDFSecurityError(`Unknown algorithm: ${algorithm}`);
    }
  }

  static async encryptData(
    data: Uint8Array,
    key: Uint8Array,
    algorithm: string,
    iv?: Uint8Array
  ): Promise<Uint8Array> {
    switch (algorithm) {
      case 'AES-128':
      case 'AES-256':
        return this.encryptAES(data, key, iv);
      case 'RC4-40':
      case 'RC4-128':
        return this.encryptRC4(data, key);
      default:
        throw new PDFSecurityError(`Encryption algorithm ${algorithm} not supported`);
    }
  }

  static async decryptData(
    data: Uint8Array,
    key: Uint8Array,
    algorithm: string,
    iv?: Uint8Array
  ): Promise<Uint8Array> {
    switch (algorithm) {
      case 'AES-128':
      case 'AES-256':
        return this.decryptAES(data, key, iv);
      case 'RC4-40':
      case 'RC4-128':
        return this.decryptRC4(data, key);
      default:
        throw new PDFSecurityError(`Decryption algorithm ${algorithm} not supported`);
    }
  }

  private static async encryptAES(data: Uint8Array, key: Uint8Array, iv?: Uint8Array): Promise<Uint8Array> {
    const algorithm = key.length === 16 ? 'AES-CBC' : 'AES-CBC';
    const actualIV = iv || crypto.getRandomValues(new Uint8Array(16));

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: algorithm },
      false,
      ['encrypt']
    );

    const encrypted = await crypto.subtle.encrypt(
      { name: algorithm, iv: actualIV },
      cryptoKey,
      data
    );

    // Prepend IV to encrypted data
    const result = new Uint8Array(actualIV.length + encrypted.byteLength);
    result.set(actualIV);
    result.set(new Uint8Array(encrypted), actualIV.length);

    return result;
  }

  private static async decryptAES(data: Uint8Array, key: Uint8Array, iv?: Uint8Array): Promise<Uint8Array> {
    const algorithm = key.length === 16 ? 'AES-CBC' : 'AES-CBC';
    let actualIV: Uint8Array;
    let encryptedData: Uint8Array;

    if (iv) {
      actualIV = iv;
      encryptedData = data;
    } else {
      // Extract IV from beginning of data
      actualIV = data.slice(0, 16);
      encryptedData = data.slice(16);
    }

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: algorithm },
      false,
      ['decrypt']
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: algorithm, iv: actualIV },
      cryptoKey,
      encryptedData
    );

    return new Uint8Array(decrypted);
  }

  private static encryptRC4(data: Uint8Array, key: Uint8Array): Uint8Array {
    // RC4 implementation
    const S = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      S[i] = i;
    }

    let j = 0;
    for (let i = 0; i < 256; i++) {
      j = (j + S[i] + key[i % key.length]) % 256;
      [S[i], S[j]] = [S[j], S[i]];
    }

    const result = new Uint8Array(data.length);
    let i = 0, k = 0;

    for (let n = 0; n < data.length; n++) {
      i = (i + 1) % 256;
      k = (k + S[i]) % 256;
      [S[i], S[k]] = [S[k], S[i]];
      result[n] = data[n] ^ S[(S[i] + S[k]) % 256];
    }

    return result;
  }

  private static decryptRC4(data: Uint8Array, key: Uint8Array): Uint8Array {
    // RC4 is symmetric, so decryption is the same as encryption
    return this.encryptRC4(data, key);
  }

  // Digital signature utilities
  static async generateKeyPair(algorithm: 'RSA' | 'ECDSA' = 'RSA'): Promise<CryptoKeyPair> {
    switch (algorithm) {
      case 'RSA':
        return crypto.subtle.generateKey(
          {
            name: 'RSA-PSS',
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256'
          },
          true,
          ['sign', 'verify']
        );
      case 'ECDSA':
        return crypto.subtle.generateKey(
          {
            name: 'ECDSA',
            namedCurve: 'P-256'
          },
          true,
          ['sign', 'verify']
        );
      default:
        throw new PDFSecurityError(`Unsupported signature algorithm: ${algorithm}`);
    }
  }

  static async signData(data: Uint8Array, privateKey: CryptoKey): Promise<Uint8Array> {
    const signature = await crypto.subtle.sign(
      {
        name: privateKey.algorithm.name,
        saltLength: 32
      },
      privateKey,
      data
    );

    return new Uint8Array(signature);
  }

  static async verifySignature(
    data: Uint8Array,
    signature: Uint8Array,
    publicKey: CryptoKey
  ): Promise<boolean> {
    try {
      return await crypto.subtle.verify(
        {
          name: publicKey.algorithm.name,
          saltLength: 32
        },
        publicKey,
        signature,
        data
      );
    } catch {
      return false;
    }
  }

  // Hash utilities
  static async hashData(data: Uint8Array, algorithm: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256'): Promise<Uint8Array> {
    const hashBuffer = await crypto.subtle.digest(algorithm, data);
    return new Uint8Array(hashBuffer);
  }

  static async hmac(data: Uint8Array, key: Uint8Array, algorithm: 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256'): Promise<Uint8Array> {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: algorithm },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
    return new Uint8Array(signature);
  }

  // Secure random utilities
  static generateSecureBytes(length: number): Uint8Array {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return bytes;
  }

  static generateSecureId(): string {
    const bytes = this.generateSecureBytes(16);
    return Array.from(bytes)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  // Security audit utilities
  static auditDocument(document: any): {
    securityLevel: 'none' | 'basic' | 'standard' | 'high';
    features: string[];
    vulnerabilities: string[];
    recommendations: string[];
  } {
    const features: string[] = [];
    const vulnerabilities: string[] = [];
    const recommendations: string[] = [];

    // Check encryption
    if (document.isEncrypted?.()) {
      const algorithm = document.getEncryptionAlgorithm?.();
      features.push(`Encryption: ${algorithm}`);
      
      if (algorithm === 'RC4-40') {
        vulnerabilities.push('Weak encryption algorithm (RC4-40)');
        recommendations.push('Upgrade to AES-256 encryption');
      } else if (algorithm === 'RC4-128') {
        vulnerabilities.push('Deprecated encryption algorithm (RC4-128)');
        recommendations.push('Upgrade to AES-256 encryption');
      }
    } else {
      vulnerabilities.push('Document is not encrypted');
      recommendations.push('Consider adding encryption for sensitive content');
    }

    // Check digital signatures
    if (document.hasDigitalSignatures?.()) {
      features.push('Digital signatures present');
      const signatures = document.getDigitalSignatures?.() || [];
      for (const signature of signatures) {
        if (!signature.isValid?.()) {
          vulnerabilities.push('Invalid digital signature detected');
        }
      }
    } else {
      recommendations.push('Consider adding digital signatures for document integrity');
    }

    // Check permissions
    const permissions = document.getPermissions?.();
    if (permissions) {
      features.push('Permission restrictions applied');
      if (permissions.copy === false && permissions.extractForAccessibility === false) {
        vulnerabilities.push('Content extraction completely disabled (may affect accessibility)');
        recommendations.push('Allow extraction for accessibility while restricting general copying');
      }
    }

    // Check for JavaScript
    if (document.hasJavaScript?.()) {
      vulnerabilities.push('Document contains JavaScript');
      recommendations.push('Review JavaScript code for security risks');
    }

    // Check for external references
    if (document.hasExternalReferences?.()) {
      vulnerabilities.push('Document contains external references');
      recommendations.push('Embed external resources to prevent security risks');
    }

    // Determine security level
    let securityLevel: 'none' | 'basic' | 'standard' | 'high' = 'none';
    
    if (document.isEncrypted?.()) {
      const algorithm = document.getEncryptionAlgorithm?.();
      if (algorithm === 'AES-256') {
        securityLevel = document.hasDigitalSignatures?.() ? 'high' : 'standard';
      } else {
        securityLevel = 'basic';
      }
    }

    return {
      securityLevel,
      features,
      vulnerabilities,
      recommendations
    };
  }
}

export class AccessControl {
  private static readonly ROLE_PERMISSIONS = {
    viewer: {
      print: false,
      modify: false,
      copy: false,
      annotate: false,
      fillForms: false,
      extractForAccessibility: true,
      assemble: false,
      printHighRes: false
    },
    editor: {
      print: true,
      modify: true,
      copy: true,
      annotate: true,
      fillForms: true,
      extractForAccessibility: true,
      assemble: true,
      printHighRes: false
    },
    admin: {
      print: true,
      modify: true,
      copy: true,
      annotate: true,
      fillForms: true,
      extractForAccessibility: true,
      assemble: true,
      printHighRes: true
    }
  } as const;

  static getPermissionsForRole(role: keyof typeof AccessControl.ROLE_PERMISSIONS): PDFPermissions {
    return { ...this.ROLE_PERMISSIONS[role] };
  }

  static createCustomPermissions(allowedActions: string[]): PDFPermissions {
    const permissions: PDFPermissions = {
      print: false,
      modify: false,
      copy: false,
      annotate: false,
      fillForms: false,
      extractForAccessibility: true, // Always allow for accessibility
      assemble: false,
      printHighRes: false
    };

    for (const action of allowedActions) {
      switch (action.toLowerCase()) {
        case 'print':
          permissions.print = true;
          break;
        case 'modify':
          permissions.modify = true;
          break;
        case 'copy':
          permissions.copy = true;
          break;
        case 'annotate':
          permissions.annotate = true;
          break;
        case 'fillforms':
          permissions.fillForms = true;
          break;
        case 'assemble':
          permissions.assemble = true;
          break;
        case 'printhighres':
          permissions.printHighRes = true;
          break;
      }
    }

    return permissions;
  }

  static validatePermissions(permissions: PDFPermissions): {
    isValid: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];

    // Check for conflicting permissions
    if (permissions.printHighRes && !permissions.print) {
      warnings.push('High-resolution printing enabled without basic printing permission');
    }

    if (permissions.assemble && !permissions.modify) {
      warnings.push('Document assembly enabled without modification permission');
    }

    if (!permissions.extractForAccessibility) {
      warnings.push('Accessibility extraction disabled - may violate accessibility requirements');
    }

    return {
      isValid: warnings.length === 0,
      warnings
    };
  }
}

// Utility functions for secure operations
export function secureCompare(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }

  return result === 0;
}

export function secureWipe(data: Uint8Array): void {
  crypto.getRandomValues(data);
  data.fill(0);
}

export class SecureString {
  private data: Uint8Array;
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();

  constructor(value: string) {
    this.data = this.encoder.encode(value);
  }

  getValue(): string {
    return this.decoder.decode(this.data);
  }

  getBytes(): Uint8Array {
    return new Uint8Array(this.data);
  }

  clear(): void {
    secureWipe(this.data);
  }

  equals(other: SecureString): boolean {
    return secureCompare(this.data, other.data);
  }
}