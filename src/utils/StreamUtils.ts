/**
 * Stream utilities for efficient data processing
 */

export class StreamReader {
  private data: Uint8Array;
  private position: number = 0;

  constructor(data: Uint8Array) {
    this.data = data;
  }

  read(length: number): Uint8Array {
    if (this.position + length > this.data.length) {
      throw new Error('Not enough data to read');
    }
    
    const result = this.data.slice(this.position, this.position + length);
    this.position += length;
    return result;
  }

  readByte(): number {
    if (this.position >= this.data.length) {
      throw new Error('End of stream');
    }
    return this.data[this.position++];
  }

  readUInt16BE(): number {
    const bytes = this.read(2);
    return (bytes[0] << 8) | bytes[1];
  }

  readUInt32BE(): number {
    const bytes = this.read(4);
    return (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
  }

  readString(length: number, encoding: string = 'utf-8'): string {
    const bytes = this.read(length);
    return new TextDecoder(encoding).decode(bytes);
  }

  skip(length: number): void {
    this.position += length;
  }

  getPosition(): number {
    return this.position;
  }

  setPosition(position: number): void {
    this.position = Math.max(0, Math.min(position, this.data.length));
  }

  hasMore(): boolean {
    return this.position < this.data.length;
  }

  remaining(): number {
    return this.data.length - this.position;
  }
}

export class StreamWriter {
  private chunks: Uint8Array[] = [];
  private length: number = 0;

  write(data: Uint8Array): void {
    this.chunks.push(data);
    this.length += data.length;
  }

  writeByte(value: number): void {
    this.write(new Uint8Array([value & 0xFF]));
  }

  writeUInt16BE(value: number): void {
    this.write(new Uint8Array([
      (value >> 8) & 0xFF,
      value & 0xFF
    ]));
  }

  writeUInt32BE(value: number): void {
    this.write(new Uint8Array([
      (value >> 24) & 0xFF,
      (value >> 16) & 0xFF,
      (value >> 8) & 0xFF,
      value & 0xFF
    ]));
  }

  writeString(text: string, encoding: string = 'utf-8'): void {
    const bytes = new TextEncoder().encode(text);
    this.write(bytes);
  }

  toUint8Array(): Uint8Array {
    const result = new Uint8Array(this.length);
    let offset = 0;
    
    for (const chunk of this.chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    
    return result;
  }

  getLength(): number {
    return this.length;
  }

  clear(): void {
    this.chunks = [];
    this.length = 0;
  }
}

export class BitReader {
  private reader: StreamReader;
  private currentByte: number = 0;
  private bitsRemaining: number = 0;

  constructor(data: Uint8Array) {
    this.reader = new StreamReader(data);
  }

  readBits(count: number): number {
    let result = 0;
    let bitsRead = 0;

    while (bitsRead < count) {
      if (this.bitsRemaining === 0) {
        this.currentByte = this.reader.readByte();
        this.bitsRemaining = 8;
      }

      const bitsToRead = Math.min(count - bitsRead, this.bitsRemaining);
      const mask = (1 << bitsToRead) - 1;
      const bits = (this.currentByte >> (this.bitsRemaining - bitsToRead)) & mask;
      
      result = (result << bitsToRead) | bits;
      bitsRead += bitsToRead;
      this.bitsRemaining -= bitsToRead;
    }

    return result;
  }

  readBit(): number {
    return this.readBits(1);
  }

  alignToByte(): void {
    this.bitsRemaining = 0;
  }

  hasMore(): boolean {
    return this.bitsRemaining > 0 || this.reader.hasMore();
  }
}

export class BitWriter {
  private writer: StreamWriter;
  private currentByte: number = 0;
  private bitsUsed: number = 0;

  constructor() {
    this.writer = new StreamWriter();
  }

  writeBits(value: number, count: number): void {
    let bitsWritten = 0;

    while (bitsWritten < count) {
      const bitsToWrite = Math.min(count - bitsWritten, 8 - this.bitsUsed);
      const mask = (1 << bitsToWrite) - 1;
      const bits = (value >> (count - bitsWritten - bitsToWrite)) & mask;
      
      this.currentByte = (this.currentByte << bitsToWrite) | bits;
      this.bitsUsed += bitsToWrite;
      bitsWritten += bitsToWrite;

      if (this.bitsUsed === 8) {
        this.writer.writeByte(this.currentByte);
        this.currentByte = 0;
        this.bitsUsed = 0;
      }
    }
  }

  writeBit(value: number): void {
    this.writeBits(value & 1, 1);
  }

  alignToByte(): void {
    if (this.bitsUsed > 0) {
      this.currentByte <<= (8 - this.bitsUsed);
      this.writer.writeByte(this.currentByte);
      this.currentByte = 0;
      this.bitsUsed = 0;
    }
  }

  toUint8Array(): Uint8Array {
    this.alignToByte();
    return this.writer.toUint8Array();
  }
}