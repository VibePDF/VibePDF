/**
 * PDF Writer - Handles PDF document serialization and output
 */

import { PDFObject, PDFObjectId, PDFCrossRefTable } from './PDFObject.js';
import { PDFStreamProcessor } from './PDFStream.js';
import { PDFDict, PDFArray, PDFValue, PDFError } from '../types/index.js';

export interface WriteOptions {
  compress?: boolean;
  linearize?: boolean;
  incrementalUpdate?: boolean;
  objectStreams?: boolean;
  crossRefStreams?: boolean;
}

export class PDFWriter {
  private objects: Map<number, PDFObject> = new Map();
  private crossRefTable = new PDFCrossRefTable();
  private options: WriteOptions;
  private buffer: Uint8Array[] = [];
  private position = 0;

  constructor(options: WriteOptions = {}) {
    this.options = {
      compress: true,
      linearize: false,
      incrementalUpdate: false,
      objectStreams: false,
      crossRefStreams: false,
      ...options
    };
  }

  addObject(object: PDFObject): void {
    this.objects.set(object.id.objectNumber, object);
  }

  async write(): Promise<Uint8Array> {
    this.buffer = [];
    this.position = 0;

    // Write PDF header
    this.writeHeader();

    // Write objects
    await this.writeObjects();

    // Write cross-reference table
    const xrefOffset = this.position;
    this.writeCrossRefTable();

    // Write trailer
    this.writeTrailer();

    // Write xref offset and EOF
    this.writeString(`startxref\n${xrefOffset}\n%%EOF\n`);

    return this.combineBuffers();
  }

  private writeHeader(): void {
    this.writeString('%PDF-1.7\n');
    // Add binary comment to indicate binary content
    this.writeString('%âãÏÓ\n');
  }

  private async writeObjects(): Promise<void> {
    const sortedObjects = Array.from(this.objects.entries()).sort(([a], [b]) => a - b);

    for (const [objectNumber, object] of sortedObjects) {
      const offset = this.position;
      
      // Add to cross-reference table
      this.crossRefTable.addEntry(objectNumber, {
        offset,
        generation: object.id.generationNumber,
        free: false
      });

      // Write object
      await this.writeObject(object);
    }
  }

  private async writeObject(object: PDFObject): Promise<void> {
    this.writeString(`${object.id.objectNumber} ${object.id.generationNumber} obj\n`);
    
    if (this.isStream(object.value)) {
      await this.writeStreamObject(object.value as any);
    } else {
      this.writeValue(object.value);
    }
    
    this.writeString('\nendobj\n');
  }

  private async writeStreamObject(stream: { dict: PDFDict; data: Uint8Array }): Promise<void> {
    let data = stream.data;
    const dict = { ...stream.dict };

    // Apply compression if enabled
    if (this.options.compress && !dict.Filter) {
      try {
        const compressedStream = await PDFStreamProcessor.createCompressedStream(data);
        data = compressedStream.data;
        dict.Filter = 'FlateDecode';
        dict.Length = data.length;
      } catch (error) {
        console.warn('Failed to compress stream, using uncompressed data');
      }
    }

    // Update length
    dict.Length = data.length;

    // Write dictionary
    this.writeValue(dict);
    
    // Write stream content
    this.writeString('\nstream\n');
    this.writeBytes(data);
    this.writeString('\nendstream');
  }

  private writeValue(value: PDFValue): void {
    if (value === null) {
      this.writeString('null');
    } else if (typeof value === 'boolean') {
      this.writeString(value.toString());
    } else if (typeof value === 'number') {
      this.writeString(this.formatNumber(value));
    } else if (typeof value === 'string') {
      this.writeString(this.escapeString(value));
    } else if (this.isRef(value)) {
      this.writeString(`${value.objectNumber} ${value.generationNumber} R`);
    } else if (Array.isArray(value)) {
      this.writeArray(value);
    } else if (typeof value === 'object') {
      this.writeDict(value as PDFDict);
    }
  }

  private writeArray(array: PDFArray): void {
    this.writeString('[');
    for (let i = 0; i < array.length; i++) {
      if (i > 0) this.writeString(' ');
      this.writeValue(array[i]);
    }
    this.writeString(']');
  }

  private writeDict(dict: PDFDict): void {
    this.writeString('<<');
    for (const [key, value] of Object.entries(dict)) {
      this.writeString(`\n/${key} `);
      this.writeValue(value);
    }
    this.writeString('\n>>');
  }

  private writeCrossRefTable(): void {
    const entries = this.crossRefTable.getAllEntries();
    
    this.writeString('xref\n');
    this.writeString(`0 ${entries.length + 1}\n`);
    this.writeString('0000000000 65535 f \n');
    
    for (const [, entry] of entries) {
      const offset = entry.offset.toString().padStart(10, '0');
      const generation = entry.generation.toString().padStart(5, '0');
      const type = entry.free ? 'f' : 'n';
      this.writeString(`${offset} ${generation} ${type} \n`);
    }
  }

  private writeTrailer(): void {
    const trailerDict: PDFDict = {
      Size: this.objects.size + 1,
      Root: this.findCatalogRef(),
      Info: this.findInfoRef()
    };

    this.writeString('trailer\n');
    this.writeValue(trailerDict);
    this.writeString('\n');
  }

  private findCatalogRef(): any {
    for (const object of this.objects.values()) {
      const dict = object.value as PDFDict;
      if (dict.Type === 'Catalog') {
        return object.id.toRef();
      }
    }
    throw new PDFError('Document catalog not found');
  }

  private findInfoRef(): any {
    for (const object of this.objects.values()) {
      const dict = object.value as PDFDict;
      if (dict.Title || dict.Author || dict.Subject) {
        return object.id.toRef();
      }
    }
    return undefined;
  }

  private writeString(str: string): void {
    const bytes = new TextEncoder().encode(str);
    this.writeBytes(bytes);
  }

  private writeBytes(bytes: Uint8Array): void {
    this.buffer.push(bytes);
    this.position += bytes.length;
  }

  private combineBuffers(): Uint8Array {
    const totalLength = this.buffer.reduce((sum, buf) => sum + buf.length, 0);
    const result = new Uint8Array(totalLength);
    
    let offset = 0;
    for (const buf of this.buffer) {
      result.set(buf, offset);
      offset += buf.length;
    }
    
    return result;
  }

  private formatNumber(num: number): string {
    if (Number.isInteger(num)) {
      return num.toString();
    }
    return num.toFixed(6).replace(/\.?0+$/, '');
  }

  private escapeString(str: string): string {
    const escaped = str
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/\r/g, '\\r')
      .replace(/\n/g, '\\n')
      .replace(/\t/g, '\\t');
    return `(${escaped})`;
  }

  private isRef(value: any): boolean {
    return value && typeof value === 'object' && 
           'objectNumber' in value && 'generationNumber' in value;
  }

  private isStream(value: any): boolean {
    return value && typeof value === 'object' && 'dict' in value && 'data' in value;
  }
}

export class IncrementalWriter extends PDFWriter {
  private originalSize: number;
  private modifiedObjects: Set<number> = new Set();

  constructor(originalPDF: Uint8Array, options: WriteOptions = {}) {
    super({ ...options, incrementalUpdate: true });
    this.originalSize = originalPDF.length;
  }

  markObjectAsModified(objectNumber: number): void {
    this.modifiedObjects.add(objectNumber);
  }

  async writeIncremental(): Promise<Uint8Array> {
    // Only write modified objects
    const modifiedObjectsMap = new Map();
    for (const objectNumber of this.modifiedObjects) {
      const object = this.objects.get(objectNumber);
      if (object) {
        modifiedObjectsMap.set(objectNumber, object);
      }
    }

    // Temporarily replace objects map
    const originalObjects = this.objects;
    this.objects = modifiedObjectsMap;

    try {
      const incrementalData = await this.write();
      return incrementalData;
    } finally {
      this.objects = originalObjects;
    }
  }
}