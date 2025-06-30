/**
 * PDFDocument - Main document creation and manipulation class
 */

import { 
  PDFMetadata, 
  PageConfig, 
  Size, 
  PDFDict,
  PDFError,
  PageSizes,
  EncryptionOptions,
  PDFPermissions
} from '../types/index.js';
import { PDFObject, PDFObjectId, PDFCrossRefTable } from '../core/PDFObject.js';
import { PDFPage } from './PDFPage.js';
import { PDFFont } from '../fonts/PDFFont.js';
import { StandardFontMetrics } from '../fonts/StandardFontMetrics.js';

export class PDFDocument {
  private crossRefTable = new PDFCrossRefTable();
  private objects = new Map<number, PDFObject>();
  private pages: PDFPage[] = [];
  private fonts = new Map<string, PDFFont>();
  private metadata: PDFMetadata = {};
  private catalog?: PDFObject;
  private pageTree?: PDFObject;
  private info?: PDFObject;

  constructor() {
    this.initializeDocument();
  }

  static async create(metadata?: PDFMetadata): Promise<PDFDocument> {
    const doc = new PDFDocument();
    if (metadata) {
      doc.setMetadata(metadata);
    }
    return doc;
  }

  private initializeDocument(): void {
    // Create document catalog
    const catalogId = new PDFObjectId(this.crossRefTable.getNextObjectNumber());
    const catalogDict: PDFDict = {
      Type: 'Catalog',
      Pages: { objectNumber: 0, generationNumber: 0 }, // Will be updated
      Version: '1.7'
    };
    this.catalog = new PDFObject(catalogId, catalogDict);
    this.objects.set(catalogId.objectNumber, this.catalog);

    // Create page tree
    const pageTreeId = new PDFObjectId(this.crossRefTable.getNextObjectNumber());
    const pageTreeDict: PDFDict = {
      Type: 'Pages',
      Kids: [],
      Count: 0
    };
    this.pageTree = new PDFObject(pageTreeId, pageTreeDict);
    this.objects.set(pageTreeId.objectNumber, this.pageTree);

    // Update catalog reference to page tree
    (this.catalog.value as PDFDict).Pages = pageTreeId.toRef();

    // Create document info
    this.createInfoDict();
  }

  private createInfoDict(): void {
    const infoId = new PDFObjectId(this.crossRefTable.getNextObjectNumber());
    const infoDict: PDFDict = {
      Producer: 'VibePDF v1.0.0',
      Creator: 'VibePDF Enterprise Library',
      CreationDate: this.formatDate(new Date()),
      ModDate: this.formatDate(new Date())
    };
    
    this.info = new PDFObject(infoId, infoDict);
    this.objects.set(infoId.objectNumber, this.info);
  }

  setMetadata(metadata: PDFMetadata): void {
    this.metadata = { ...metadata };
    
    if (this.info) {
      const infoDict = this.info.value as PDFDict;
      if (metadata.title) infoDict.Title = metadata.title;
      if (metadata.author) infoDict.Author = metadata.author;
      if (metadata.subject) infoDict.Subject = metadata.subject;
      if (metadata.keywords) infoDict.Keywords = metadata.keywords;
      if (metadata.creator) infoDict.Creator = metadata.creator;
      if (metadata.producer) infoDict.Producer = metadata.producer;
      if (metadata.creationDate) infoDict.CreationDate = this.formatDate(metadata.creationDate);
      if (metadata.modificationDate) infoDict.ModDate = this.formatDate(metadata.modificationDate);
    }
  }

  getMetadata(): PDFMetadata {
    return { ...this.metadata };
  }

  addPage(size: Size | keyof typeof PageSizes = 'A4', config?: Partial<PageConfig>): PDFPage {
    const pageSize = typeof size === 'string' ? PageSizes[size] : size;
    
    const pageConfig: PageConfig = {
      size: pageSize,
      margins: { top: 72, right: 72, bottom: 72, left: 72 },
      rotation: 0,
      ...config
    };

    const pageId = new PDFObjectId(this.crossRefTable.getNextObjectNumber());
    const page = new PDFPage(pageId, pageConfig, this.pageTree!.id.toRef());
    
    // Add page object to document
    this.objects.set(pageId.objectNumber, page.getObject());
    
    // Update page tree
    this.updatePageTree(page);
    
    this.pages.push(page);
    return page;
  }

  private updatePageTree(page: PDFPage): void {
    if (!this.pageTree) return;
    
    const pageTreeDict = this.pageTree.value as PDFDict;
    const kids = pageTreeDict.Kids as any[];
    kids.push(page.getObject().id.toRef());
    pageTreeDict.Count = kids.length;
  }

  async embedFont(fontName: string): Promise<PDFFont> {
    if (this.fonts.has(fontName)) {
      return this.fonts.get(fontName)!;
    }

    const fontId = new PDFObjectId(this.crossRefTable.getNextObjectNumber());
    const font = new PDFFont(fontId, fontName, StandardFontMetrics[fontName] || StandardFontMetrics.Helvetica);
    
    this.objects.set(fontId.objectNumber, font.getObject());
    this.fonts.set(fontName, font);
    
    return font;
  }

  getPages(): PDFPage[] {
    return [...this.pages];
  }

  getPage(index: number): PDFPage {
    if (index < 0 || index >= this.pages.length) {
      throw new PDFError(`Page index ${index} out of bounds`);
    }
    return this.pages[index];
  }

  getPageCount(): number {
    return this.pages.length;
  }

  async save(): Promise<Uint8Array> {
    // Add content streams for all pages
    for (const page of this.pages) {
      const contentStream = await page.getContentStream();
      const contentId = new PDFObjectId(this.crossRefTable.getNextObjectNumber());
      const contentObj = new PDFObject(contentId, contentStream);
      this.objects.set(contentId.objectNumber, contentObj);
      
      // Update page to reference content stream
      const pageDict = page.getObject().value as PDFDict;
      pageDict.Contents = contentId.toRef();
    }

    // Add font objects to resources
    for (const page of this.pages) {
      const pageDict = page.getObject().value as PDFDict;
      const resources = pageDict.Resources as PDFDict;
      const fontResources = resources.Font as PDFDict;
      
      for (const [fontName, font] of this.fonts) {
        fontResources[fontName] = font.getObject().id.toRef();
      }
    }

    this.updateCrossRefTable();
    return this.serialize();
  }

  private updateCrossRefTable(): void {
    let offset = 0;
    const header = '%PDF-1.7\n%âãÏÓ\n';
    offset += header.length;

    // Calculate offsets for all objects
    for (const [objectNumber, object] of this.objects) {
      this.crossRefTable.addEntry(objectNumber, {
        offset,
        generation: object.id.generationNumber,
        free: false
      });
      offset += object.toString().length + 1; // +1 for newline
    }
  }

  private async serialize(): Promise<Uint8Array> {
    let pdf = '%PDF-1.7\n%âãÏÓ\n';
    
    // Serialize all objects
    for (const object of this.objects.values()) {
      pdf += object.toString() + '\n';
    }

    // Add cross-reference table
    const xrefOffset = pdf.length;
    pdf += this.crossRefTable.serialize();

    // Add trailer
    pdf += this.serializeTrailer();

    // Add xref offset and EOF
    pdf += `startxref\n${xrefOffset}\n%%EOF\n`;

    return new TextEncoder().encode(pdf);
  }

  private serializeTrailer(): string {
    const trailerDict: PDFDict = {
      Size: this.objects.size + 1,
      Root: this.catalog!.id.toRef()
    };

    if (this.info) {
      trailerDict.Info = this.info.id.toRef();
    }

    return `trailer\n${PDFObject.serializeValue(trailerDict)}\n`;
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