/**
 * PDF 2.0 (ISO 32000-2) Compliance Implementation
 */

import { 
  PDFDict, 
  PDFArray, 
  PDFRef,
  PDFMetadata,
  ComplianceLevel,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  PDFError 
} from '../types/index.js';
import { PDFObject, PDFObjectId } from '../core/PDFObject.js';

export enum PDF20Feature {
  // New content stream operators
  RICH_MEDIA = 'rich_media',
  ENHANCED_ANNOTATIONS = 'enhanced_annotations',
  IMPROVED_ACCESSIBILITY = 'improved_accessibility',
  
  // Enhanced security
  AES_256_ENCRYPTION = 'aes_256_encryption',
  DIGITAL_SIGNATURES_V2 = 'digital_signatures_v2',
  
  // New object types
  COLLECTION_ITEMS = 'collection_items',
  PORTABLE_COLLECTIONS = 'portable_collections',
  ASSOCIATED_FILES = 'associated_files',
  
  // Enhanced forms
  RICH_TEXT_FIELDS = 'rich_text_fields',
  SIGNATURE_FIELDS_V2 = 'signature_fields_v2',
  
  // Color management
  NAMED_COLOR_SPACES = 'named_color_spaces',
  OUTPUT_INTENTS_V2 = 'output_intents_v2',
  
  // Transparency
  TRANSPARENCY_V2 = 'transparency_v2',
  BLEND_MODES_V2 = 'blend_modes_v2',
  
  // Metadata
  XMP_METADATA_V2 = 'xmp_metadata_v2',
  STRUCTURE_ELEMENTS_V2 = 'structure_elements_v2'
}

export interface PDF20ComplianceOptions {
  version: '2.0';
  enabledFeatures: PDF20Feature[];
  strictMode: boolean;
  backwardCompatibility: boolean;
  validateExtensions: boolean;
}

export class PDF20ComplianceManager {
  private options: PDF20ComplianceOptions;
  private supportedFeatures: Set<PDF20Feature> = new Set();

  constructor(options: Partial<PDF20ComplianceOptions> = {}) {
    this.options = {
      version: '2.0',
      enabledFeatures: [],
      strictMode: true,
      backwardCompatibility: true,
      validateExtensions: true,
      ...options
    };

    this.initializeSupportedFeatures();
  }

  private initializeSupportedFeatures(): void {
    // Initialize all PDF 2.0 features as supported
    Object.values(PDF20Feature).forEach(feature => {
      this.supportedFeatures.add(feature);
    });
  }

  // PDF 2.0 Document Structure Validation
  validatePDF20Document(document: any): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      info: [],
      compliance: [{
        level: ComplianceLevel.PDF_2_0,
        isCompliant: true,
        errors: [],
        warnings: []
      }]
    };

    // Validate PDF version
    this.validateVersion(document, result);
    
    // Validate new PDF 2.0 features
    this.validateRichMedia(document, result);
    this.validateEnhancedAnnotations(document, result);
    this.validateImprovedAccessibility(document, result);
    this.validateEnhancedSecurity(document, result);
    this.validateCollections(document, result);
    this.validateEnhancedForms(document, result);
    this.validateColorManagement(document, result);
    this.validateTransparency(document, result);
    this.validateMetadata(document, result);

    // Check backward compatibility if enabled
    if (this.options.backwardCompatibility) {
      this.validateBackwardCompatibility(document, result);
    }

    result.isValid = result.errors.filter(e => e.severity === 'critical' || e.severity === 'error').length === 0;
    return result;
  }

  private validateVersion(document: any, result: ValidationResult): void {
    const version = document.getVersion?.();
    
    if (!version || !version.startsWith('2.')) {
      result.errors.push({
        code: 'PDF20_INVALID_VERSION',
        message: `PDF 2.0 compliance requires version 2.x, found: ${version || 'unknown'}`,
        severity: 'error'
      });
    }

    // Check for proper version declaration in catalog
    const catalog = document.getCatalog?.();
    if (catalog && !catalog.Version) {
      result.warnings.push({
        code: 'PDF20_MISSING_VERSION_DECLARATION',
        message: 'PDF 2.0 documents should declare version in catalog',
        suggestion: 'Add Version entry to document catalog'
      });
    }
  }

  private validateRichMedia(document: any, result: ValidationResult): void {
    if (!this.options.enabledFeatures.includes(PDF20Feature.RICH_MEDIA)) {
      return;
    }

    const richMediaAnnotations = document.getRichMediaAnnotations?.() || [];
    
    for (const annotation of richMediaAnnotations) {
      // Validate RichMedia annotation structure
      if (!annotation.hasValidConfiguration?.()) {
        result.errors.push({
          code: 'PDF20_INVALID_RICH_MEDIA',
          message: 'RichMedia annotation has invalid configuration',
          severity: 'error',
          location: `Annotation: ${annotation.getId?.() || 'Unknown'}`
        });
      }

      // Check for required RichMedia content
      if (!annotation.hasContent?.()) {
        result.errors.push({
          code: 'PDF20_MISSING_RICH_MEDIA_CONTENT',
          message: 'RichMedia annotation missing content',
          severity: 'error',
          location: `Annotation: ${annotation.getId?.() || 'Unknown'}`
        });
      }

      // Validate activation conditions
      if (!annotation.hasValidActivation?.()) {
        result.warnings.push({
          code: 'PDF20_RICH_MEDIA_ACTIVATION',
          message: 'RichMedia annotation should specify activation conditions',
          suggestion: 'Define proper activation and deactivation conditions'
        });
      }
    }
  }

  private validateEnhancedAnnotations(document: any, result: ValidationResult): void {
    if (!this.options.enabledFeatures.includes(PDF20Feature.ENHANCED_ANNOTATIONS)) {
      return;
    }

    const annotations = document.getAllAnnotations?.() || [];
    
    for (const annotation of annotations) {
      // Check for PDF 2.0 specific annotation features
      if (annotation.hasRichContent?.()) {
        if (!annotation.isValidRichContent?.()) {
          result.errors.push({
            code: 'PDF20_INVALID_RICH_ANNOTATION',
            message: 'Annotation with rich content has invalid structure',
            severity: 'error',
            location: `Annotation: ${annotation.getId?.() || 'Unknown'}`
          });
        }
      }

      // Validate enhanced appearance streams
      if (annotation.hasEnhancedAppearance?.()) {
        if (!annotation.isValidEnhancedAppearance?.()) {
          result.warnings.push({
            code: 'PDF20_ENHANCED_APPEARANCE',
            message: 'Enhanced appearance stream may not be fully compliant',
            suggestion: 'Verify appearance stream follows PDF 2.0 specifications'
          });
        }
      }

      // Check for proper Unicode support
      if (annotation.hasTextContent?.() && !annotation.isUnicodeCompliant?.()) {
        result.warnings.push({
          code: 'PDF20_UNICODE_COMPLIANCE',
          message: 'Annotation text should use proper Unicode encoding',
          suggestion: 'Ensure all text uses UTF-8 or UTF-16 encoding'
        });
      }
    }
  }

  private validateImprovedAccessibility(document: any, result: ValidationResult): void {
    if (!this.options.enabledFeatures.includes(PDF20Feature.IMPROVED_ACCESSIBILITY)) {
      return;
    }

    // Check for enhanced structure tree
    const structureTree = document.getStructureTree?.();
    if (!structureTree) {
      result.errors.push({
        code: 'PDF20_MISSING_STRUCTURE_TREE',
        message: 'PDF 2.0 accessibility features require structure tree',
        severity: 'error'
      });
      return;
    }

    // Validate enhanced structure elements
    if (!structureTree.hasEnhancedElements?.()) {
      result.warnings.push({
        code: 'PDF20_BASIC_STRUCTURE_ELEMENTS',
        message: 'Consider using enhanced PDF 2.0 structure elements',
        suggestion: 'Use new structure element types for better accessibility'
      });
    }

    // Check for proper role mapping
    if (!structureTree.hasProperRoleMapping?.()) {
      result.warnings.push({
        code: 'PDF20_ROLE_MAPPING',
        message: 'Structure tree should include proper role mapping',
        suggestion: 'Define role mappings for custom structure elements'
      });
    }

    // Validate associated files for accessibility
    const associatedFiles = document.getAssociatedFiles?.() || [];
    for (const file of associatedFiles) {
      if (file.isAccessibilityRelated?.() && !file.hasProperMetadata?.()) {
        result.warnings.push({
          code: 'PDF20_ACCESSIBILITY_FILE_METADATA',
          message: 'Accessibility-related associated files should have proper metadata',
          suggestion: 'Add descriptive metadata to associated files'
        });
      }
    }
  }

  private validateEnhancedSecurity(document: any, result: ValidationResult): void {
    if (!this.options.enabledFeatures.includes(PDF20Feature.AES_256_ENCRYPTION)) {
      return;
    }

    if (document.isEncrypted?.()) {
      const encryptionInfo = document.getEncryptionInfo?.();
      
      // Validate AES-256 encryption
      if (encryptionInfo?.algorithm !== 'AES-256') {
        result.warnings.push({
          code: 'PDF20_ENCRYPTION_ALGORITHM',
          message: 'PDF 2.0 recommends AES-256 encryption',
          suggestion: 'Use AES-256 encryption for enhanced security'
        });
      }

      // Check for proper key derivation
      if (!encryptionInfo?.hasProperKeyDerivation?.()) {
        result.errors.push({
          code: 'PDF20_KEY_DERIVATION',
          message: 'PDF 2.0 encryption requires proper key derivation',
          severity: 'error'
        });
      }

      // Validate encryption dictionary
      if (!encryptionInfo?.isValidEncryptionDict?.()) {
        result.errors.push({
          code: 'PDF20_ENCRYPTION_DICT',
          message: 'Encryption dictionary is not valid for PDF 2.0',
          severity: 'error'
        });
      }
    }

    // Validate digital signatures
    if (this.options.enabledFeatures.includes(PDF20Feature.DIGITAL_SIGNATURES_V2)) {
      const signatures = document.getDigitalSignatures?.() || [];
      
      for (const signature of signatures) {
        if (!signature.isPDF20Compliant?.()) {
          result.warnings.push({
            code: 'PDF20_SIGNATURE_COMPLIANCE',
            message: 'Digital signature should use PDF 2.0 enhancements',
            suggestion: 'Use enhanced signature features for better security'
          });
        }

        // Check for long-term validation
        if (!signature.hasLongTermValidation?.()) {
          result.warnings.push({
            code: 'PDF20_LTV_SIGNATURE',
            message: 'Consider adding long-term validation information',
            suggestion: 'Include timestamp and revocation information'
          });
        }
      }
    }
  }

  private validateCollections(document: any, result: ValidationResult): void {
    if (!this.options.enabledFeatures.includes(PDF20Feature.PORTABLE_COLLECTIONS)) {
      return;
    }

    const collection = document.getCollection?.();
    if (collection) {
      // Validate collection dictionary
      if (!collection.isValidCollectionDict?.()) {
        result.errors.push({
          code: 'PDF20_INVALID_COLLECTION',
          message: 'Collection dictionary is not valid',
          severity: 'error'
        });
      }

      // Check collection items
      const items = collection.getItems?.() || [];
      for (const item of items) {
        if (!item.hasRequiredMetadata?.()) {
          result.warnings.push({
            code: 'PDF20_COLLECTION_ITEM_METADATA',
            message: 'Collection items should have complete metadata',
            suggestion: 'Add descriptive metadata to all collection items'
          });
        }

        // Validate associated files
        if (item.hasAssociatedFiles?.()) {
          const files = item.getAssociatedFiles?.() || [];
          for (const file of files) {
            if (!file.isValidAssociatedFile?.()) {
              result.errors.push({
                code: 'PDF20_INVALID_ASSOCIATED_FILE',
                message: 'Associated file is not properly structured',
                severity: 'error',
                location: `File: ${file.getName?.() || 'Unknown'}`
              });
            }
          }
        }
      }

      // Check collection schema
      if (!collection.hasValidSchema?.()) {
        result.warnings.push({
          code: 'PDF20_COLLECTION_SCHEMA',
          message: 'Collection should define a proper schema',
          suggestion: 'Define collection field schema for better organization'
        });
      }
    }
  }

  private validateEnhancedForms(document: any, result: ValidationResult): void {
    if (!this.options.enabledFeatures.includes(PDF20Feature.RICH_TEXT_FIELDS)) {
      return;
    }

    const form = document.getForm?.();
    if (form) {
      const fields = form.getAllFields?.() || [];
      
      for (const field of fields) {
        // Check for rich text capabilities
        if (field.isRichTextField?.()) {
          if (!field.hasValidRichTextFormat?.()) {
            result.errors.push({
              code: 'PDF20_INVALID_RICH_TEXT',
              message: 'Rich text field has invalid formatting',
              severity: 'error',
              location: `Field: ${field.getName?.() || 'Unknown'}`
            });
          }

          // Validate rich text content
          if (!field.isValidRichTextContent?.()) {
            result.warnings.push({
              code: 'PDF20_RICH_TEXT_CONTENT',
              message: 'Rich text content may not be properly structured',
              suggestion: 'Ensure rich text follows PDF 2.0 specifications'
            });
          }
        }

        // Check signature fields
        if (field.isSignatureField?.() && this.options.enabledFeatures.includes(PDF20Feature.SIGNATURE_FIELDS_V2)) {
          if (!field.isPDF20SignatureField?.()) {
            result.warnings.push({
              code: 'PDF20_SIGNATURE_FIELD',
              message: 'Signature field should use PDF 2.0 enhancements',
              suggestion: 'Use enhanced signature field features'
            });
          }
        }

        // Validate field calculations
        if (field.hasCalculation?.() && !field.isValidCalculation?.()) {
          result.warnings.push({
            code: 'PDF20_FIELD_CALCULATION',
            message: 'Field calculation may not be compatible with PDF 2.0',
            suggestion: 'Verify calculation scripts are PDF 2.0 compliant'
          });
        }
      }
    }
  }

  private validateColorManagement(document: any, result: ValidationResult): void {
    if (!this.options.enabledFeatures.includes(PDF20Feature.NAMED_COLOR_SPACES)) {
      return;
    }

    const colorSpaces = document.getColorSpaces?.() || [];
    
    for (const colorSpace of colorSpaces) {
      // Check for PDF 2.0 color space features
      if (colorSpace.isNamedColorSpace?.()) {
        if (!colorSpace.isValidNamedColorSpace?.()) {
          result.errors.push({
            code: 'PDF20_INVALID_NAMED_COLOR_SPACE',
            message: 'Named color space is not properly defined',
            severity: 'error',
            location: `ColorSpace: ${colorSpace.getName?.() || 'Unknown'}`
          });
        }
      }

      // Validate ICC profiles
      if (colorSpace.hasICCProfile?.()) {
        const profile = colorSpace.getICCProfile?.();
        if (!profile?.isPDF20Compatible?.()) {
          result.warnings.push({
            code: 'PDF20_ICC_PROFILE',
            message: 'ICC profile should be compatible with PDF 2.0',
            suggestion: 'Use ICC profiles that support PDF 2.0 features'
          });
        }
      }
    }

    // Check output intents
    if (this.options.enabledFeatures.includes(PDF20Feature.OUTPUT_INTENTS_V2)) {
      const outputIntents = document.getOutputIntents?.() || [];
      
      for (const intent of outputIntents) {
        if (!intent.isPDF20Compatible?.()) {
          result.warnings.push({
            code: 'PDF20_OUTPUT_INTENT',
            message: 'Output intent should use PDF 2.0 enhancements',
            suggestion: 'Update output intent to use PDF 2.0 features'
          });
        }
      }
    }
  }

  private validateTransparency(document: any, result: ValidationResult): void {
    if (!this.options.enabledFeatures.includes(PDF20Feature.TRANSPARENCY_V2)) {
      return;
    }

    const pages = document.getPages?.() || [];
    
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      
      if (page.hasTransparency?.()) {
        // Check for PDF 2.0 transparency features
        if (!page.isValidPDF20Transparency?.()) {
          result.warnings.push({
            code: 'PDF20_TRANSPARENCY',
            message: `Page ${i + 1} transparency may not use PDF 2.0 enhancements`,
            suggestion: 'Use enhanced transparency features for better rendering',
            location: `Page ${i + 1}`
          });
        }

        // Validate blend modes
        if (this.options.enabledFeatures.includes(PDF20Feature.BLEND_MODES_V2)) {
          const blendModes = page.getBlendModes?.() || [];
          for (const mode of blendModes) {
            if (!mode.isPDF20Compatible?.()) {
              result.warnings.push({
                code: 'PDF20_BLEND_MODE',
                message: `Blend mode '${mode}' should use PDF 2.0 enhancements`,
                suggestion: 'Use enhanced blend modes for better color accuracy'
              });
            }
          }
        }
      }
    }
  }

  private validateMetadata(document: any, result: ValidationResult): void {
    if (!this.options.enabledFeatures.includes(PDF20Feature.XMP_METADATA_V2)) {
      return;
    }

    const metadata = document.getMetadata?.();
    
    // Check for XMP metadata
    if (!metadata?.hasXMPMetadata?.()) {
      result.warnings.push({
        code: 'PDF20_MISSING_XMP',
        message: 'PDF 2.0 documents should include XMP metadata',
        suggestion: 'Add XMP metadata for better document management'
      });
    } else {
      const xmp = metadata.getXMPMetadata?.();
      
      // Validate XMP structure
      if (!xmp?.isPDF20Compatible?.()) {
        result.warnings.push({
          code: 'PDF20_XMP_COMPATIBILITY',
          message: 'XMP metadata should use PDF 2.0 enhancements',
          suggestion: 'Update XMP metadata to include PDF 2.0 specific properties'
        });
      }

      // Check for required metadata fields
      const requiredFields = ['dc:title', 'dc:creator', 'xmp:CreateDate', 'xmp:ModifyDate'];
      for (const field of requiredFields) {
        if (!xmp?.hasField?.(field)) {
          result.warnings.push({
            code: 'PDF20_MISSING_METADATA_FIELD',
            message: `Missing recommended metadata field: ${field}`,
            suggestion: `Add ${field} to document metadata`
          });
        }
      }
    }

    // Validate structure tree metadata
    if (this.options.enabledFeatures.includes(PDF20Feature.STRUCTURE_ELEMENTS_V2)) {
      const structureTree = document.getStructureTree?.();
      if (structureTree && !structureTree.hasProperMetadata?.()) {
        result.warnings.push({
          code: 'PDF20_STRUCTURE_METADATA',
          message: 'Structure tree should include proper metadata',
          suggestion: 'Add metadata to structure elements for better accessibility'
        });
      }
    }
  }

  private validateBackwardCompatibility(document: any, result: ValidationResult): void {
    // Check if document can be opened by PDF 1.7 readers
    const incompatibleFeatures = this.findIncompatibleFeatures(document);
    
    if (incompatibleFeatures.length > 0) {
      result.warnings.push({
        code: 'PDF20_BACKWARD_COMPATIBILITY',
        message: `Document uses features incompatible with PDF 1.7: ${incompatibleFeatures.join(', ')}`,
        suggestion: 'Consider providing fallback content for older PDF readers'
      });
    }

    // Check for proper extension declarations
    const extensions = document.getExtensions?.() || [];
    for (const extension of extensions) {
      if (!extension.isProperlyDeclared?.()) {
        result.warnings.push({
          code: 'PDF20_EXTENSION_DECLARATION',
          message: 'PDF extensions should be properly declared',
          suggestion: 'Add proper extension declarations for compatibility'
        });
      }
    }
  }

  private findIncompatibleFeatures(document: any): string[] {
    const incompatible: string[] = [];
    
    // Check for features that require PDF 2.0
    if (document.hasRichMedia?.()) {
      incompatible.push('RichMedia annotations');
    }
    
    if (document.hasAssociatedFiles?.()) {
      incompatible.push('Associated files');
    }
    
    if (document.hasPortableCollections?.()) {
      incompatible.push('Portable collections');
    }
    
    if (document.hasEnhancedEncryption?.()) {
      incompatible.push('Enhanced encryption');
    }
    
    return incompatible;
  }

  // PDF 2.0 Feature Creation Helpers
  createRichMediaAnnotation(config: any): PDFDict {
    return {
      Type: 'Annot',
      Subtype: 'RichMedia',
      RichMediaSettings: config.settings || {},
      RichMediaContent: config.content || {},
      RichMediaActivation: config.activation || { Condition: 'PV' },
      RichMediaDeactivation: config.deactivation || { Condition: 'PC' }
    };
  }

  createAssociatedFile(fileSpec: any, relationship: string): PDFDict {
    return {
      Type: 'Filespec',
      F: fileSpec.filename,
      UF: fileSpec.unicodeFilename || fileSpec.filename,
      EF: {
        F: fileSpec.embeddedFile
      },
      Desc: fileSpec.description || '',
      AFRelationship: relationship,
      CI: {
        CreationDate: new Date().toISOString(),
        ModDate: new Date().toISOString()
      }
    };
  }

  createCollectionDict(schema: any): PDFDict {
    return {
      Type: 'Collection',
      Schema: schema,
      D: schema.defaultSort || 'F', // Default sort field
      View: 'D' // Details view
    };
  }

  createEnhancedSignatureField(config: any): PDFDict {
    return {
      Type: 'Annot',
      Subtype: 'Widget',
      FT: 'Sig',
      T: config.name,
      SigFlags: 3, // SignaturesExist | AppendOnly
      Lock: config.lock || {},
      SV: config.seedValue || {},
      // PDF 2.0 enhancements
      ContactInfo: config.contactInfo,
      Reason: config.reason,
      Location: config.location,
      M: new Date().toISOString()
    };
  }

  // Utility methods
  isFeatureEnabled(feature: PDF20Feature): boolean {
    return this.options.enabledFeatures.includes(feature);
  }

  enableFeature(feature: PDF20Feature): void {
    if (!this.options.enabledFeatures.includes(feature)) {
      this.options.enabledFeatures.push(feature);
    }
  }

  disableFeature(feature: PDF20Feature): void {
    const index = this.options.enabledFeatures.indexOf(feature);
    if (index !== -1) {
      this.options.enabledFeatures.splice(index, 1);
    }
  }

  getEnabledFeatures(): PDF20Feature[] {
    return [...this.options.enabledFeatures];
  }

  getSupportedFeatures(): PDF20Feature[] {
    return Array.from(this.supportedFeatures);
  }
}

// PDF 2.0 Document Creator
export class PDF20DocumentCreator {
  private complianceManager: PDF20ComplianceManager;

  constructor(options?: Partial<PDF20ComplianceOptions>) {
    this.complianceManager = new PDF20ComplianceManager(options);
  }

  createPDF20Document(metadata: PDFMetadata): PDFDict {
    const catalog: PDFDict = {
      Type: 'Catalog',
      Version: '2.0',
      Pages: { objectNumber: 0, generationNumber: 0 }, // Will be set later
      Metadata: { objectNumber: 0, generationNumber: 0 }, // Will be set later
      MarkInfo: {
        Marked: true,
        UserProperties: false,
        Suspects: false
      },
      StructTreeRoot: { objectNumber: 0, generationNumber: 0 }, // Will be set later
      Lang: metadata.language || 'en-US'
    };

    // Add PDF 2.0 specific entries
    if (this.complianceManager.isFeatureEnabled(PDF20Feature.PORTABLE_COLLECTIONS)) {
      catalog.Collection = { objectNumber: 0, generationNumber: 0 };
    }

    if (this.complianceManager.isFeatureEnabled(PDF20Feature.ASSOCIATED_FILES)) {
      catalog.AF = [];
    }

    return catalog;
  }

  createXMPMetadata(metadata: PDFMetadata): string {
    const now = new Date().toISOString();
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
        xmlns:pdf="http://ns.adobe.com/pdf/1.3/"
        xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/"
        xmlns:dc="http://purl.org/dc/elements/1.1/"
        xmlns:xmp="http://ns.adobe.com/xap/1.0/"
        xmlns:xmpMM="http://ns.adobe.com/xap/1.0/mm/"
        xmlns:pdfx="http://ns.adobe.com/pdfx/1.3/">
      <pdf:PDFVersion>2.0</pdf:PDFVersion>
      <pdf:Producer>VibePDF v1.0.0</pdf:Producer>
      <dc:format>application/pdf</dc:format>
      <dc:title>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${metadata.title || 'Untitled'}</rdf:li>
        </rdf:Alt>
      </dc:title>
      <dc:creator>
        <rdf:Seq>
          <rdf:li>${metadata.author || 'Unknown'}</rdf:li>
        </rdf:Seq>
      </dc:creator>
      <dc:subject>
        <rdf:Bag>
          <rdf:li>${metadata.subject || ''}</rdf:li>
        </rdf:Bag>
      </dc:subject>
      <dc:description>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${metadata.subject || ''}</rdf:li>
        </rdf:Alt>
      </dc:description>
      <xmp:CreateDate>${metadata.creationDate?.toISOString() || now}</xmp:CreateDate>
      <xmp:ModifyDate>${metadata.modificationDate?.toISOString() || now}</xmp:ModifyDate>
      <xmp:CreatorTool>VibePDF Enterprise Library v1.0.0</xmp:CreatorTool>
      <xmpMM:DocumentID>uuid:${this.generateUUID()}</xmpMM:DocumentID>
      <xmpMM:InstanceID>uuid:${this.generateUUID()}</xmpMM:InstanceID>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>`;
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}