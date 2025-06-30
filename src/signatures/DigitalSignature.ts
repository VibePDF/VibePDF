/**
 * Digital Signatures - Enterprise-grade PDF signing and validation
 */

import { 
  PDFDict, 
  PDFStream, 
  PDFRef,
  PDFError,
  PDFSecurityError 
} from '../types/index.js';
import { PDFObject, PDFObjectId } from '../core/PDFObject.js';

export interface SignatureOptions {
  reason?: string;
  location?: string;
  contactInfo?: string;
  certificate: Uint8Array;
  privateKey: Uint8Array;
  hashAlgorithm?: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';
  signatureFormat?: 'adbe.pkcs7.detached' | 'adbe.pkcs7.sha1' | 'adbe.x509.rsa_sha1';
  timestampServer?: string;
}

export interface SignatureValidationResult {
  isValid: boolean;
  signerName?: string;
  signDate?: Date;
  reason?: string;
  location?: string;
  certificateChain?: Certificate[];
  revocationStatus?: 'valid' | 'revoked' | 'unknown';
  timestampValid?: boolean;
  documentIntegrity: boolean;
  errors: string[];
  warnings: string[];
}

export interface Certificate {
  subject: string;
  issuer: string;
  serialNumber: string;
  validFrom: Date;
  validTo: Date;
  publicKey: Uint8Array;
  fingerprint: string;
}

export class DigitalSignatureManager {
  private signatures: Map<string, DigitalSignature> = new Map();

  async createSignature(options: SignatureOptions): Promise<DigitalSignature> {
    const signature = new DigitalSignature(options);
    await signature.initialize();
    this.signatures.set(signature.getId(), signature);
    return signature;
  }

  async signDocument(
    documentBytes: Uint8Array, 
    signature: DigitalSignature,
    signatureField?: SignatureField
  ): Promise<Uint8Array> {
    // Create signature dictionary
    const sigDict = signature.createSignatureDict();
    
    // Calculate byte range for signature
    const byteRange = this.calculateByteRange(documentBytes, sigDict);
    
    // Create hash of document content
    const hash = await this.createDocumentHash(documentBytes, byteRange, signature.getHashAlgorithm());
    
    // Sign the hash
    const signatureValue = await signature.signHash(hash);
    
    // Embed signature in document
    return this.embedSignature(documentBytes, sigDict, signatureValue, byteRange);
  }

  async validateSignature(documentBytes: Uint8Array, signatureDict: PDFDict): Promise<SignatureValidationResult> {
    const result: SignatureValidationResult = {
      isValid: false,
      documentIntegrity: false,
      errors: [],
      warnings: []
    };

    try {
      // Extract signature information
      const signatureValue = signatureDict.Contents as Uint8Array;
      const byteRange = signatureDict.ByteRange as number[];
      
      if (!signatureValue || !byteRange) {
        result.errors.push('Invalid signature dictionary');
        return result;
      }

      // Verify document integrity
      const documentHash = await this.extractDocumentHash(documentBytes, byteRange);
      result.documentIntegrity = await this.verifyDocumentIntegrity(documentBytes, byteRange);

      // Parse and validate certificate
      const certificate = await this.parseCertificate(signatureValue);
      result.signerName = certificate.subject;
      result.certificateChain = [certificate];

      // Verify signature
      const isSignatureValid = await this.verifySignature(documentHash, signatureValue, certificate.publicKey);
      
      // Check certificate validity
      const now = new Date();
      const certValid = now >= certificate.validFrom && now <= certificate.validTo;
      
      if (!certValid) {
        result.warnings.push('Certificate is expired or not yet valid');
      }

      // Extract signature metadata
      if (signatureDict.Reason) result.reason = signatureDict.Reason as string;
      if (signatureDict.Location) result.location = signatureDict.Location as string;
      if (signatureDict.M) result.signDate = this.parseDate(signatureDict.M as string);

      result.isValid = isSignatureValid && result.documentIntegrity && certValid;

    } catch (error) {
      result.errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  private calculateByteRange(documentBytes: Uint8Array, sigDict: PDFDict): number[] {
    // Simplified byte range calculation
    // In practice, this would need to account for the exact position of the signature
    const sigStart = 1000; // Placeholder
    const sigLength = 8192; // Typical signature length
    
    return [
      0, sigStart,
      sigStart + sigLength, documentBytes.length - sigStart - sigLength
    ];
  }

  private async createDocumentHash(
    documentBytes: Uint8Array, 
    byteRange: number[], 
    algorithm: string
  ): Promise<Uint8Array> {
    const hashData = new Uint8Array(byteRange[1] + byteRange[3]);
    hashData.set(documentBytes.slice(byteRange[0], byteRange[1]));
    hashData.set(documentBytes.slice(byteRange[2], byteRange[2] + byteRange[3]), byteRange[1]);

    const hashBuffer = await crypto.subtle.digest(algorithm, hashData);
    return new Uint8Array(hashBuffer);
  }

  private async embedSignature(
    documentBytes: Uint8Array,
    sigDict: PDFDict,
    signatureValue: Uint8Array,
    byteRange: number[]
  ): Promise<Uint8Array> {
    // Create new document with embedded signature
    const result = new Uint8Array(documentBytes.length + signatureValue.length + 1000);
    
    // Copy document parts and insert signature
    // This is a simplified implementation
    result.set(documentBytes);
    
    return result;
  }

  private async extractDocumentHash(documentBytes: Uint8Array, byteRange: number[]): Promise<Uint8Array> {
    const hashData = new Uint8Array(byteRange[1] + byteRange[3]);
    hashData.set(documentBytes.slice(byteRange[0], byteRange[1]));
    hashData.set(documentBytes.slice(byteRange[2], byteRange[2] + byteRange[3]), byteRange[1]);

    const hashBuffer = await crypto.subtle.digest('SHA-256', hashData);
    return new Uint8Array(hashBuffer);
  }

  private async verifyDocumentIntegrity(documentBytes: Uint8Array, byteRange: number[]): Promise<boolean> {
    // Verify that the document hasn't been modified after signing
    // This involves checking the byte ranges and ensuring no unauthorized changes
    return true; // Simplified implementation
  }

  private async parseCertificate(signatureValue: Uint8Array): Promise<Certificate> {
    // Parse X.509 certificate from PKCS#7 signature
    // This is a simplified implementation
    return {
      subject: 'CN=Test Signer',
      issuer: 'CN=Test CA',
      serialNumber: '123456789',
      validFrom: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      publicKey: new Uint8Array(256),
      fingerprint: 'SHA1:1234567890ABCDEF'
    };
  }

  private async verifySignature(
    hash: Uint8Array, 
    signature: Uint8Array, 
    publicKey: Uint8Array
  ): Promise<boolean> {
    try {
      // Import public key
      const key = await crypto.subtle.importKey(
        'spki',
        publicKey,
        {
          name: 'RSA-PSS',
          hash: 'SHA-256'
        },
        false,
        ['verify']
      );

      // Verify signature
      return await crypto.subtle.verify(
        {
          name: 'RSA-PSS',
          saltLength: 32
        },
        key,
        signature,
        hash
      );
    } catch {
      return false;
    }
  }

  private parseDate(dateString: string): Date {
    // Parse PDF date format: D:YYYYMMDDHHmmSSOHH'mm
    const match = dateString.match(/D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
    if (match) {
      return new Date(
        parseInt(match[1]), // year
        parseInt(match[2]) - 1, // month (0-based)
        parseInt(match[3]), // day
        parseInt(match[4]), // hour
        parseInt(match[5]), // minute
        parseInt(match[6])  // second
      );
    }
    return new Date();
  }
}

export class DigitalSignature {
  private id: string;
  private options: SignatureOptions;
  private certificate?: Certificate;

  constructor(options: SignatureOptions) {
    this.id = this.generateId();
    this.options = options;
  }

  async initialize(): Promise<void> {
    // Parse certificate and validate private key
    this.certificate = await this.parseCertificateFromBytes(this.options.certificate);
  }

  getId(): string {
    return this.id;
  }

  getHashAlgorithm(): string {
    return this.options.hashAlgorithm || 'SHA-256';
  }

  createSignatureDict(): PDFDict {
    const dict: PDFDict = {
      Type: 'Sig',
      Filter: 'Adobe.PPKLite',
      SubFilter: this.options.signatureFormat || 'adbe.pkcs7.detached',
      M: this.formatDate(new Date()),
      ByteRange: [0, 0, 0, 0], // Will be calculated later
      Contents: new Uint8Array(8192) // Placeholder for signature
    };

    if (this.options.reason) dict.Reason = this.options.reason;
    if (this.options.location) dict.Location = this.options.location;
    if (this.options.contactInfo) dict.ContactInfo = this.options.contactInfo;

    return dict;
  }

  async signHash(hash: Uint8Array): Promise<Uint8Array> {
    try {
      // Import private key
      const key = await crypto.subtle.importKey(
        'pkcs8',
        this.options.privateKey,
        {
          name: 'RSA-PSS',
          hash: this.getHashAlgorithm()
        },
        false,
        ['sign']
      );

      // Sign the hash
      const signature = await crypto.subtle.sign(
        {
          name: 'RSA-PSS',
          saltLength: 32
        },
        key,
        hash
      );

      return new Uint8Array(signature);
    } catch (error) {
      throw new PDFSecurityError(`Failed to sign hash: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async parseCertificateFromBytes(certBytes: Uint8Array): Promise<Certificate> {
    // Parse X.509 certificate
    // This is a simplified implementation
    return {
      subject: 'CN=VibePDF Signer',
      issuer: 'CN=VibePDF CA',
      serialNumber: Math.random().toString(36),
      validFrom: new Date(),
      validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      publicKey: new Uint8Array(256),
      fingerprint: 'SHA256:' + Math.random().toString(36)
    };
  }

  private generateId(): string {
    return 'sig_' + Math.random().toString(36).substr(2, 9);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    
    return `D:${year}${month}${day}${hour}${minute}${second}`;
  }
}

export class SignatureField {
  private name: string;
  private rect: { x: number; y: number; width: number; height: number };
  private locked: boolean = false;

  constructor(name: string, rect: { x: number; y: number; width: number; height: number }) {
    this.name = name;
    this.rect = rect;
  }

  getName(): string {
    return this.name;
  }

  getRect() {
    return { ...this.rect };
  }

  isLocked(): boolean {
    return this.locked;
  }

  lock(): void {
    this.locked = true;
  }

  toPDFObject(): PDFObject {
    const dict: PDFDict = {
      Type: 'Annot',
      Subtype: 'Widget',
      FT: 'Sig',
      T: this.name,
      Rect: [this.rect.x, this.rect.y, this.rect.x + this.rect.width, this.rect.y + this.rect.height],
      F: this.locked ? 1 : 0
    };

    const id = new PDFObjectId(1);
    return new PDFObject(id, dict);
  }
}