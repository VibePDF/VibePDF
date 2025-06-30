/**
 * PDF Stream handling with compression support
 */

import { PDFDict, PDFStream, CompressionType, PDFError } from '../types/index.js';

export class PDFStreamProcessor {
  
  static createStream(data: Uint8Array, dict: PDFDict = {}): PDFStream {
    const streamDict = {
      ...dict,
      Length: data.length
    };

    return {
      dict: streamDict,
      data
    };
  }

  static async createCompressedStream(
    data: Uint8Array, 
    compression: CompressionType = CompressionType.FlateDecode,
    dict: PDFDict = {}
  ): Promise<PDFStream> {
    let compressedData: Uint8Array;

    switch (compression) {
      case CompressionType.None:
        compressedData = data;
        break;
      case CompressionType.FlateDecode:
        compressedData = await this.deflateCompress(data);
        dict.Filter = 'FlateDecode';
        break;
      default:
        throw new PDFError(`Compression type ${compression} not implemented`);
    }

    return this.createStream(compressedData, dict);
  }

  static async decompressStream(stream: PDFStream): Promise<Uint8Array> {
    const filter = stream.dict.Filter;
    
    if (!filter || filter === CompressionType.None) {
      return stream.data;
    }

    switch (filter) {
      case CompressionType.FlateDecode:
        return await this.deflateDecompress(stream.data);
      default:
        throw new PDFError(`Filter ${filter} not supported`);
    }
  }

  private static async deflateCompress(data: Uint8Array): Promise<Uint8Array> {
    // Simple implementation using built-in compression
    // In production, use proper deflate implementation
    const stream = new CompressionStream('deflate');
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();
    
    writer.write(data);
    writer.close();
    
    const chunks: Uint8Array[] = [];
    let done = false;
    
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) chunks.push(value);
    }
    
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    
    return result;
  }

  private static async deflateDecompress(data: Uint8Array): Promise<Uint8Array> {
    // Simple implementation using built-in decompression
    // In production, use proper deflate implementation
    const stream = new DecompressionStream('deflate');
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();
    
    writer.write(data);
    writer.close();
    
    const chunks: Uint8Array[] = [];
    let done = false;
    
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) chunks.push(value);
    }
    
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    
    return result;
  }

  static async createContentStream(operations: string[]): Promise<PDFStream> {
    const content = operations.join('\n');
    const data = new TextEncoder().encode(content);
    return await this.createCompressedStream(data);
  }
}