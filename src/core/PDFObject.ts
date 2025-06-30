/**
 * PDF Object Model - Core primitives for PDF structure
 */

import { PDFValue, PDFRef, PDFDict, PDFArray, PDFStream, PDFError } from '../types/index.js';

export class PDFObjectId {
  constructor(
    public readonly objectNumber: number,
    public readonly generationNumber: number = 0
  ) {
    if (objectNumber < 1) {
      throw new PDFError('Object number must be >= 1');
    }
    if (generationNumber < 0) {
      throw new PDFError('Generation number must be >= 0');
    }
  }

  toString(): string {
    return `${this.objectNumber} ${this.generationNumber} obj`;
  }

  equals(other: PDFObjectId): boolean {
    return this.objectNumber === other.objectNumber && 
           this.generationNumber === other.generationNumber;
  }

  toRef(): PDFRef {
    return {
      objectNumber: this.objectNumber,
      generationNumber: this.generationNumber
    };
  }
}

export class PDFObject {
  constructor(
    public readonly id: PDFObjectId,
    public value: PDFValue
  ) {}

  toString(): string {
    return `${this.id.toString()}\n${this.valueToString()}\nendobj`;
  }

  private valueToString(): string {
    return PDFObject.serializeValue(this.value);
  }

  static serializeValue(value: PDFValue): string {
    if (value === null) return 'null';
    if (typeof value === 'boolean') return value.toString();
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'string') return PDFObject.serializeString(value);
    if (PDFObject.isRef(value)) return `${value.objectNumber} ${value.generationNumber} R`;
    if (PDFObject.isDict(value)) return PDFObject.serializeDict(value);
    if (Array.isArray(value)) return PDFObject.serializeArray(value);
    if (PDFObject.isStream(value)) return PDFObject.serializeStream(value);
    
    throw new PDFError(`Cannot serialize PDF value: ${typeof value}`);
  }

  private static serializeString(str: string): string {
    // Simple implementation - should handle escaping properly
    return `(${str.replace(/[()\\]/g, '\\$&')})`;
  }

  private static serializeDict(dict: PDFDict): string {
    const entries = Object.entries(dict)
      .map(([key, value]) => `/${key} ${PDFObject.serializeValue(value)}`)
      .join('\n');
    return `<<\n${entries}\n>>`;
  }

  private static serializeArray(array: PDFArray): string {
    const values = array.map(value => PDFObject.serializeValue(value)).join(' ');
    return `[${values}]`;
  }

  private static serializeStream(stream: PDFStream): string {
    const dictStr = PDFObject.serializeDict(stream.dict);
    const dataStr = new TextDecoder().decode(stream.data);
    return `${dictStr}\nstream\n${dataStr}\nendstream`;
  }

  static isRef(value: any): value is PDFRef {
    return value && typeof value === 'object' && 
           'objectNumber' in value && 'generationNumber' in value;
  }

  static isDict(value: any): value is PDFDict {
    return value && typeof value === 'object' && !Array.isArray(value) && 
           !PDFObject.isRef(value) && !PDFObject.isStream(value);
  }

  static isStream(value: any): value is PDFStream {
    return value && typeof value === 'object' && 'dict' in value && 'data' in value;
  }
}

export class PDFCrossRefTable {
  private entries = new Map<number, PDFCrossRefEntry>();
  private nextObjectNumber = 1;

  addEntry(objectNumber: number, entry: PDFCrossRefEntry): void {
    this.entries.set(objectNumber, entry);
    this.nextObjectNumber = Math.max(this.nextObjectNumber, objectNumber + 1);
  }

  getEntry(objectNumber: number): PDFCrossRefEntry | undefined {
    return this.entries.get(objectNumber);
  }

  getNextObjectNumber(): number {
    return this.nextObjectNumber++;
  }

  getAllEntries(): [number, PDFCrossRefEntry][] {
    return Array.from(this.entries.entries()).sort(([a], [b]) => a - b);
  }

  serialize(): string {
    const entries = this.getAllEntries();
    if (entries.length === 0) return 'xref\n0 0\n';

    let result = 'xref\n';
    result += `0 ${entries.length + 1}\n`;
    result += '0000000000 65535 f \n'; // Free entry for object 0
    
    for (const [, entry] of entries) {
      const offset = entry.offset.toString().padStart(10, '0');
      const generation = entry.generation.toString().padStart(5, '0');
      const type = entry.free ? 'f' : 'n';
      result += `${offset} ${generation} ${type} \n`;
    }

    return result;
  }
}

export interface PDFCrossRefEntry {
  offset: number;
  generation: number;
  free: boolean;
}