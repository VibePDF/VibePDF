/**
 * PDF Standards Compliance - PDF/A, PDF/UA, PDF/X support
 */

import { 
  PDFDict, 
  PDFArray, 
  PDFMetadata,
  PDFError 
} from '../types/index.js';
import { PDFObject, PDFObjectId } from '../core/PDFObject.js';

export enum ComplianceLevel {
  PDF_A_1A = 'PDF/A-1a',
  PDF_A_1B = 'PDF/A-1b',
  PDF_A_2A = 'PDF/A-2a',
  PDF_A_2B = 'PDF/A-2b',
  PDF_A_2U = 'PDF/A-2u',
  PDF_A_3A = 'PDF/A-3a',
  PDF_A_3B = 'PDF/A-3b',
  PDF_A_3U = 'PDF/A-3u',
  PDF_UA_1 = 'PDF/UA-1',
  PDF_X_1A = 'PDF/X-1a',
  PDF_X_3 = 'PDF/X-3',
  PDF_X_4 = 'PDF/X-4'
}

export interface ComplianceOptions {
  level: ComplianceLevel;
  title: string;
  language?: string;
  conformanceLevel?: string;
  colorProfile?: 'sRGB' | 'CMYK' | 'Grayscale';
  intent?: 'Document' | 'Image' | 'Graphic' | 'Text';
}

export interface ComplianceValidationResult {
  isCompliant: boolean;
  level: ComplianceLevel;
  errors: ComplianceError[];
  warnings: ComplianceWarning[];
  recommendations: string[];
}

export interface ComplianceError {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  location?: string;
}

export interface ComplianceWarning {
  code: string;
  message: string;
  suggestion: string;
}

export class PDFComplianceManager {
  private complianceLevel?: ComplianceLevel;
  private options?: ComplianceOptions;

  setComplianceLevel(options: ComplianceOptions): void {
    this.complianceLevel = options.level;
    this.options = options;
  }

  getComplianceLevel(): ComplianceLevel | undefined {
    return this.complianceLevel;
  }

  createComplianceMetadata(): PDFDict {
    if (!this.options) {
      throw new PDFError('Compliance level not set');
    }

    const metadata: PDFDict = {
      Type: 'Metadata',
      Subtype: 'XML'
    };

    // Generate XMP metadata based on compliance level
    const xmpData = this.generateXMPMetadata(this.options);
    metadata.Length = xmpData.length;

    return metadata;
  }

  validateCompliance(document: any): ComplianceValidationResult {
    if (!this.complianceLevel) {
      throw new PDFError('No compliance level set for validation');
    }

    const result: ComplianceValidationResult = {
      isCompliant: true,
      level: this.complianceLevel,
      errors: [],
      warnings: [],
      recommendations: []
    };

    // Validate based on compliance level
    switch (this.complianceLevel) {
      case ComplianceLevel.PDF_A_1A:
      case ComplianceLevel.PDF_A_1B:
        this.validatePDFA1(document, result);
        break;
      case ComplianceLevel.PDF_A_2A:
      case ComplianceLevel.PDF_A_2B:
      case ComplianceLevel.PDF_A_2U:
        this.validatePDFA2(document, result);
        break;
      case ComplianceLevel.PDF_A_3A:
      case ComplianceLevel.PDF_A_3B:
      case ComplianceLevel.PDF_A_3U:
        this.validatePDFA3(document, result);
        break;
      case ComplianceLevel.PDF_UA_1:
        this.validatePDFUA(document, result);
        break;
      case ComplianceLevel.PDF_X_1A:
      case ComplianceLevel.PDF_X_3:
      case ComplianceLevel.PDF_X_4:
        this.validatePDFX(document, result);
        break;
    }

    result.isCompliant = result.errors.length === 0;
    return result;
  }

  private generateXMPMetadata(options: ComplianceOptions): string {
    const conformanceLevel = this.getConformanceLevel(options.level);
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
        xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/"
        xmlns:dc="http://purl.org/dc/elements/1.1/"
        xmlns:xmp="http://ns.adobe.com/xap/1.0/">
      <pdfaid:part>${conformanceLevel.part}</pdfaid:part>
      <pdfaid:conformance>${conformanceLevel.conformance}</pdfaid:conformance>
      <dc:title>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${options.title}</rdf:li>
        </rdf:Alt>
      </dc:title>
      <xmp:CreatorTool>VibePDF v1.0.0</xmp:CreatorTool>
      <xmp:CreateDate>${new Date().toISOString()}</xmp:CreateDate>
      <xmp:ModifyDate>${new Date().toISOString()}</xmp:ModifyDate>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>`;
  }

  private getConformanceLevel(level: ComplianceLevel): { part: string; conformance: string } {
    switch (level) {
      case ComplianceLevel.PDF_A_1A: return { part: '1', conformance: 'A' };
      case ComplianceLevel.PDF_A_1B: return { part: '1', conformance: 'B' };
      case ComplianceLevel.PDF_A_2A: return { part: '2', conformance: 'A' };
      case ComplianceLevel.PDF_A_2B: return { part: '2', conformance: 'B' };
      case ComplianceLevel.PDF_A_2U: return { part: '2', conformance: 'U' };
      case ComplianceLevel.PDF_A_3A: return { part: '3', conformance: 'A' };
      case ComplianceLevel.PDF_A_3B: return { part: '3', conformance: 'B' };
      case ComplianceLevel.PDF_A_3U: return { part: '3', conformance: 'U' };
      default: return { part: '1', conformance: 'B' };
    }
  }

  private validatePDFA1(document: any, result: ComplianceValidationResult): void {
    // PDF/A-1 validation rules
    this.checkFontEmbedding(document, result);
    this.checkColorSpaces(document, result);
    this.checkEncryption(document, result);
    this.checkMetadata(document, result);
    this.checkTransparency(document, result);
  }

  private validatePDFA2(document: any, result: ComplianceValidationResult): void {
    // PDF/A-2 validation rules (includes PDF/A-1 + additional features)
    this.validatePDFA1(document, result);
    this.checkJPEG2000(document, result);
    this.checkLayers(document, result);
    this.checkAttachments(document, result);
  }

  private validatePDFA3(document: any, result: ComplianceValidationResult): void {
    // PDF/A-3 validation rules (includes PDF/A-2 + file attachments)
    this.validatePDFA2(document, result);
    this.checkFileAttachments(document, result);
  }

  private validatePDFUA(document: any, result: ComplianceValidationResult): void {
    // PDF/UA accessibility validation
    this.checkStructureTree(document, result);
    this.checkTaggedContent(document, result);
    this.checkAlternativeText(document, result);
    this.checkReadingOrder(document, result);
    this.checkLanguage(document, result);
    this.checkAccessibilityMetadata(document, result);
  }

  private validatePDFX(document: any, result: ComplianceValidationResult): void {
    // PDF/X prepress validation
    this.checkColorManagement(document, result);
    this.checkFonts(document, result);
    this.checkImages(document, result);
    this.checkTrimBox(document, result);
    this.checkBleedBox(document, result);
  }

  // Validation helper methods
  private checkFontEmbedding(document: any, result: ComplianceValidationResult): void {
    // Check that all fonts are embedded
    const fonts = document.getFonts?.() || [];
    for (const font of fonts) {
      if (!font.isEmbedded()) {
        result.errors.push({
          code: 'FONT_NOT_EMBEDDED',
          message: `Font '${font.getName()}' is not embedded`,
          severity: 'error',
          location: `Font: ${font.getName()}`
        });
      }
    }
  }

  private checkColorSpaces(document: any, result: ComplianceValidationResult): void {
    // Check for device-dependent color spaces
    const pages = document.getPages?.() || [];
    for (const page of pages) {
      // Implementation would check for DeviceRGB, DeviceCMYK, DeviceGray usage
      // and ensure ICC profiles are present
    }
  }

  private checkEncryption(document: any, result: ComplianceValidationResult): void {
    if (document.isEncrypted?.()) {
      result.errors.push({
        code: 'ENCRYPTION_NOT_ALLOWED',
        message: 'PDF/A documents cannot be encrypted',
        severity: 'error'
      });
    }
  }

  private checkMetadata(document: any, result: ComplianceValidationResult): void {
    const metadata = document.getMetadata?.();
    if (!metadata?.title) {
      result.warnings.push({
        code: 'MISSING_TITLE',
        message: 'Document title is missing',
        suggestion: 'Add a title to the document metadata'
      });
    }
  }

  private checkTransparency(document: any, result: ComplianceValidationResult): void {
    // PDF/A-1 doesn't allow transparency
    if (this.complianceLevel === ComplianceLevel.PDF_A_1A || 
        this.complianceLevel === ComplianceLevel.PDF_A_1B) {
      // Check for transparency usage
      result.recommendations.push('Avoid using transparency effects for PDF/A-1 compliance');
    }
  }

  private checkJPEG2000(document: any, result: ComplianceValidationResult): void {
    // PDF/A-2 allows JPEG2000
    result.recommendations.push('JPEG2000 compression is allowed in PDF/A-2');
  }

  private checkLayers(document: any, result: ComplianceValidationResult): void {
    // Check optional content groups (layers)
    const layers = document.getLayers?.() || [];
    if (layers.length > 0) {
      result.recommendations.push('Optional content (layers) detected - ensure proper configuration');
    }
  }

  private checkAttachments(document: any, result: ComplianceValidationResult): void {
    const attachments = document.getAttachments?.() || [];
    if (attachments.length > 0 && this.complianceLevel !== ComplianceLevel.PDF_A_3A &&
        this.complianceLevel !== ComplianceLevel.PDF_A_3B && this.complianceLevel !== ComplianceLevel.PDF_A_3U) {
      result.errors.push({
        code: 'ATTACHMENTS_NOT_ALLOWED',
        message: 'File attachments are only allowed in PDF/A-3',
        severity: 'error'
      });
    }
  }

  private checkFileAttachments(document: any, result: ComplianceValidationResult): void {
    // PDF/A-3 specific attachment validation
    const attachments = document.getAttachments?.() || [];
    for (const attachment of attachments) {
      if (!attachment.hasCompliantMetadata()) {
        result.warnings.push({
          code: 'ATTACHMENT_METADATA',
          message: `Attachment '${attachment.getName()}' may need additional metadata`,
          suggestion: 'Ensure all attachments have proper metadata for PDF/A-3 compliance'
        });
      }
    }
  }

  private checkStructureTree(document: any, result: ComplianceValidationResult): void {
    const structTree = document.getStructureTree?.();
    if (!structTree) {
      result.errors.push({
        code: 'MISSING_STRUCTURE_TREE',
        message: 'Document must have a structure tree for PDF/UA compliance',
        severity: 'error'
      });
    }
  }

  private checkTaggedContent(document: any, result: ComplianceValidationResult): void {
    // Check that all content is properly tagged
    const pages = document.getPages?.() || [];
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      if (!page.isTagged?.()) {
        result.errors.push({
          code: 'UNTAGGED_CONTENT',
          message: `Page ${i + 1} contains untagged content`,
          severity: 'error',
          location: `Page ${i + 1}`
        });
      }
    }
  }

  private checkAlternativeText(document: any, result: ComplianceValidationResult): void {
    // Check for alternative text on images and figures
    const images = document.getImages?.() || [];
    for (const image of images) {
      if (!image.hasAlternativeText?.()) {
        result.warnings.push({
          code: 'MISSING_ALT_TEXT',
          message: 'Image missing alternative text',
          suggestion: 'Add alternative text descriptions for all images'
        });
      }
    }
  }

  private checkReadingOrder(document: any, result: ComplianceValidationResult): void {
    // Validate logical reading order
    result.recommendations.push('Verify that the reading order is logical and follows document flow');
  }

  private checkLanguage(document: any, result: ComplianceValidationResult): void {
    const language = document.getLanguage?.();
    if (!language) {
      result.warnings.push({
        code: 'MISSING_LANGUAGE',
        message: 'Document language not specified',
        suggestion: 'Set the document language for better accessibility'
      });
    }
  }

  private checkAccessibilityMetadata(document: any, result: ComplianceValidationResult): void {
    // Check for accessibility-related metadata
    const metadata = document.getMetadata?.();
    if (!metadata?.accessibilityFeatures) {
      result.recommendations.push('Consider adding accessibility feature descriptions to metadata');
    }
  }

  private checkColorManagement(document: any, result: ComplianceValidationResult): void {
    // PDF/X color management validation
    const colorProfile = document.getOutputIntent?.();
    if (!colorProfile) {
      result.errors.push({
        code: 'MISSING_OUTPUT_INTENT',
        message: 'PDF/X documents must have an output intent',
        severity: 'error'
      });
    }
  }

  private checkFonts(document: any, result: ComplianceValidationResult): void {
    // PDF/X font validation
    this.checkFontEmbedding(document, result);
  }

  private checkImages(document: any, result: ComplianceValidationResult): void {
    // PDF/X image validation
    const images = document.getImages?.() || [];
    for (const image of images) {
      if (image.getResolution?.() < 300) {
        result.warnings.push({
          code: 'LOW_RESOLUTION_IMAGE',
          message: 'Image resolution below 300 DPI may not be suitable for print',
          suggestion: 'Use higher resolution images for print production'
        });
      }
    }
  }

  private checkTrimBox(document: any, result: ComplianceValidationResult): void {
    const pages = document.getPages?.() || [];
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      if (!page.getTrimBox?.()) {
        result.warnings.push({
          code: 'MISSING_TRIM_BOX',
          message: `Page ${i + 1} missing trim box`,
          suggestion: 'Define trim boxes for proper print production'
        });
      }
    }
  }

  private checkBleedBox(document: any, result: ComplianceValidationResult): void {
    const pages = document.getPages?.() || [];
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      if (!page.getBleedBox?.()) {
        result.recommendations.push(`Consider adding bleed box to page ${i + 1} for print production`);
      }
    }
  }
}

export class AccessibilityHelper {
  static createStructureTree(): PDFDict {
    return {
      Type: 'StructTreeRoot',
      K: [], // Structure elements
      RoleMap: {}, // Role mappings
      ClassMap: {} // Class mappings
    };
  }

  static createStructureElement(type: string, children?: any[]): PDFDict {
    const element: PDFDict = {
      Type: 'StructElem',
      S: type
    };

    if (children && children.length > 0) {
      element.K = children;
    }

    return element;
  }

  static addAlternativeText(element: PDFDict, altText: string): void {
    element.Alt = altText;
  }

  static addActualText(element: PDFDict, actualText: string): void {
    element.ActualText = actualText;
  }

  static setLanguage(element: PDFDict, language: string): void {
    element.Lang = language;
  }
}