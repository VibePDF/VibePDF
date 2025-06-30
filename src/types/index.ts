/**
 * VibePDF Core Types
 * Enterprise-grade TypeScript PDF library
 */

// PDF Object Types
export type PDFNumber = number;
export type PDFString = string;
export type PDFName = string;
export type PDFBoolean = boolean;
export type PDFNull = null;

export type PDFPrimitive = PDFNumber | PDFString | PDFName | PDFBoolean | PDFNull;

// PDF Object Reference
export interface PDFRef {
  objectNumber: number;
  generationNumber: number;
}

// PDF Dictionary
export interface PDFDict {
  [key: string]: PDFValue;
}

// PDF Array
export type PDFArray = PDFValue[];

// PDF Stream
export interface PDFStream {
  dict: PDFDict;
  data: Uint8Array;
}

// Union of all PDF values
export type PDFValue = 
  | PDFPrimitive 
  | PDFRef 
  | PDFDict 
  | PDFArray 
  | PDFStream;

// Color Models
export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface CMYKColor {
  c: number;
  m: number;
  y: number;
  k: number;
}

export type Color = RGBColor | CMYKColor;

// Geometry
export interface Point {
  x: number;
  y: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

// Font Types
export enum StandardFonts {
  Helvetica = 'Helvetica',
  HelveticaBold = 'Helvetica-Bold',
  HelveticaOblique = 'Helvetica-Oblique',
  HelveticaBoldOblique = 'Helvetica-BoldOblique',
  TimesRoman = 'Times-Roman',
  TimesBold = 'Times-Bold',
  TimesItalic = 'Times-Italic',
  TimesBoldItalic = 'Times-BoldItalic',
  Courier = 'Courier',
  CourierBold = 'Courier-Bold',
  CourierOblique = 'Courier-Oblique',
  CourierBoldOblique = 'Courier-BoldOblique',
  Symbol = 'Symbol',
  ZapfDingbats = 'ZapfDingbats'
}

export interface FontMetrics {
  unitsPerEm: number;
  ascent: number;
  descent: number;
  lineGap: number;
  capHeight: number;
  xHeight: number;
}

// Document Metadata
export interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
  language?: string;
  trapped?: 'True' | 'False' | 'Unknown';
}

// Page Configuration
export interface PageConfig {
  size: Size;
  margins?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  rotation?: 0 | 90 | 180 | 270;
  cropBox?: Rectangle;
  bleedBox?: Rectangle;
  trimBox?: Rectangle;
  artBox?: Rectangle;
}

// Standard Page Sizes
export const PageSizes = {
  A4: { width: 595.28, height: 841.89 },
  A3: { width: 841.89, height: 1190.55 },
  A5: { width: 420.94, height: 595.28 },
  A2: { width: 1190.55, height: 1683.78 },
  A1: { width: 1683.78, height: 2383.94 },
  A0: { width: 2383.94, height: 3370.39 },
  Letter: { width: 612, height: 792 },
  Legal: { width: 612, height: 1008 },
  Tabloid: { width: 792, height: 1224 },
  Ledger: { width: 1224, height: 792 },
  Executive: { width: 522, height: 756 },
  Folio: { width: 612, height: 936 },
  B4: { width: 708.66, height: 1000.63 },
  B5: { width: 498.90, height: 708.66 },
  Postcard: { width: 283.46, height: 419.53 },
  Crown: { width: 504, height: 648 },
  LargePost: { width: 612, height: 792 }
} as const;

// Drawing Options
export interface TextOptions {
  font?: string;
  size?: number;
  color?: Color;
  x?: number;
  y?: number;
  maxWidth?: number;
  lineHeight?: number;
  align?: 'left' | 'center' | 'right' | 'justify';
  characterSpacing?: number;
  wordSpacing?: number;
  horizontalScaling?: number;
  rise?: number;
  renderingMode?: 'fill' | 'stroke' | 'fillStroke' | 'invisible' | 'fillClip' | 'strokeClip' | 'fillStrokeClip' | 'clip';
}

export interface ImageOptions {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  preserveAspectRatio?: boolean;
  opacity?: number;
  rotation?: number;
  skewX?: number;
  skewY?: number;
}

export interface DrawOptions {
  lineWidth?: number;
  strokeColor?: Color;
  fillColor?: Color;
  lineCap?: 'butt' | 'round' | 'square';
  lineJoin?: 'miter' | 'round' | 'bevel';
  miterLimit?: number;
  dashArray?: number[];
  dashPhase?: number;
  opacity?: number;
  blendMode?: BlendMode;
}

export enum BlendMode {
  Normal = 'Normal',
  Multiply = 'Multiply',
  Screen = 'Screen',
  Overlay = 'Overlay',
  SoftLight = 'SoftLight',
  HardLight = 'HardLight',
  ColorDodge = 'ColorDodge',
  ColorBurn = 'ColorBurn',
  Darken = 'Darken',
  Lighten = 'Lighten',
  Difference = 'Difference',
  Exclusion = 'Exclusion',
  Hue = 'Hue',
  Saturation = 'Saturation',
  Color = 'Color',
  Luminosity = 'Luminosity'
}

// Compression Types
export enum CompressionType {
  None = 'None',
  FlateDecode = 'FlateDecode',
  LZWDecode = 'LZWDecode',
  DCTDecode = 'DCTDecode',
  CCITTFaxDecode = 'CCITTFaxDecode',
  ASCII85Decode = 'ASCII85Decode',
  ASCIIHexDecode = 'ASCIIHexDecode',
  RunLengthDecode = 'RunLengthDecode'
}

// Security & Encryption
export interface EncryptionOptions {
  algorithm: 'RC4' | 'AES-128' | 'AES-256';
  userPassword?: string;
  ownerPassword?: string;
  permissions?: PDFPermissions;
  encryptMetadata?: boolean;
}

export interface PDFPermissions {
  print?: boolean;
  modify?: boolean;
  copy?: boolean;
  annotate?: boolean;
  fillForms?: boolean;
  extractForAccessibility?: boolean;
  assemble?: boolean;
  printHighRes?: boolean;
}

// Document Structure
export interface DocumentStructure {
  version: string;
  pageCount: number;
  hasEncryption: boolean;
  hasDigitalSignatures: boolean;
  hasJavaScript: boolean;
  hasAttachments: boolean;
  hasAnnotations: boolean;
  hasForms: boolean;
  hasLayers: boolean;
  hasBookmarks: boolean;
  compliance?: ComplianceLevel[];
}

export enum ComplianceLevel {
  PDF_1_4 = 'PDF-1.4',
  PDF_1_7 = 'PDF-1.7',
  PDF_2_0 = 'PDF-2.0',
  PDF_A_1A = 'PDF/A-1a',
  PDF_A_1B = 'PDF/A-1b',
  PDF_A_2A = 'PDF/A-2a',
  PDF_A_2B = 'PDF/A-2b',
  PDF_A_2U = 'PDF/A-2u',
  PDF_A_3A = 'PDF/A-3a',
  PDF_A_3B = 'PDF/A-3b',
  PDF_A_3U = 'PDF/A-3u',
  PDF_A_4 = 'PDF/A-4',
  PDF_A_4E = 'PDF/A-4e',
  PDF_A_4F = 'PDF/A-4f',
  PDF_UA_1 = 'PDF/UA-1',
  PDF_UA_2 = 'PDF/UA-2',
  PDF_X_1A = 'PDF/X-1a',
  PDF_X_3 = 'PDF/X-3',
  PDF_X_4 = 'PDF/X-4',
  PDF_X_5G = 'PDF/X-5g',
  PDF_X_5N = 'PDF/X-5n',
  PDF_X_5PG = 'PDF/X-5pg',
  PDF_VT_1 = 'PDF/VT-1',
  PDF_VT_2 = 'PDF/VT-2',
  PDF_E_1 = 'PDF/E-1',
  PDF_E_2 = 'PDF/E-2'
}

// Rendering Options
export interface RenderOptions {
  scale?: number;
  rotation?: number;
  backgroundColor?: string;
  enableWebGL?: boolean;
  enableTextSelection?: boolean;
  enableAnnotations?: boolean;
  quality?: 'low' | 'medium' | 'high';
  antiAliasing?: boolean;
  subpixelRendering?: boolean;
}

export interface ViewportTransform {
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
}

export enum RenderingBackend {
  Canvas2D = 'canvas2d',
  WebGL = 'webgl',
  OffscreenCanvas = 'offscreen'
}

// Validation and Quality
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  info: ValidationInfo[];
  compliance: ComplianceResult[];
}

export interface ValidationError {
  code: string;
  message: string;
  severity: 'critical' | 'error' | 'warning' | 'info';
  location?: string;
  suggestion?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  suggestion: string;
  location?: string;
}

export interface ValidationInfo {
  code: string;
  message: string;
  details?: string;
}

export interface ComplianceResult {
  level: ComplianceLevel;
  isCompliant: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

// Performance Monitoring
export interface PerformanceMetrics {
  generationTime: number;
  renderingTime: number;
  memoryUsage: number;
  fileSize: number;
  compressionRatio: number;
  objectCount: number;
  pageCount: number;
  fontCount: number;
  imageCount: number;
}

// Error Types
export class PDFError extends Error {
  constructor(message: string, public code?: string, public details?: any) {
    super(message);
    this.name = 'PDFError';
  }
}

export class PDFParseError extends PDFError {
  constructor(message: string, public position?: number, public context?: string) {
    super(message, 'PARSE_ERROR');
    this.name = 'PDFParseError';
  }
}

export class PDFSecurityError extends PDFError {
  constructor(message: string, public securityLevel?: string) {
    super(message, 'SECURITY_ERROR');
    this.name = 'PDFSecurityError';
  }
}

export class PDFValidationError extends PDFError {
  constructor(message: string, public validationType?: string, public location?: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'PDFValidationError';
  }
}

export class PDFRenderError extends PDFError {
  constructor(message: string, public renderingBackend?: string) {
    super(message, 'RENDER_ERROR');
    this.name = 'PDFRenderError';
  }
}

export class PDFCompressionError extends PDFError {
  constructor(message: string, public compressionType?: string) {
    super(message, 'COMPRESSION_ERROR');
    this.name = 'PDFCompressionError';
  }
}

// Advanced Features
export interface LayerOptions {
  name: string;
  visible?: boolean;
  locked?: boolean;
  printable?: boolean;
  exportable?: boolean;
  zoomRange?: { min: number; max: number };
}

export interface BookmarkOptions {
  title: string;
  destination?: any;
  parent?: string;
  expanded?: boolean;
  color?: Color;
  style?: 'normal' | 'bold' | 'italic' | 'boldItalic';
}

export interface WatermarkOptions {
  text?: string;
  image?: Uint8Array;
  opacity?: number;
  rotation?: number;
  position?: 'center' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
  scale?: number;
  repeatPattern?: boolean;
}

// Quality Assurance
export interface QualityProfile {
  name: string;
  description: string;
  rules: QualityRule[];
  compliance: ComplianceLevel[];
}

export interface QualityRule {
  id: string;
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  category: 'structure' | 'content' | 'accessibility' | 'security' | 'performance';
  check: (document: any) => ValidationResult;
}

// Export interfaces for external use
export interface PDFExportOptions {
  format: 'pdf' | 'pdf/a' | 'pdf/x' | 'pdf/ua';
  version?: string;
  compression?: CompressionType;
  imageQuality?: number;
  linearize?: boolean;
  embedFonts?: boolean;
  subset?: boolean;
  metadata?: PDFMetadata;
  security?: EncryptionOptions;
  watermark?: WatermarkOptions;
}

// Import interfaces for parsing
export interface PDFImportOptions {
  password?: string;
  extractText?: boolean;
  extractImages?: boolean;
  extractForms?: boolean;
  extractAnnotations?: boolean;
  extractMetadata?: boolean;
  validateStructure?: boolean;
  repairErrors?: boolean;
}

// PDF 2.0 Specific Types
export interface PDF20Features {
  richMedia?: boolean;
  associatedFiles?: boolean;
  collections?: boolean;
  enhancedEncryption?: boolean;
  enhancedSignatures?: boolean;
  enhancedAccessibility?: boolean;
  enhancedForms?: boolean;
  enhancedColorManagement?: boolean;
  enhancedTransparency?: boolean;
  enhancedMetadata?: boolean;
}

export interface PDF20Metadata extends PDFMetadata {
  conformanceLevel?: string;
  pdfVersion?: '2.0';
  extensions?: string[];
  associatedFiles?: AssociatedFile[];
  collections?: Collection[];
}

export interface AssociatedFile {
  filename: string;
  description?: string;
  relationship: 'Source' | 'Data' | 'Alternative' | 'Supplement' | 'EncryptedPayload' | 'FormData' | 'Schema' | 'Unspecified';
  mimeType?: string;
  creationDate?: Date;
  modificationDate?: Date;
  checksum?: string;
  size?: number;
}

export interface Collection {
  schema: CollectionSchema;
  items: CollectionItem[];
  defaultSort?: string;
  view?: 'Details' | 'Tile' | 'Hidden';
}

export interface CollectionSchema {
  [fieldName: string]: CollectionField;
}

export interface CollectionField {
  type: 'Text' | 'Date' | 'Number' | 'Filename' | 'Desc' | 'ModDate' | 'CreationDate' | 'Size';
  name: string;
  order?: number;
  visible?: boolean;
  editable?: boolean;
}

export interface CollectionItem {
  filename: string;
  fields: { [fieldName: string]: any };
  associatedFiles?: AssociatedFile[];
}

// Enhanced Security Types for PDF 2.0
export interface PDF20EncryptionOptions extends EncryptionOptions {
  version?: '2.0';
  encryptionRevision?: 6;
  keyLength?: 256;
  streamEncryption?: boolean;
  stringEncryption?: boolean;
  embeddedFileEncryption?: boolean;
  authenticatedEncryption?: boolean;
}

export interface PDF20DigitalSignature {
  version: '2.0';
  signatureType: 'approval' | 'certification' | 'usage_rights';
  hashAlgorithm: 'SHA-256' | 'SHA-384' | 'SHA-512';
  encryptionAlgorithm: 'RSA' | 'ECDSA' | 'EdDSA';
  timestampServer?: string;
  longTermValidation?: boolean;
  documentTimeStamp?: boolean;
  signaturePolicy?: string;
  commitmentType?: string[];
  signerLocation?: string;
  signerContactInfo?: string;
  reason?: string;
}

// Enhanced Accessibility Types for PDF 2.0
export interface PDF20AccessibilityFeatures {
  structureVersion?: '2.0';
  enhancedTagging?: boolean;
  associatedContent?: boolean;
  alternativeDescriptions?: boolean;
  languageIdentification?: boolean;
  readingOrder?: boolean;
  colorContrast?: boolean;
  keyboardNavigation?: boolean;
  screenReaderSupport?: boolean;
}

export interface PDF20StructureElement {
  type: string;
  id?: string;
  title?: string;
  lang?: string;
  alt?: string;
  actualText?: string;
  expansion?: string;
  associatedFiles?: AssociatedFile[];
  children?: PDF20StructureElement[];
  attributes?: { [key: string]: any };
}

// Enhanced Forms Types for PDF 2.0
export interface PDF20FormField {
  type: 'text' | 'button' | 'choice' | 'signature' | 'barcode';
  name: string;
  value?: any;
  defaultValue?: any;
  required?: boolean;
  readOnly?: boolean;
  richText?: boolean;
  multiline?: boolean;
  password?: boolean;
  fileSelect?: boolean;
  doNotSpellCheck?: boolean;
  doNotScroll?: boolean;
  comb?: boolean;
  richTextValue?: string;
  richTextDefaultValue?: string;
  maxLength?: number;
  quadding?: 'left' | 'center' | 'right';
  actions?: FormAction[];
  calculation?: FormCalculation;
  validation?: FormValidation;
  format?: FormFormat;
}

export interface FormAction {
  trigger: 'keystroke' | 'format' | 'validate' | 'calculate' | 'focus' | 'blur' | 'mousedown' | 'mouseup';
  script: string;
  scriptType?: 'javascript' | 'formcalc';
}

export interface FormCalculation {
  order: number;
  script: string;
  scriptType?: 'javascript' | 'formcalc';
}

export interface FormValidation {
  script: string;
  scriptType?: 'javascript' | 'formcalc';
  message?: string;
}

export interface FormFormat {
  category: 'number' | 'percent' | 'date' | 'time' | 'text' | 'special' | 'custom';
  pattern?: string;
  locale?: string;
  decimals?: number;
  currency?: string;
  dateFormat?: string;
  timeFormat?: string;
}

// Enhanced Color Management for PDF 2.0
export interface PDF20ColorSpace {
  type: 'DeviceGray' | 'DeviceRGB' | 'DeviceCMYK' | 'CalGray' | 'CalRGB' | 'Lab' | 'ICCBased' | 'Indexed' | 'Pattern' | 'Separation' | 'DeviceN' | 'Named';
  name?: string;
  iccProfile?: ICC_Profile;
  alternateSpace?: PDF20ColorSpace;
  components?: number;
  range?: number[];
  gamma?: number;
  whitePoint?: number[];
  blackPoint?: number[];
  matrix?: number[];
}

export interface ICC_Profile {
  version: string;
  deviceClass: 'input' | 'display' | 'output' | 'devicelink' | 'colorspace' | 'abstract' | 'namedcolor';
  colorSpace: 'XYZ' | 'Lab' | 'Luv' | 'YCbCr' | 'Yxy' | 'RGB' | 'GRAY' | 'HSV' | 'HLS' | 'CMYK' | 'CMY';
  connectionSpace: 'XYZ' | 'Lab';
  platform: 'APPL' | 'MSFT' | 'SGI' | 'SUNW' | 'TGNT';
  flags?: number;
  manufacturer?: string;
  model?: string;
  attributes?: number;
  renderingIntent?: 'perceptual' | 'relative' | 'saturation' | 'absolute';
  illuminant?: number[];
  creator?: string;
  description?: string;
  copyright?: string;
  data: Uint8Array;
}

export interface PDF20OutputIntent {
  type: 'GTS_PDFX' | 'GTS_PDFA1' | 'ISO_PDFE1' | 'GTS_PDFVT1' | 'Custom';
  outputCondition?: string;
  outputConditionIdentifier?: string;
  registryName?: string;
  info?: string;
  destOutputProfile?: ICC_Profile;
  destOutputProfileRef?: PDFRef;
}