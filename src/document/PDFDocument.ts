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
import { PDFSecurity } from '../encryption/PDFSecurity.js';
import { AcroForm } from '../forms/AcroForm.js';
import { PDFAnnotationManager } from '../annotations/PDFAnnotations.js';
import { PDFComplianceManager, ComplianceOptions } from '../standards/PDFCompliance.js';

export class PDFDocument {
  private crossRefTable = new PDFCrossRefTable();
  private objects = new Map<number, PDFObject>();
  private pages: PDFPage[] = [];
  private fonts = new Map<string, PDFFont>();
  private metadata: PDFMetadata = {};
  private catalog?: PDFObject;
  private pageTree?: PDFObject;
  private info?: PDFObject;
  private security?: PDFSecurity;
  private acroForm?: AcroForm;
  private annotationManager = new PDFAnnotationManager();
  private complianceManager = new PDFComplianceManager();
  private attachments: Map<string, FileAttachment> = new Map();
  private bookmarks: Bookmark[] = [];
  private javascriptActions: Map<string, string> = new Map();

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

  // Security and encryption
  async enableSecurity(options: EncryptionOptions): Promise<void> {
    this.security = new PDFSecurity(options);
    
    // Add encryption dictionary to catalog
    const encryptDict = await this.security.generateEncryptionDict();
    const encryptId = new PDFObjectId(this.crossRefTable.getNextObjectNumber());
    const encryptObj = new PDFObject(encryptId, encryptDict);
    
    this.objects.set(encryptId.objectNumber, encryptObj);
    
    // Update catalog
    if (this.catalog) {
      (this.catalog.value as PDFDict).Encrypt = encryptId.toRef();
    }
  }

  // Forms support
  createAcroForm(): AcroForm {
    if (!this.acroForm) {
      this.acroForm = new AcroForm();
      
      // Add AcroForm to catalog
      if (this.catalog) {
        const formDict = this.acroForm.generateFormDict();
        const formId = new PDFObjectId(this.crossRefTable.getNextObjectNumber());
        const formObj = new PDFObject(formId, formDict);
        
        this.objects.set(formId.objectNumber, formObj);
        (this.catalog.value as PDFDict).AcroForm = formId.toRef();
      }
    }
    return this.acroForm;
  }

  getAcroForm(): AcroForm | undefined {
    return this.acroForm;
  }

  // Annotations support
  getAnnotationManager(): PDFAnnotationManager {
    return this.annotationManager;
  }

  // Standards compliance
  setComplianceLevel(options: ComplianceOptions): void {
    this.complianceManager.setComplianceLevel(options);
    
    // Add compliance metadata
    const metadataDict = this.complianceManager.createComplianceMetadata();
    const metadataId = new PDFObjectId(this.crossRefTable.getNextObjectNumber());
    const metadataObj = new PDFObject(metadataId, metadataDict);
    
    this.objects.set(metadataId.objectNumber, metadataObj);
    
    // Update catalog
    if (this.catalog) {
      (this.catalog.value as PDFDict).Metadata = metadataId.toRef();
    }
  }

  // File attachments
  addAttachment(name: string, data: Uint8Array, description?: string): void {
    const attachment = new FileAttachment(name, data, description);
    this.attachments.set(name, attachment);
    
    // Add to names dictionary in catalog
    if (this.catalog) {
      const catalogDict = this.catalog.value as PDFDict;
      if (!catalogDict.Names) {
        catalogDict.Names = {};
      }
      
      // Implementation would add to EmbeddedFiles name tree
    }
  }

  getAttachment(name: string): FileAttachment | undefined {
    return this.attachments.get(name);
  }

  getAllAttachments(): FileAttachment[] {
    return Array.from(this.attachments.values());
  }

  // Bookmarks/Outlines
  addBookmark(title: string, destination: any, parent?: Bookmark): Bookmark {
    const bookmark = new Bookmark(title, destination, parent);
    
    if (!parent) {
      this.bookmarks.push(bookmark);
    } else {
      parent.addChild(bookmark);
    }
    
    // Update outlines in catalog
    this.updateOutlines();
    
    return bookmark;
  }

  private updateOutlines(): void {
    if (this.bookmarks.length === 0) return;
    
    // Create outlines dictionary
    const outlinesDict: PDFDict = {
      Type: 'Outlines',
      Count: this.calculateOutlineCount(),
      First: this.bookmarks[0].toRef(),
      Last: this.bookmarks[this.bookmarks.length - 1].toRef()
    };
    
    const outlinesId = new PDFObjectId(this.crossRefTable.getNextObjectNumber());
    const outlinesObj = new PDFObject(outlinesId, outlinesDict);
    
    this.objects.set(outlinesId.objectNumber, outlinesObj);
    
    // Update catalog
    if (this.catalog) {
      (this.catalog.value as PDFDict).Outlines = outlinesId.toRef();
    }
  }

  private calculateOutlineCount(): number {
    let count = 0;
    for (const bookmark of this.bookmarks) {
      count += bookmark.getDescendantCount() + 1;
    }
    return count;
  }

  // JavaScript actions
  addJavaScript(name: string, script: string): void {
    this.javascriptActions.set(name, script);
    
    // Add to names dictionary
    if (this.catalog) {
      const catalogDict = this.catalog.value as PDFDict;
      if (!catalogDict.Names) {
        catalogDict.Names = {};
      }
      
      // Implementation would add to JavaScript name tree
    }
  }

  // Document operations
  insertPage(index: number, page: PDFPage): void {
    if (index < 0 || index > this.pages.length) {
      throw new PDFError(`Invalid page index: ${index}`);
    }
    
    this.pages.splice(index, 0, page);
    this.updatePageTree(page);
  }

  removePage(index: number): PDFPage {
    if (index < 0 || index >= this.pages.length) {
      throw new PDFError(`Page index ${index} out of bounds`);
    }
    
    const page = this.pages.splice(index, 1)[0];
    
    // Update page tree
    if (this.pageTree) {
      const pageTreeDict = this.pageTree.value as PDFDict;
      const kids = pageTreeDict.Kids as any[];
      kids.splice(index, 1);
      pageTreeDict.Count = kids.length;
    }
    
    return page;
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

  // Document validation
  validate(): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Basic validation
    if (this.pages.length === 0) {
      errors.push('Document must have at least one page');
    }
    
    if (!this.catalog) {
      errors.push('Document catalog is missing');
    }
    
    if (!this.pageTree) {
      errors.push('Page tree is missing');
    }
    
    // Validate compliance if set
    const complianceLevel = this.complianceManager.getComplianceLevel();
    if (complianceLevel) {
      const complianceResult = this.complianceManager.validateCompliance(this);
      errors.push(...complianceResult.errors.map(e => e.message));
      warnings.push(...complianceResult.warnings.map(w => w.message));
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  async save(): Promise<Uint8Array> {
    // Validate document before saving
    const validation = this.validate();
    if (!validation.isValid) {
      throw new PDFError(`Document validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Add form and annotation objects
    if (this.acroForm) {
      const formObjects = this.acroForm.getFieldObjects();
      for (const obj of formObjects) {
        this.objects.set(obj.id.objectNumber, obj);
      }
    }
    
    const annotationObjects = this.annotationManager.getAnnotationObjects();
    for (const obj of annotationObjects) {
      this.objects.set(obj.id.objectNumber, obj);
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
      let objectData = object.toString();
      
      // Apply encryption if enabled
      if (this.security) {
        const encryptedData = await this.security.encryptData(
          new TextEncoder().encode(objectData),
          object.id.objectNumber,
          object.id.generationNumber
        );
        objectData = new TextDecoder().decode(encryptedData);
      }
      
      pdf += objectData + '\n';
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
    
    if (this.security) {
      // Add encryption reference
      const encryptRef = Array.from(this.objects.values())
        .find(obj => (obj.value as PDFDict).Filter === 'Standard');
      if (encryptRef) {
        trailerDict.Encrypt = encryptRef.id.toRef();
      }
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

// Helper classes
export class FileAttachment {
  constructor(
    private name: string,
    private data: Uint8Array,
    private description?: string,
    private mimeType?: string
  ) {}

  getName(): string {
    return this.name;
  }

  getData(): Uint8Array {
    return this.data;
  }

  getDescription(): string | undefined {
    return this.description;
  }

  getMimeType(): string | undefined {
    return this.mimeType;
  }

  getSize(): number {
    return this.data.length;
  }

  hasCompliantMetadata(): boolean {
    return !!(this.description && this.mimeType);
  }
}

export class Bookmark {
  private children: Bookmark[] = [];
  private id: PDFObjectId;

  constructor(
    private title: string,
    private destination: any,
    private parent?: Bookmark
  ) {
    this.id = new PDFObjectId(1); // Should be managed by document
  }

  getTitle(): string {
    return this.title;
  }

  getDestination(): any {
    return this.destination;
  }

  getParent(): Bookmark | undefined {
    return this.parent;
  }

  getChildren(): Bookmark[] {
    return [...this.children];
  }

  addChild(child: Bookmark): void {
    this.children.push(child);
  }

  getDescendantCount(): number {
    let count = 0;
    for (const child of this.children) {
      count += child.getDescendantCount() + 1;
    }
    return count;
  }

  toRef(): any {
    return this.id.toRef();
  }

  toPDFObject(): PDFObject {
    const dict: PDFDict = {
      Title: this.title,
      Dest: this.destination
    };

    if (this.parent) {
      dict.Parent = this.parent.toRef();
    }

    if (this.children.length > 0) {
      dict.First = this.children[0].toRef();
      dict.Last = this.children[this.children.length - 1].toRef();
      dict.Count = this.children.length;
    }

    return new PDFObject(this.id, dict);
  }
}