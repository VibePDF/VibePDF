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
    // More accurate text measurement using font metrics
    const scale = size / this.metrics.unitsPerEm;
    let width = 0;
    
    // Character width mapping for standard fonts (simplified)
    const charWidths = this.getCharacterWidths();
    
    for (let i = 0; i < text.length; i++) {
      const char = text.charAt(i);
      const charCode = char.charCodeAt(0);
      
      // Use character-specific width if available, otherwise use average
      const charWidth = charWidths[charCode] || this.getAverageCharWidth();
      width += charWidth * scale;
    }
    
    return width;
  }

  measureTextAdvanced(text: string, size: number): {
    width: number;
    height: number;
    ascent: number;
    descent: number;
  } {
    const scale = size / this.metrics.unitsPerEm;
    
    return {
      width: this.measureText(text, size),
      height: (this.metrics.ascent - this.metrics.descent) * scale,
      ascent: this.metrics.ascent * scale,
      descent: this.metrics.descent * scale
    };
  }

  getLineHeight(size: number): number {
    const scale = size / this.metrics.unitsPerEm;
    return (this.metrics.ascent - this.metrics.descent + this.metrics.lineGap) * scale;
  }

  getWordSpacing(size: number): number {
    // Standard word spacing is typically the width of a space character
    const scale = size / this.metrics.unitsPerEm;
    const spaceWidth = this.getCharacterWidths()[32] || 250; // ASCII 32 is space
    return spaceWidth * scale;
  }

  private getCharacterWidths(): Record<number, number> {
    // Simplified character width mapping for standard fonts
    // In a full implementation, this would be loaded from font files
    const baseWidths: Record<number, number> = {
      32: 250,  // space
      33: 333,  // !
      34: 408,  // "
      35: 500,  // #
      36: 500,  // $
      37: 833,  // %
      38: 778,  // &
      39: 180,  // '
      40: 333,  // (
      41: 333,  // )
      42: 500,  // *
      43: 564,  // +
      44: 250,  // ,
      45: 333,  // -
      46: 250,  // .
      47: 278,  // /
      48: 500,  // 0
      49: 500,  // 1
      50: 500,  // 2
      51: 500,  // 3
      52: 500,  // 4
      53: 500,  // 5
      54: 500,  // 6
      55: 500,  // 7
      56: 500,  // 8
      57: 500,  // 9
      58: 278,  // :
      59: 278,  // ;
      60: 564,  // <
      61: 564,  // =
      62: 564,  // >
      63: 444,  // ?
      64: 921,  // @
      65: 722,  // A
      66: 667,  // B
      67: 667,  // C
      68: 722,  // D
      69: 611,  // E
      70: 556,  // F
      71: 722,  // G
      72: 722,  // H
      73: 333,  // I
      74: 389,  // J
      75: 722,  // K
      76: 611,  // L
      77: 889,  // M
      78: 722,  // N
      79: 722,  // O
      80: 556,  // P
      81: 722,  // Q
      82: 667,  // R
      83: 556,  // S
      84: 611,  // T
      85: 722,  // U
      86: 722,  // V
      87: 944,  // W
      88: 722,  // X
      89: 722,  // Y
      90: 611,  // Z
      97: 444,  // a
      98: 500,  // b
      99: 444,  // c
      100: 500, // d
      101: 444, // e
      102: 333, // f
      103: 500, // g
      104: 500, // h
      105: 278, // i
      106: 278, // j
      107: 500, // k
      108: 278, // l
      109: 778, // m
      110: 500, // n
      111: 500, // o
      112: 500, // p
      113: 500, // q
      114: 333, // r
      115: 389, // s
      116: 278, // t
      117: 500, // u
      118: 500, // v
      119: 722, // w
      120: 500, // x
      121: 500, // y
      122: 444  // z
    };

    // Adjust widths based on font style
    if (this.name.includes('Bold')) {
      // Bold fonts are typically wider
      Object.keys(baseWidths).forEach(key => {
        baseWidths[parseInt(key)] *= 1.1;
      });
    }

    if (this.name.includes('Courier')) {
      // Courier is monospace - all characters have same width
      const monoWidth = 600;
      Object.keys(baseWidths).forEach(key => {
        baseWidths[parseInt(key)] = monoWidth;
      });
    }

    return baseWidths;
  }

  private getAverageCharWidth(): number {
    // Average character width for the font
    const charWidths = this.getCharacterWidths();
    const widths = Object.values(charWidths);
    return widths.reduce((sum, width) => sum + width, 0) / widths.length;
  }
}