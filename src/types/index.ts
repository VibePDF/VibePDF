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
}

// Standard Page Sizes
export const PageSizes = {
  A4: { width: 595.28, height: 841.89 },
  A3: { width: 841.89, height: 1190.55 },
  A5: { width: 420.94, height: 595.28 },
  Letter: { width: 612, height: 792 },
  Legal: { width: 612, height: 1008 },
  Tabloid: { width: 792, height: 1224 }
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
}

export interface ImageOptions {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  preserveAspectRatio?: boolean;
}

export interface DrawOptions {
  lineWidth?: number;
  strokeColor?: Color;
  fillColor?: Color;
  lineCap?: 'butt' | 'round' | 'square';
  lineJoin?: 'miter' | 'round' | 'bevel';
  opacity?: number;
}

// Compression Types
export enum CompressionType {
  None = 'None',
  FlateDecode = 'FlateDecode',
  LZWDecode = 'LZWDecode',
  DCTDecode = 'DCTDecode',
  CCITTFaxDecode = 'CCITTFaxDecode'
}

// Security & Encryption
export interface EncryptionOptions {
  algorithm: 'RC4' | 'AES-128' | 'AES-256';
  userPassword?: string;
  ownerPassword?: string;
  permissions?: PDFPermissions;
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

// Error Types
export class PDFError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'PDFError';
  }
}

export class PDFParseError extends PDFError {
  constructor(message: string, public position?: number) {
    super(message, 'PARSE_ERROR');
    this.name = 'PDFParseError';
  }
}

export class PDFSecurityError extends PDFError {
  constructor(message: string) {
    super(message, 'SECURITY_ERROR');
    this.name = 'PDFSecurityError';
  }
}