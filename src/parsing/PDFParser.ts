/**
 * PDF Parser - Robust parsing for PDF documents
 */

import { 
  PDFValue, 
  PDFDict, 
  PDFArray, 
  PDFRef, 
  PDFStream,
  PDFError,
  PDFParseError 
} from '../types/index.js';

export class PDFParser {
  private data: Uint8Array;
  private position: number = 0;
  private length: number;

  constructor(data: Uint8Array) {
    this.data = data;
    this.length = data.length;
  }

  static async parse(data: Uint8Array): Promise<PDFDocument> {
    const parser = new PDFParser(data);
    return await parser.parseDocument();
  }

  private async parseDocument(): Promise<any> {
    // Find PDF header
    const header = this.findHeader();
    if (!header) {
      throw new PDFParseError('Invalid PDF: No header found');
    }

    // Find xref table
    const xrefOffset = this.findXRefOffset();
    if (xrefOffset === -1) {
      throw new PDFParseError('Invalid PDF: No xref table found');
    }

    // Parse xref table
    this.position = xrefOffset;
    const xrefTable = this.parseXRefTable();

    // Parse trailer
    const trailer = this.parseTrailer();

    // Parse document catalog
    const catalog = await this.parseObject(trailer.Root);

    return {
      header,
      xrefTable,
      trailer,
      catalog
    };
  }

  private findHeader(): string | null {
    const headerRegex = /%PDF-(\d+\.\d+)/;
    const headerBytes = this.data.slice(0, 20);
    const headerStr = new TextDecoder().decode(headerBytes);
    const match = headerStr.match(headerRegex);
    return match ? match[0] : null;
  }

  private findXRefOffset(): number {
    // Search backwards from end for startxref
    const searchBytes = this.data.slice(-1024);
    const searchStr = new TextDecoder().decode(searchBytes);
    const match = searchStr.match(/startxref\s+(\d+)/);
    return match ? parseInt(match[1], 10) : -1;
  }

  private parseXRefTable(): any {
    this.skipWhitespace();
    
    if (!this.matchKeyword('xref')) {
      throw new PDFParseError('Expected xref keyword', this.position);
    }

    const entries = new Map();
    
    while (this.position < this.length) {
      this.skipWhitespace();
      
      if (this.peek() === 't') { // trailer
        break;
      }

      const startNum = this.parseNumber();
      const count = this.parseNumber();

      for (let i = 0; i < count; i++) {
        const offset = this.parseNumber();
        const generation = this.parseNumber();
        const type = this.parseKeyword();

        entries.set(startNum + i, {
          offset,
          generation,
          free: type === 'f'
        });
      }
    }

    return entries;
  }

  private parseTrailer(): PDFDict {
    this.skipWhitespace();
    
    if (!this.matchKeyword('trailer')) {
      throw new PDFParseError('Expected trailer keyword', this.position);
    }

    return this.parseDict();
  }

  private async parseObject(ref: PDFRef): Promise<PDFValue> {
    // Implementation for parsing indirect objects
    // This would involve looking up the object in xref table
    // and parsing the object at the specified offset
    return {};
  }

  private parseValue(): PDFValue {
    this.skipWhitespace();
    
    const char = this.peek();
    
    if (char === '/') {
      return this.parseName();
    } else if (char === '(') {
      return this.parseString();
    } else if (char === '<') {
      if (this.peekNext() === '<') {
        return this.parseDict();
      } else {
        return this.parseHexString();
      }
    } else if (char === '[') {
      return this.parseArray();
    } else if (char === 't' || char === 'f') {
      return this.parseBoolean();
    } else if (char === 'n') {
      return this.parseNull();
    } else if (this.isDigit(char) || char === '-' || char === '+') {
      return this.parseNumber();
    } else {
      // Check for indirect reference
      const saved = this.position;
      try {
        const num = this.parseNumber();
        const gen = this.parseNumber();
        if (this.matchKeyword('R')) {
          return { objectNumber: num, generationNumber: gen };
        }
      } catch {
        // Not a reference, restore position
        this.position = saved;
      }
    }

    throw new PDFParseError(`Unexpected character: ${char}`, this.position);
  }

  private parseDict(): PDFDict {
    if (!this.match('<<')) {
      throw new PDFParseError('Expected <<', this.position);
    }

    const dict: PDFDict = {};

    while (this.position < this.length) {
      this.skipWhitespace();
      
      if (this.match('>>')) {
        break;
      }

      const key = this.parseName();
      const value = this.parseValue();
      dict[key] = value;
    }

    return dict;
  }

  private parseArray(): PDFArray {
    if (!this.match('[')) {
      throw new PDFParseError('Expected [', this.position);
    }

    const array: PDFArray = [];

    while (this.position < this.length) {
      this.skipWhitespace();
      
      if (this.match(']')) {
        break;
      }

      array.push(this.parseValue());
    }

    return array;
  }

  private parseName(): string {
    if (!this.match('/')) {
      throw new PDFParseError('Expected /', this.position);
    }

    let name = '';
    while (this.position < this.length) {
      const char = this.peek();
      if (this.isDelimiter(char) || this.isWhitespace(char)) {
        break;
      }
      name += char;
      this.position++;
    }

    return name;
  }

  private parseString(): string {
    if (!this.match('(')) {
      throw new PDFParseError('Expected (', this.position);
    }

    let str = '';
    let parenCount = 1;

    while (this.position < this.length && parenCount > 0) {
      const char = this.current();
      
      if (char === '\\') {
        // Handle escape sequences
        this.position++;
        const escaped = this.current();
        switch (escaped) {
          case 'n': str += '\n'; break;
          case 'r': str += '\r'; break;
          case 't': str += '\t'; break;
          case 'b': str += '\b'; break;
          case 'f': str += '\f'; break;
          case '(': str += '('; break;
          case ')': str += ')'; break;
          case '\\': str += '\\'; break;
          default: str += escaped; break;
        }
      } else if (char === '(') {
        parenCount++;
        str += char;
      } else if (char === ')') {
        parenCount--;
        if (parenCount > 0) {
          str += char;
        }
      } else {
        str += char;
      }
      
      this.position++;
    }

    return str;
  }

  private parseHexString(): string {
    if (!this.match('<')) {
      throw new PDFParseError('Expected <', this.position);
    }

    let hex = '';
    while (this.position < this.length) {
      const char = this.peek();
      if (char === '>') {
        this.position++;
        break;
      }
      if (this.isHexDigit(char)) {
        hex += char;
      }
      this.position++;
    }

    // Convert hex to string
    let result = '';
    for (let i = 0; i < hex.length; i += 2) {
      const hexPair = hex.substr(i, 2).padEnd(2, '0');
      result += String.fromCharCode(parseInt(hexPair, 16));
    }

    return result;
  }

  private parseNumber(): number {
    let numStr = '';
    
    if (this.peek() === '-' || this.peek() === '+') {
      numStr += this.current();
      this.position++;
    }

    while (this.position < this.length) {
      const char = this.peek();
      if (this.isDigit(char) || char === '.') {
        numStr += char;
        this.position++;
      } else {
        break;
      }
    }

    const num = parseFloat(numStr);
    if (isNaN(num)) {
      throw new PDFParseError(`Invalid number: ${numStr}`, this.position);
    }

    return num;
  }

  private parseBoolean(): boolean {
    if (this.matchKeyword('true')) {
      return true;
    } else if (this.matchKeyword('false')) {
      return false;
    }
    throw new PDFParseError('Expected boolean', this.position);
  }

  private parseNull(): null {
    if (this.matchKeyword('null')) {
      return null;
    }
    throw new PDFParseError('Expected null', this.position);
  }

  private parseKeyword(): string {
    let keyword = '';
    while (this.position < this.length) {
      const char = this.peek();
      if (this.isDelimiter(char) || this.isWhitespace(char)) {
        break;
      }
      keyword += char;
      this.position++;
    }
    return keyword;
  }

  // Utility methods
  private peek(): string {
    return this.position < this.length ? 
      String.fromCharCode(this.data[this.position]) : '';
  }

  private peekNext(): string {
    return this.position + 1 < this.length ? 
      String.fromCharCode(this.data[this.position + 1]) : '';
  }

  private current(): string {
    const char = this.peek();
    this.position++;
    return char;
  }

  private match(str: string): boolean {
    if (this.position + str.length > this.length) {
      return false;
    }

    for (let i = 0; i < str.length; i++) {
      if (String.fromCharCode(this.data[this.position + i]) !== str[i]) {
        return false;
      }
    }

    this.position += str.length;
    return true;
  }

  private matchKeyword(keyword: string): boolean {
    const saved = this.position;
    this.skipWhitespace();
    
    if (this.match(keyword)) {
      const nextChar = this.peek();
      if (this.isDelimiter(nextChar) || this.isWhitespace(nextChar) || this.position >= this.length) {
        return true;
      }
    }
    
    this.position = saved;
    return false;
  }

  private skipWhitespace(): void {
    while (this.position < this.length) {
      const char = this.peek();
      if (this.isWhitespace(char)) {
        this.position++;
      } else if (char === '%') {
        // Skip comment
        while (this.position < this.length && this.peek() !== '\n' && this.peek() !== '\r') {
          this.position++;
        }
      } else {
        break;
      }
    }
  }

  private isWhitespace(char: string): boolean {
    return char === ' ' || char === '\t' || char === '\n' || char === '\r' || char === '\0' || char === '\f';
  }

  private isDelimiter(char: string): boolean {
    return '()[]<>{}/%'.includes(char);
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private isHexDigit(char: string): boolean {
    return this.isDigit(char) || (char >= 'a' && char <= 'f') || (char >= 'A' && char <= 'F');
  }
}