/**
 * PDF Annotations - Complete annotation support
 */

import { 
  PDFDict, 
  PDFArray, 
  PDFRef, 
  Point, 
  Rectangle, 
  Color, 
  RGBColor,
  PDFError 
} from '../types/index.js';
import { PDFObject, PDFObjectId } from '../core/PDFObject.js';

export enum AnnotationType {
  Text = 'Text',
  Link = 'Link',
  FreeText = 'FreeText',
  Line = 'Line',
  Square = 'Square',
  Circle = 'Circle',
  Polygon = 'Polygon',
  PolyLine = 'PolyLine',
  Highlight = 'Highlight',
  Underline = 'Underline',
  Squiggly = 'Squiggly',
  StrikeOut = 'StrikeOut',
  Stamp = 'Stamp',
  Caret = 'Caret',
  Ink = 'Ink',
  Popup = 'Popup',
  FileAttachment = 'FileAttachment',
  Sound = 'Sound',
  Movie = 'Movie',
  Widget = 'Widget',
  Screen = 'Screen',
  PrinterMark = 'PrinterMark',
  TrapNet = 'TrapNet',
  Watermark = 'Watermark',
  ThreeD = '3D',
  Redact = 'Redact'
}

export interface AnnotationOptions {
  type: AnnotationType;
  rect: Rectangle;
  contents?: string;
  author?: string;
  subject?: string;
  color?: Color;
  opacity?: number;
  flags?: number;
  border?: AnnotationBorder;
  appearance?: AnnotationAppearance;
}

export interface AnnotationBorder {
  width: number;
  style: 'solid' | 'dashed' | 'beveled' | 'inset' | 'underline';
  dashArray?: number[];
}

export interface AnnotationAppearance {
  normal?: PDFRef;
  rollover?: PDFRef;
  down?: PDFRef;
}

export class PDFAnnotationManager {
  private annotations: Map<string, PDFAnnotation> = new Map();
  private annotationObjects: PDFObject[] = [];

  addTextAnnotation(options: AnnotationOptions & { 
    icon?: 'Comment' | 'Key' | 'Note' | 'Help' | 'NewParagraph' | 'Paragraph' | 'Insert';
    open?: boolean;
  }): TextAnnotation {
    const annotation = new TextAnnotation(options);
    this.annotations.set(annotation.getId(), annotation);
    return annotation;
  }

  addLinkAnnotation(options: AnnotationOptions & {
    action: LinkAction;
    highlightMode?: 'None' | 'Invert' | 'Outline' | 'Push';
  }): LinkAnnotation {
    const annotation = new LinkAnnotation(options);
    this.annotations.set(annotation.getId(), annotation);
    return annotation;
  }

  addHighlightAnnotation(options: AnnotationOptions & {
    quadPoints: number[];
  }): HighlightAnnotation {
    const annotation = new HighlightAnnotation(options);
    this.annotations.set(annotation.getId(), annotation);
    return annotation;
  }

  addFreeTextAnnotation(options: AnnotationOptions & {
    defaultAppearance: string;
    alignment?: 'left' | 'center' | 'right';
    callout?: Point[];
  }): FreeTextAnnotation {
    const annotation = new FreeTextAnnotation(options);
    this.annotations.set(annotation.getId(), annotation);
    return annotation;
  }

  addStampAnnotation(options: AnnotationOptions & {
    name?: 'Approved' | 'Experimental' | 'NotApproved' | 'AsIs' | 'Expired' | 
           'NotForPublicRelease' | 'Confidential' | 'Final' | 'Sold' | 'Departmental' | 
           'ForComment' | 'TopSecret' | 'Draft' | 'ForPublicRelease';
  }): StampAnnotation {
    const annotation = new StampAnnotation(options);
    this.annotations.set(annotation.getId(), annotation);
    return annotation;
  }

  addInkAnnotation(options: AnnotationOptions & {
    inkList: Point[][];
  }): InkAnnotation {
    const annotation = new InkAnnotation(options);
    this.annotations.set(annotation.getId(), annotation);
    return annotation;
  }

  getAnnotation(id: string): PDFAnnotation | undefined {
    return this.annotations.get(id);
  }

  getAllAnnotations(): PDFAnnotation[] {
    return Array.from(this.annotations.values());
  }

  removeAnnotation(id: string): boolean {
    return this.annotations.delete(id);
  }

  getAnnotationObjects(): PDFObject[] {
    const objects: PDFObject[] = [];
    for (const annotation of this.annotations.values()) {
      objects.push(annotation.toPDFObject());
    }
    return objects;
  }
}

export abstract class PDFAnnotation {
  protected id: string;
  protected type: AnnotationType;
  protected rect: Rectangle;
  protected contents?: string;
  protected author?: string;
  protected subject?: string;
  protected color?: Color;
  protected opacity?: number;
  protected flags?: number;
  protected border?: AnnotationBorder;
  protected appearance?: AnnotationAppearance;
  protected creationDate: Date;
  protected modificationDate: Date;

  constructor(options: AnnotationOptions) {
    this.id = this.generateId();
    this.type = options.type;
    this.rect = options.rect;
    this.contents = options.contents;
    this.author = options.author;
    this.subject = options.subject;
    this.color = options.color;
    this.opacity = options.opacity;
    this.flags = options.flags || 0;
    this.border = options.border;
    this.appearance = options.appearance;
    this.creationDate = new Date();
    this.modificationDate = new Date();
  }

  getId(): string {
    return this.id;
  }

  getType(): AnnotationType {
    return this.type;
  }

  getRect(): Rectangle {
    return { ...this.rect };
  }

  setRect(rect: Rectangle): void {
    this.rect = rect;
    this.modificationDate = new Date();
  }

  getContents(): string | undefined {
    return this.contents;
  }

  setContents(contents: string): void {
    this.contents = contents;
    this.modificationDate = new Date();
  }

  abstract toPDFObject(): PDFObject;

  protected getBaseAnnotationDict(): PDFDict {
    const dict: PDFDict = {
      Type: 'Annot',
      Subtype: this.type,
      Rect: [this.rect.x, this.rect.y, this.rect.x + this.rect.width, this.rect.y + this.rect.height],
      CreationDate: this.formatDate(this.creationDate),
      M: this.formatDate(this.modificationDate)
    };

    if (this.contents) dict.Contents = this.contents;
    if (this.author) dict.T = this.author;
    if (this.subject) dict.Subj = this.subject;
    if (this.color) dict.C = this.colorToArray(this.color);
    if (this.opacity !== undefined) dict.CA = this.opacity;
    if (this.flags) dict.F = this.flags;
    if (this.border) dict.Border = this.borderToArray(this.border);
    if (this.appearance) dict.AP = this.appearance;

    return dict;
  }

  private generateId(): string {
    return 'annot_' + Math.random().toString(36).substr(2, 9);
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

  private colorToArray(color: Color): number[] {
    if ('r' in color) {
      return [color.r, color.g, color.b];
    } else {
      return [color.c, color.m, color.y, color.k];
    }
  }

  private borderToArray(border: AnnotationBorder): number[] {
    const result = [0, 0, border.width];
    if (border.dashArray) {
      result.push(...border.dashArray);
    }
    return result;
  }
}

export class TextAnnotation extends PDFAnnotation {
  private icon: string;
  private open: boolean;

  constructor(options: AnnotationOptions & { 
    icon?: string; 
    open?: boolean; 
  }) {
    super({ ...options, type: AnnotationType.Text });
    this.icon = options.icon || 'Note';
    this.open = options.open || false;
  }

  toPDFObject(): PDFObject {
    const dict = this.getBaseAnnotationDict();
    dict.Name = this.icon;
    dict.Open = this.open;

    const id = new PDFObjectId(1); // Should be managed by document
    return new PDFObject(id, dict);
  }
}

export interface LinkAction {
  type: 'GoTo' | 'GoToR' | 'URI' | 'Launch';
  destination?: any;
  uri?: string;
  file?: string;
}

export class LinkAnnotation extends PDFAnnotation {
  private action: LinkAction;
  private highlightMode: string;

  constructor(options: AnnotationOptions & {
    action: LinkAction;
    highlightMode?: string;
  }) {
    super({ ...options, type: AnnotationType.Link });
    this.action = options.action;
    this.highlightMode = options.highlightMode || 'Invert';
  }

  toPDFObject(): PDFObject {
    const dict = this.getBaseAnnotationDict();
    dict.H = this.highlightMode;
    dict.A = this.actionToDict(this.action);

    const id = new PDFObjectId(1);
    return new PDFObject(id, dict);
  }

  private actionToDict(action: LinkAction): PDFDict {
    const actionDict: PDFDict = {
      Type: 'Action',
      S: action.type
    };

    switch (action.type) {
      case 'URI':
        if (action.uri) actionDict.URI = action.uri;
        break;
      case 'GoTo':
        if (action.destination) actionDict.D = action.destination;
        break;
      case 'GoToR':
        if (action.file) actionDict.F = action.file;
        if (action.destination) actionDict.D = action.destination;
        break;
      case 'Launch':
        if (action.file) actionDict.F = action.file;
        break;
    }

    return actionDict;
  }
}

export class HighlightAnnotation extends PDFAnnotation {
  private quadPoints: number[];

  constructor(options: AnnotationOptions & { quadPoints: number[] }) {
    super({ ...options, type: AnnotationType.Highlight });
    this.quadPoints = options.quadPoints;
  }

  toPDFObject(): PDFObject {
    const dict = this.getBaseAnnotationDict();
    dict.QuadPoints = this.quadPoints;

    const id = new PDFObjectId(1);
    return new PDFObject(id, dict);
  }
}

export class FreeTextAnnotation extends PDFAnnotation {
  private defaultAppearance: string;
  private alignment?: string;
  private callout?: Point[];

  constructor(options: AnnotationOptions & {
    defaultAppearance: string;
    alignment?: string;
    callout?: Point[];
  }) {
    super({ ...options, type: AnnotationType.FreeText });
    this.defaultAppearance = options.defaultAppearance;
    this.alignment = options.alignment;
    this.callout = options.callout;
  }

  toPDFObject(): PDFObject {
    const dict = this.getBaseAnnotationDict();
    dict.DA = this.defaultAppearance;
    
    if (this.alignment) {
      const alignmentValue = this.alignment === 'left' ? 0 : 
                           this.alignment === 'center' ? 1 : 2;
      dict.Q = alignmentValue;
    }
    
    if (this.callout) {
      dict.CL = this.callout.flatMap(p => [p.x, p.y]);
    }

    const id = new PDFObjectId(1);
    return new PDFObject(id, dict);
  }
}

export class StampAnnotation extends PDFAnnotation {
  private name: string;

  constructor(options: AnnotationOptions & { name?: string }) {
    super({ ...options, type: AnnotationType.Stamp });
    this.name = options.name || 'Draft';
  }

  toPDFObject(): PDFObject {
    const dict = this.getBaseAnnotationDict();
    dict.Name = this.name;

    const id = new PDFObjectId(1);
    return new PDFObject(id, dict);
  }
}

export class InkAnnotation extends PDFAnnotation {
  private inkList: Point[][];

  constructor(options: AnnotationOptions & { inkList: Point[][] }) {
    super({ ...options, type: AnnotationType.Ink });
    this.inkList = options.inkList;
  }

  toPDFObject(): PDFObject {
    const dict = this.getBaseAnnotationDict();
    dict.InkList = this.inkList.map(stroke => 
      stroke.flatMap(point => [point.x, point.y])
    );

    const id = new PDFObjectId(1);
    return new PDFObject(id, dict);
  }
}