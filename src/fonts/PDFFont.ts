/**
 * PDF Font handling and embedding
 */

import { PDFDict, StandardFonts, FontMetrics } from '../types/index.js';
import { PDFObject, PDFObjectId } from '../core/PDFObject.js';

export class PDFFont {
  constructor(
    private id: PDFObjectId,
    private name: string,
    private metrics: FontMetrics
  ) {}

  getName(): string {
    return this.name;
  }

  getMetrics(): FontMetrics {
    return this.metrics;
  }

  getObject(): PDFObject {
    const fontDict: PDFDict = {
      Type: 'Font',
      Subtype: 'Type1',
      BaseFont: this.name
    };

    // Add encoding for standard fonts
    if (Object.values(StandardFonts).includes(this.name as StandardFonts)) {
      fontDict.Encoding = 'WinAnsiEncoding';
    }

    return new PDFObject(this.id, fontDict);
  }

  measureText(text: string, size: number): number {
    // Simple width calculation - should use actual font metrics
    const avgCharWidth = size * 0.6; // Approximate average character width
    return text.length * avgCharWidth;
  }

  getLineHeight(size: number): number {
    return size * 1.2; // Standard line height
  }
}