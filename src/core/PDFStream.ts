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
        // For now, we'll skip compression to ensure compatibility
        compressedData = data;
        break;
      default:
        compressedData = data;
    }

    return this.createStream(compressedData, dict);
  }

  static async createContentStream(operations: string[]): Promise<PDFStream> {
    const content = operations.join('\n');
    const data = new TextEncoder().encode(content);
    return this.createStream(data);
  }
}