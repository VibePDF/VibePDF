/**
 * Image processing and embedding for PDFs
 */

import { PDFDict, PDFStream, PDFError } from '../types/index.js';
import { PDFStreamProcessor } from '../core/PDFStream.js';

export enum ImageFormat {
  JPEG = 'JPEG',
  PNG = 'PNG',
  GIF = 'GIF',
  BMP = 'BMP'
}

export interface ImageInfo {
  width: number;
  height: number;
  bitsPerComponent: number;
  colorSpace: string;
  format: ImageFormat;
  hasAlpha: boolean;
}

export class ImageProcessor {
  
  static async embedImage(imageData: Uint8Array, format?: ImageFormat): Promise<PDFStream> {
    const info = await this.analyzeImage(imageData, format);
    
    switch (info.format) {
      case ImageFormat.JPEG:
        return this.embedJPEG(imageData, info);
      case ImageFormat.PNG:
        return this.embedPNG(imageData, info);
      default:
        throw new PDFError(`Unsupported image format: ${info.format}`);
    }
  }

  private static async analyzeImage(data: Uint8Array, format?: ImageFormat): Promise<ImageInfo> {
    if (format) {
      return this.analyzeImageByFormat(data, format);
    }

    // Auto-detect format from header
    if (this.isJPEG(data)) {
      return this.analyzeJPEG(data);
    } else if (this.isPNG(data)) {
      return this.analyzePNG(data);
    } else {
      throw new PDFError('Unknown image format');
    }
  }

  private static isJPEG(data: Uint8Array): boolean {
    return data.length >= 2 && data[0] === 0xFF && data[1] === 0xD8;
  }

  private static isPNG(data: Uint8Array): boolean {
    const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
    if (data.length < 8) return false;
    
    for (let i = 0; i < 8; i++) {
      if (data[i] !== pngSignature[i]) return false;
    }
    return true;
  }

  private static analyzeJPEG(data: Uint8Array): ImageInfo {
    let offset = 2; // Skip SOI marker
    
    while (offset < data.length - 1) {
      if (data[offset] !== 0xFF) break;
      
      const marker = data[offset + 1];
      offset += 2;
      
      if (marker === 0xC0 || marker === 0xC2) { // SOF0 or SOF2
        const length = (data[offset] << 8) | data[offset + 1];
        const precision = data[offset + 2];
        const height = (data[offset + 3] << 8) | data[offset + 4];
        const width = (data[offset + 5] << 8) | data[offset + 6];
        const components = data[offset + 7];
        
        return {
          width,
          height,
          bitsPerComponent: precision,
          colorSpace: components === 1 ? 'DeviceGray' : 'DeviceRGB',
          format: ImageFormat.JPEG,
          hasAlpha: false
        };
      } else {
        // Skip this segment
        const length = (data[offset] << 8) | data[offset + 1];
        offset += length;
      }
    }
    
    throw new PDFError('Invalid JPEG format');
  }

  private static analyzePNG(data: Uint8Array): ImageInfo {
    let offset = 8; // Skip PNG signature
    
    while (offset < data.length) {
      const length = (data[offset] << 24) | (data[offset + 1] << 16) | 
                    (data[offset + 2] << 8) | data[offset + 3];
      const type = String.fromCharCode(data[offset + 4], data[offset + 5], 
                                      data[offset + 6], data[offset + 7]);
      
      if (type === 'IHDR') {
        const width = (data[offset + 8] << 24) | (data[offset + 9] << 16) | 
                     (data[offset + 10] << 8) | data[offset + 11];
        const height = (data[offset + 12] << 24) | (data[offset + 13] << 16) | 
                      (data[offset + 14] << 8) | data[offset + 15];
        const bitDepth = data[offset + 16];
        const colorType = data[offset + 17];
        
        let colorSpace: string;
        let hasAlpha = false;
        
        switch (colorType) {
          case 0: colorSpace = 'DeviceGray'; break;
          case 2: colorSpace = 'DeviceRGB'; break;
          case 3: colorSpace = 'Indexed'; break;
          case 4: colorSpace = 'DeviceGray'; hasAlpha = true; break;
          case 6: colorSpace = 'DeviceRGB'; hasAlpha = true; break;
          default: throw new PDFError(`Unsupported PNG color type: ${colorType}`);
        }
        
        return {
          width,
          height,
          bitsPerComponent: bitDepth,
          colorSpace,
          format: ImageFormat.PNG,
          hasAlpha
        };
      }
      
      offset += 12 + length; // 4 bytes length + 4 bytes type + data + 4 bytes CRC
    }
    
    throw new PDFError('Invalid PNG format: IHDR chunk not found');
  }

  private static analyzeImageByFormat(data: Uint8Array, format: ImageFormat): ImageInfo {
    switch (format) {
      case ImageFormat.JPEG:
        return this.analyzeJPEG(data);
      case ImageFormat.PNG:
        return this.analyzePNG(data);
      default:
        throw new PDFError(`Format analysis not implemented for: ${format}`);
    }
  }

  private static async embedJPEG(data: Uint8Array, info: ImageInfo): Promise<PDFStream> {
    const dict: PDFDict = {
      Type: 'XObject',
      Subtype: 'Image',
      Width: info.width,
      Height: info.height,
      BitsPerComponent: info.bitsPerComponent,
      ColorSpace: info.colorSpace,
      Filter: 'DCTDecode'
    };

    return PDFStreamProcessor.createStream(data, dict);
  }

  private static async embedPNG(data: Uint8Array, info: ImageInfo): Promise<PDFStream> {
    // PNG requires decompression and re-encoding for PDF
    const decompressedData = await this.decompressPNG(data);
    
    const dict: PDFDict = {
      Type: 'XObject',
      Subtype: 'Image',
      Width: info.width,
      Height: info.height,
      BitsPerComponent: info.bitsPerComponent,
      ColorSpace: info.colorSpace
    };

    if (info.hasAlpha) {
      // Handle alpha channel separately
      const { imageData, alphaData } = this.separateAlpha(decompressedData, info);
      dict.SMask = await this.createAlphaMask(alphaData, info);
      return await PDFStreamProcessor.createCompressedStream(imageData, undefined, dict);
    } else {
      return await PDFStreamProcessor.createCompressedStream(decompressedData, undefined, dict);
    }
  }

  private static async decompressPNG(data: Uint8Array): Promise<Uint8Array> {
    // Implementation for PNG decompression
    // This would involve parsing PNG chunks and decompressing IDAT data
    throw new PDFError('PNG decompression not yet implemented');
  }

  private static separateAlpha(data: Uint8Array, info: ImageInfo): { imageData: Uint8Array, alphaData: Uint8Array } {
    // Implementation for separating alpha channel from image data
    throw new PDFError('Alpha separation not yet implemented');
  }

  private static async createAlphaMask(alphaData: Uint8Array, info: ImageInfo): Promise<PDFStream> {
    const dict: PDFDict = {
      Type: 'XObject',
      Subtype: 'Image',
      Width: info.width,
      Height: info.height,
      BitsPerComponent: info.bitsPerComponent,
      ColorSpace: 'DeviceGray'
    };

    return await PDFStreamProcessor.createCompressedStream(alphaData, undefined, dict);
  }

  // Utility methods for image manipulation
  static async resizeImage(data: Uint8Array, newWidth: number, newHeight: number): Promise<Uint8Array> {
    // Implementation for image resizing
    throw new PDFError('Image resizing not yet implemented');
  }

  static async convertColorSpace(data: Uint8Array, fromSpace: string, toSpace: string): Promise<Uint8Array> {
    // Implementation for color space conversion
    throw new PDFError('Color space conversion not yet implemented');
  }
}