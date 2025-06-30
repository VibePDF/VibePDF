/**
 * PDF Security and Encryption
 */

import { 
  EncryptionOptions, 
  PDFPermissions, 
  PDFDict,
  PDFError,
  PDFSecurityError 
} from '../types/index.js';

export enum EncryptionAlgorithm {
  RC4_40 = 'RC4-40',
  RC4_128 = 'RC4-128',
  AES_128 = 'AES-128',
  AES_256 = 'AES-256'
}

export class PDFSecurity {
  private algorithm: EncryptionAlgorithm;
  private userPassword: string;
  private ownerPassword: string;
  private permissions: PDFPermissions;
  private encryptionKey: Uint8Array | null = null;

  constructor(options: EncryptionOptions) {
    this.algorithm = this.mapAlgorithm(options.algorithm);
    this.userPassword = options.userPassword || '';
    this.ownerPassword = options.ownerPassword || this.generateRandomPassword();
    this.permissions = options.permissions || this.getDefaultPermissions();
  }

  private mapAlgorithm(algorithm: string): EncryptionAlgorithm {
    switch (algorithm) {
      case 'RC4': return EncryptionAlgorithm.RC4_128;
      case 'AES-128': return EncryptionAlgorithm.AES_128;
      case 'AES-256': return EncryptionAlgorithm.AES_256;
      default: throw new PDFSecurityError(`Unsupported encryption algorithm: ${algorithm}`);
    }
  }

  private getDefaultPermissions(): PDFPermissions {
    return {
      print: true,
      modify: true,
      copy: true,
      annotate: true,
      fillForms: true,
      extractForAccessibility: true,
      assemble: true,
      printHighRes: true
    };
  }

  private generateRandomPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  async generateEncryptionDict(): Promise<PDFDict> {
    const dict: PDFDict = {
      Filter: 'Standard'
    };

    switch (this.algorithm) {
      case EncryptionAlgorithm.RC4_40:
        dict.V = 1;
        dict.R = 2;
        dict.Length = 40;
        break;
      case EncryptionAlgorithm.RC4_128:
        dict.V = 2;
        dict.R = 3;
        dict.Length = 128;
        break;
      case EncryptionAlgorithm.AES_128:
        dict.V = 4;
        dict.R = 4;
        dict.Length = 128;
        dict.CF = {
          StdCF: {
            CFM: 'AESV2',
            Length: 16
          }
        };
        dict.StmF = 'StdCF';
        dict.StrF = 'StdCF';
        break;
      case EncryptionAlgorithm.AES_256:
        dict.V = 5;
        dict.R = 6;
        dict.Length = 256;
        dict.CF = {
          StdCF: {
            CFM: 'AESV3',
            Length: 32
          }
        };
        dict.StmF = 'StdCF';
        dict.StrF = 'StdCF';
        break;
    }

    // Generate O and U values
    const { O, U } = await this.generatePasswordHashes();
    dict.O = O;
    dict.U = U;
    dict.P = this.getPermissionsValue();

    return dict;
  }

  private async generatePasswordHashes(): Promise<{ O: string; U: string }> {
    // Implementation depends on the encryption algorithm
    switch (this.algorithm) {
      case EncryptionAlgorithm.AES_256:
        return this.generateAES256Hashes();
      case EncryptionAlgorithm.AES_128:
        return this.generateAES128Hashes();
      default:
        return this.generateRC4Hashes();
    }
  }

  private async generateAES256Hashes(): Promise<{ O: string; U: string }> {
    // AES-256 password hash generation (PDF 2.0)
    const encoder = new TextEncoder();
    
    // Generate random salt
    const salt = new Uint8Array(8);
    crypto.getRandomValues(salt);
    
    // User password hash
    const userKey = await this.deriveKey(encoder.encode(this.userPassword), salt);
    const U = this.arrayToHexString(userKey);
    
    // Owner password hash
    const ownerKey = await this.deriveKey(encoder.encode(this.ownerPassword), salt);
    const O = this.arrayToHexString(ownerKey);
    
    return { O, U };
  }

  private async generateAES128Hashes(): Promise<{ O: string; U: string }> {
    // AES-128 password hash generation
    const encoder = new TextEncoder();
    
    const userKey = await this.md5Hash(encoder.encode(this.userPassword));
    const ownerKey = await this.md5Hash(encoder.encode(this.ownerPassword));
    
    return {
      O: this.arrayToHexString(ownerKey),
      U: this.arrayToHexString(userKey)
    };
  }

  private async generateRC4Hashes(): Promise<{ O: string; U: string }> {
    // RC4 password hash generation (legacy)
    const encoder = new TextEncoder();
    
    const userKey = await this.md5Hash(encoder.encode(this.userPassword));
    const ownerKey = await this.md5Hash(encoder.encode(this.ownerPassword));
    
    return {
      O: this.arrayToHexString(ownerKey),
      U: this.arrayToHexString(userKey)
    };
  }

  private async deriveKey(password: Uint8Array, salt: Uint8Array): Promise<Uint8Array> {
    // PBKDF2 key derivation for AES-256
    const key = await crypto.subtle.importKey(
      'raw',
      password,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 10000,
        hash: 'SHA-256'
      },
      key,
      256
    );

    return new Uint8Array(derivedBits);
  }

  private async md5Hash(data: Uint8Array): Promise<Uint8Array> {
    // MD5 hash for legacy encryption
    // Note: MD5 is deprecated but required for PDF compatibility
    const hashBuffer = await crypto.subtle.digest('MD5', data);
    return new Uint8Array(hashBuffer);
  }

  private getPermissionsValue(): number {
    let p = -4; // Base value with reserved bits set
    
    if (!this.permissions.print) p &= ~(1 << 2);
    if (!this.permissions.modify) p &= ~(1 << 3);
    if (!this.permissions.copy) p &= ~(1 << 4);
    if (!this.permissions.annotate) p &= ~(1 << 5);
    if (!this.permissions.fillForms) p &= ~(1 << 8);
    if (!this.permissions.extractForAccessibility) p &= ~(1 << 9);
    if (!this.permissions.assemble) p &= ~(1 << 10);
    if (!this.permissions.printHighRes) p &= ~(1 << 11);
    
    return p;
  }

  async encryptData(data: Uint8Array, objectNumber: number, generationNumber: number): Promise<Uint8Array> {
    if (!this.encryptionKey) {
      this.encryptionKey = await this.generateEncryptionKey();
    }

    const objectKey = this.generateObjectKey(objectNumber, generationNumber);
    
    switch (this.algorithm) {
      case EncryptionAlgorithm.AES_128:
      case EncryptionAlgorithm.AES_256:
        return this.encryptAES(data, objectKey);
      default:
        return this.encryptRC4(data, objectKey);
    }
  }

  private async generateEncryptionKey(): Promise<Uint8Array> {
    // Generate the main encryption key based on passwords and algorithm
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(this.userPassword + this.ownerPassword);
    
    switch (this.algorithm) {
      case EncryptionAlgorithm.AES_256:
        return this.deriveKey(passwordData, new Uint8Array(8));
      default:
        return this.md5Hash(passwordData);
    }
  }

  private generateObjectKey(objectNumber: number, generationNumber: number): Uint8Array {
    // Generate per-object encryption key
    const key = new Uint8Array(this.encryptionKey!.length + 5);
    key.set(this.encryptionKey!);
    
    // Append object and generation numbers
    key[this.encryptionKey!.length] = objectNumber & 0xFF;
    key[this.encryptionKey!.length + 1] = (objectNumber >> 8) & 0xFF;
    key[this.encryptionKey!.length + 2] = (objectNumber >> 16) & 0xFF;
    key[this.encryptionKey!.length + 3] = generationNumber & 0xFF;
    key[this.encryptionKey!.length + 4] = (generationNumber >> 8) & 0xFF;
    
    return key;
  }

  private async encryptAES(data: Uint8Array, key: Uint8Array): Promise<Uint8Array> {
    // AES encryption implementation
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key.slice(0, this.algorithm === EncryptionAlgorithm.AES_256 ? 32 : 16),
      { name: 'AES-CBC' },
      false,
      ['encrypt']
    );

    // Generate random IV
    const iv = new Uint8Array(16);
    crypto.getRandomValues(iv);

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-CBC', iv },
      cryptoKey,
      data
    );

    // Prepend IV to encrypted data
    const result = new Uint8Array(iv.length + encrypted.byteLength);
    result.set(iv);
    result.set(new Uint8Array(encrypted), iv.length);

    return result;
  }

  private encryptRC4(data: Uint8Array, key: Uint8Array): Uint8Array {
    // RC4 encryption implementation
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

  private arrayToHexString(array: Uint8Array): string {
    return Array.from(array)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  // Password verification methods
  async verifyUserPassword(password: string): Promise<boolean> {
    // Implementation for verifying user password
    return password === this.userPassword;
  }

  async verifyOwnerPassword(password: string): Promise<boolean> {
    // Implementation for verifying owner password
    return password === this.ownerPassword;
  }
}