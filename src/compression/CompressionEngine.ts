/**
 * Compression Engine - Handles various PDF compression algorithms
 */

import { CompressionType, PDFError, PDFCompressionError } from '../types/index.js';

export interface CompressionResult {
  data: Uint8Array;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  algorithm: CompressionType;
}

export class CompressionEngine {
  
  static async compress(
    data: Uint8Array, 
    algorithm: CompressionType = CompressionType.FlateDecode
  ): Promise<CompressionResult> {
    const originalSize = data.length;
    let compressedData: Uint8Array;

    try {
      switch (algorithm) {
        case CompressionType.FlateDecode:
          compressedData = await this.compressFlateDecode(data);
          break;
        case CompressionType.LZWDecode:
          compressedData = await this.compressLZW(data);
          break;
        case CompressionType.RunLengthDecode:
          compressedData = this.compressRunLength(data);
          break;
        case CompressionType.ASCII85Decode:
          compressedData = this.encodeASCII85(data);
          break;
        case CompressionType.ASCIIHexDecode:
          compressedData = this.encodeASCIIHex(data);
          break;
        case CompressionType.None:
          compressedData = data;
          break;
        default:
          throw new PDFCompressionError(`Unsupported compression algorithm: ${algorithm}`);
      }

      const compressedSize = compressedData.length;
      const compressionRatio = originalSize > 0 ? (originalSize - compressedSize) / originalSize : 0;

      return {
        data: compressedData,
        originalSize,
        compressedSize,
        compressionRatio,
        algorithm
      };
    } catch (error) {
      throw new PDFCompressionError(
        `Compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        algorithm
      );
    }
  }

  static async decompress(
    data: Uint8Array, 
    algorithm: CompressionType
  ): Promise<Uint8Array> {
    try {
      switch (algorithm) {
        case CompressionType.FlateDecode:
          return await this.decompressFlateDecode(data);
        case CompressionType.LZWDecode:
          return await this.decompressLZW(data);
        case CompressionType.RunLengthDecode:
          return this.decompressRunLength(data);
        case CompressionType.ASCII85Decode:
          return this.decodeASCII85(data);
        case CompressionType.ASCIIHexDecode:
          return this.decodeASCIIHex(data);
        case CompressionType.None:
          return data;
        default:
          throw new PDFCompressionError(`Unsupported decompression algorithm: ${algorithm}`);
      }
    } catch (error) {
      throw new PDFCompressionError(
        `Decompression failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        algorithm
      );
    }
  }

  // FlateDecode (Deflate/Inflate) compression
  private static async compressFlateDecode(data: Uint8Array): Promise<Uint8Array> {
    // Use browser's CompressionStream if available
    if (typeof CompressionStream !== 'undefined') {
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
        if (value) {
          chunks.push(value);
        }
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
    
    // Fallback: simple compression simulation (not actual deflate)
    return this.simpleCompress(data);
  }

  private static async decompressFlateDecode(data: Uint8Array): Promise<Uint8Array> {
    // Use browser's DecompressionStream if available
    if (typeof DecompressionStream !== 'undefined') {
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
        if (value) {
          chunks.push(value);
        }
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
    
    // Fallback: return original data
    return data;
  }

  // LZW compression (simplified implementation)
  private static async compressLZW(data: Uint8Array): Promise<Uint8Array> {
    const dictionary = new Map<string, number>();
    const result: number[] = [];
    
    // Initialize dictionary with single characters
    for (let i = 0; i < 256; i++) {
      dictionary.set(String.fromCharCode(i), i);
    }
    
    let nextCode = 256;
    let current = '';
    
    for (let i = 0; i < data.length; i++) {
      const char = String.fromCharCode(data[i]);
      const combined = current + char;
      
      if (dictionary.has(combined)) {
        current = combined;
      } else {
        result.push(dictionary.get(current)!);
        dictionary.set(combined, nextCode++);
        current = char;
      }
    }
    
    if (current) {
      result.push(dictionary.get(current)!);
    }
    
    // Convert to bytes (simplified)
    const output = new Uint8Array(result.length * 2);
    for (let i = 0; i < result.length; i++) {
      output[i * 2] = (result[i] >> 8) & 0xFF;
      output[i * 2 + 1] = result[i] & 0xFF;
    }
    
    return output;
  }

  private static async decompressLZW(data: Uint8Array): Promise<Uint8Array> {
    const dictionary = new Map<number, string>();
    const result: string[] = [];
    
    // Initialize dictionary
    for (let i = 0; i < 256; i++) {
      dictionary.set(i, String.fromCharCode(i));
    }
    
    let nextCode = 256;
    let previous = '';
    
    for (let i = 0; i < data.length; i += 2) {
      if (i + 1 >= data.length) break;
      
      const code = (data[i] << 8) | data[i + 1];
      let current = dictionary.get(code);
      
      if (current === undefined) {
        current = previous + previous.charAt(0);
      }
      
      result.push(current);
      
      if (previous) {
        dictionary.set(nextCode++, previous + current.charAt(0));
      }
      
      previous = current;
    }
    
    return new TextEncoder().encode(result.join(''));
  }

  // Run Length Encoding
  private static compressRunLength(data: Uint8Array): Uint8Array {
    const result: number[] = [];
    let i = 0;
    
    while (i < data.length) {
      const currentByte = data[i];
      let count = 1;
      
      // Count consecutive identical bytes
      while (i + count < data.length && data[i + count] === currentByte && count < 128) {
        count++;
      }
      
      if (count > 1) {
        // Encode run
        result.push(257 - count); // Negative count
        result.push(currentByte);
        i += count;
      } else {
        // Find literal run
        let literalStart = i;
        while (i < data.length && 
               (i === literalStart || data[i] !== data[i - 1]) && 
               (i - literalStart) < 128) {
          i++;
        }
        
        const literalLength = i - literalStart;
        result.push(literalLength - 1); // Positive count
        for (let j = literalStart; j < i; j++) {
          result.push(data[j]);
        }
      }
    }
    
    result.push(128); // EOD marker
    return new Uint8Array(result);
  }

  private static decompressRunLength(data: Uint8Array): Uint8Array {
    const result: number[] = [];
    let i = 0;
    
    while (i < data.length) {
      const length = data[i++];
      
      if (length === 128) {
        // EOD marker
        break;
      } else if (length < 128) {
        // Literal run
        for (let j = 0; j <= length; j++) {
          if (i < data.length) {
            result.push(data[i++]);
          }
        }
      } else {
        // Encoded run
        const count = 257 - length;
        const value = data[i++];
        for (let j = 0; j < count; j++) {
          result.push(value);
        }
      }
    }
    
    return new Uint8Array(result);
  }

  // ASCII85 encoding
  private static encodeASCII85(data: Uint8Array): Uint8Array {
    const result: string[] = [];
    
    for (let i = 0; i < data.length; i += 4) {
      let value = 0;
      let count = 0;
      
      for (let j = 0; j < 4 && i + j < data.length; j++) {
        value = (value << 8) + data[i + j];
        count++;
      }
      
      if (count < 4) {
        value <<= (4 - count) * 8;
      }
      
      if (value === 0 && count === 4) {
        result.push('z');
      } else {
        const chars: string[] = [];
        for (let k = 0; k < 5; k++) {
          chars.unshift(String.fromCharCode(33 + (value % 85)));
          value = Math.floor(value / 85);
        }
        result.push(chars.slice(0, count + 1).join(''));
      }
    }
    
    return new TextEncoder().encode('<~' + result.join('') + '~>');
  }

  private static decodeASCII85(data: Uint8Array): Uint8Array {
    const text = new TextDecoder().decode(data);
    const content = text.replace(/^<~|~>$/g, '').replace(/\s/g, '');
    const result: number[] = [];
    
    for (let i = 0; i < content.length; i += 5) {
      const chunk = content.substr(i, 5);
      
      if (chunk === 'z') {
        result.push(0, 0, 0, 0);
        continue;
      }
      
      let value = 0;
      for (let j = 0; j < chunk.length; j++) {
        value = value * 85 + (chunk.charCodeAt(j) - 33);
      }
      
      const bytes: number[] = [];
      for (let k = 0; k < 4; k++) {
        bytes.unshift(value & 0xFF);
        value >>= 8;
      }
      
      result.push(...bytes.slice(0, chunk.length - 1));
    }
    
    return new Uint8Array(result);
  }

  // ASCII Hex encoding
  private static encodeASCIIHex(data: Uint8Array): Uint8Array {
    const hex = Array.from(data)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    
    return new TextEncoder().encode('<' + hex + '>');
  }

  private static decodeASCIIHex(data: Uint8Array): Uint8Array {
    const text = new TextDecoder().decode(data);
    const hex = text.replace(/[<>\s]/g, '');
    const result: number[] = [];
    
    for (let i = 0; i < hex.length; i += 2) {
      const hexPair = hex.substr(i, 2).padEnd(2, '0');
      result.push(parseInt(hexPair, 16));
    }
    
    return new Uint8Array(result);
  }

  // Simple compression fallback
  private static simpleCompress(data: Uint8Array): Uint8Array {
    // Very basic compression: remove consecutive duplicate bytes
    const result: number[] = [];
    let i = 0;
    
    while (i < data.length) {
      const currentByte = data[i];
      let count = 1;
      
      while (i + count < data.length && data[i + count] === currentByte && count < 255) {
        count++;
      }
      
      if (count > 3) {
        // Use run-length encoding for runs of 4 or more
        result.push(0xFF, count, currentByte);
      } else {
        // Copy literal bytes
        for (let j = 0; j < count; j++) {
          result.push(currentByte);
        }
      }
      
      i += count;
    }
    
    return new Uint8Array(result);
  }

  // Compression analysis
  static analyzeCompression(data: Uint8Array): {
    entropy: number;
    repetition: number;
    recommendedAlgorithm: CompressionType;
    estimatedRatio: number;
  } {
    const entropy = this.calculateEntropy(data);
    const repetition = this.calculateRepetition(data);
    
    let recommendedAlgorithm: CompressionType;
    let estimatedRatio: number;
    
    if (repetition > 0.7) {
      recommendedAlgorithm = CompressionType.RunLengthDecode;
      estimatedRatio = repetition;
    } else if (entropy < 6) {
      recommendedAlgorithm = CompressionType.FlateDecode;
      estimatedRatio = (8 - entropy) / 8 * 0.6;
    } else {
      recommendedAlgorithm = CompressionType.LZWDecode;
      estimatedRatio = 0.2;
    }
    
    return {
      entropy,
      repetition,
      recommendedAlgorithm,
      estimatedRatio
    };
  }

  private static calculateEntropy(data: Uint8Array): number {
    const frequencies = new Array(256).fill(0);
    
    for (const byte of data) {
      frequencies[byte]++;
    }
    
    let entropy = 0;
    const length = data.length;
    
    for (const freq of frequencies) {
      if (freq > 0) {
        const probability = freq / length;
        entropy -= probability * Math.log2(probability);
      }
    }
    
    return entropy;
  }

  private static calculateRepetition(data: Uint8Array): number {
    let repetitiveBytes = 0;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i] === data[i - 1]) {
        repetitiveBytes++;
      }
    }
    
    return data.length > 1 ? repetitiveBytes / (data.length - 1) : 0;
  }
}

// Compression utilities
export class CompressionUtils {
  static async compressMultiple(
    data: Uint8Array, 
    algorithms: CompressionType[]
  ): Promise<CompressionResult[]> {
    const results: CompressionResult[] = [];
    
    for (const algorithm of algorithms) {
      try {
        const result = await CompressionEngine.compress(data, algorithm);
        results.push(result);
      } catch (error) {
        console.warn(`Compression with ${algorithm} failed:`, error);
      }
    }
    
    return results.sort((a, b) => a.compressedSize - b.compressedSize);
  }

  static findBestCompression(results: CompressionResult[]): CompressionResult | null {
    if (results.length === 0) return null;
    
    return results.reduce((best, current) => 
      current.compressionRatio > best.compressionRatio ? current : best
    );
  }

  static async optimizeCompression(data: Uint8Array): Promise<CompressionResult> {
    const analysis = CompressionEngine.analyzeCompression(data);
    
    // Try the recommended algorithm first
    try {
      return await CompressionEngine.compress(data, analysis.recommendedAlgorithm);
    } catch (error) {
      // Fallback to FlateDecode
      return await CompressionEngine.compress(data, CompressionType.FlateDecode);
    }
  }
}