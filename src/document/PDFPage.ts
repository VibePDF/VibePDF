/**
 * PDFPage - Individual page handling and content generation
 */

import { 
  PageConfig, 
  TextOptions, 
  DrawOptions,
  Color,
  Point,
  Rectangle,
  PDFDict,
  PDFRef,
  Size
} from '../types/index.js';
import { PDFObject, PDFObjectId } from '../core/PDFObject.js';
import { PDFFont } from '../fonts/PDFFont.js';

export interface TextBlock {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  lines: string[];
}

export class PDFPage {
  private contentOperations: string[] = [];
  private resources: PDFDict = {
    Font: {},
    XObject: {},
    ColorSpace: {},
    ExtGState: {},
    Pattern: {},
    Shading: {}
  };
  private fonts: Map<string, PDFFont> = new Map();

  constructor(
    private id: PDFObjectId,
    private config: PageConfig,
    private parentRef: PDFRef
  ) {}

  // Enhanced text operations
  drawText(text: string, options: TextOptions = {}): void {
    const {
      x = 0,
      y = 0,
      size = 12,
      color = { r: 0, g: 0, b: 0 },
      font = 'Helvetica',
      maxWidth,
      lineHeight,
      align = 'left'
    } = options;

    console.log(`Drawing text: "${text}" at (${x}, ${y}) with font ${font}, size ${size}`);

    // Ensure we have proper graphics state
    this.contentOperations.push('q'); // Save graphics state

    // Handle text wrapping if maxWidth is specified
    if (maxWidth) {
      this.drawWrappedText(text, x, y, maxWidth, size, font, color, align, lineHeight);
    } else {
      this.drawSingleLineText(text, x, y, size, font, color);
    }

    this.contentOperations.push('Q'); // Restore graphics state
  }

  drawTextBlock(text: string, options: TextOptions & {
    padding?: { top?: number; right?: number; bottom?: number; left?: number };
    backgroundColor?: Color;
    borderColor?: Color;
    borderWidth?: number;
  } = {}): TextBlock {
    const {
      x = 0,
      y = 0,
      size = 12,
      font = 'Helvetica',
      maxWidth = this.getSize().width - x - 50,
      lineHeight,
      align = 'left',
      padding = {},
      backgroundColor,
      borderColor,
      borderWidth = 1
    } = options;

    const actualPadding = {
      top: padding.top || 10,
      right: padding.right || 10,
      bottom: padding.bottom || 10,
      left: padding.left || 10
    };

    // Calculate text dimensions
    const lines = this.wrapText(text, maxWidth - actualPadding.left - actualPadding.right, size, font);
    const actualLineHeight = lineHeight || size * 1.2;
    const textHeight = lines.length * actualLineHeight;
    const blockWidth = maxWidth;
    const blockHeight = textHeight + actualPadding.top + actualPadding.bottom;

    this.contentOperations.push('q'); // Save graphics state

    // Draw background if specified
    if (backgroundColor) {
      this.drawRectangle(
        { x, y: y - blockHeight, width: blockWidth, height: blockHeight },
        { fillColor: backgroundColor }
      );
    }

    // Draw border if specified
    if (borderColor) {
      this.drawRectangle(
        { x, y: y - blockHeight, width: blockWidth, height: blockHeight },
        { strokeColor: borderColor, lineWidth: borderWidth }
      );
    }

    // Draw text
    this.drawText(text, {
      ...options,
      x: x + actualPadding.left,
      y: y - actualPadding.top,
      maxWidth: maxWidth - actualPadding.left - actualPadding.right
    });

    this.contentOperations.push('Q'); // Restore graphics state

    return {
      text,
      x,
      y: y - blockHeight,
      width: blockWidth,
      height: blockHeight,
      lines
    };
  }

  private drawSingleLineText(text: string, x: number, y: number, size: number, font: string, color: Color): void {
    this.contentOperations.push('BT'); // Begin text
    this.setTextColor(color);
    this.contentOperations.push(`/${font} ${this.formatNumber(size)} Tf`); // Set font and size
    this.contentOperations.push(`${this.formatNumber(x)} ${this.formatNumber(y)} Td`); // Move to position
    this.contentOperations.push(`(${this.escapeString(text)}) Tj`); // Show text
    this.contentOperations.push('ET'); // End text

    // Add font to resources if not already present
    if (!this.resources.Font![font]) {
      this.resources.Font![font] = { objectNumber: 0, generationNumber: 0 }; // Will be updated
    }
  }

  private drawWrappedText(
    text: string, 
    x: number, 
    y: number, 
    maxWidth: number, 
    size: number, 
    font: string, 
    color: Color, 
    align: string,
    lineHeight?: number
  ): void {
    const lines = this.wrapText(text, maxWidth, size, font);
    const actualLineHeight = lineHeight || size * 1.2;
    
    this.contentOperations.push('BT');
    this.setTextColor(color);
    this.contentOperations.push(`/${font} ${this.formatNumber(size)} Tf`);
    
    let currentY = y;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let lineX = x;
      
      // Handle text alignment
      if (align === 'center') {
        const lineWidth = this.measureText(line, size, font);
        lineX = x + (maxWidth - lineWidth) / 2;
      } else if (align === 'right') {
        const lineWidth = this.measureText(line, size, font);
        lineX = x + maxWidth - lineWidth;
      } else if (align === 'justify' && i < lines.length - 1) {
        // Justify text (except last line)
        this.drawJustifiedLine(line, x, currentY, maxWidth, size, font);
        currentY -= actualLineHeight;
        continue;
      }
      
      this.contentOperations.push(`${this.formatNumber(lineX)} ${this.formatNumber(currentY)} Td`);
      this.contentOperations.push(`(${this.escapeString(line)}) Tj`);
      
      if (i < lines.length - 1) {
        this.contentOperations.push(`${this.formatNumber(-lineX)} ${this.formatNumber(-actualLineHeight)} Td`);
        currentY -= actualLineHeight;
      }
    }
    
    this.contentOperations.push('ET');
  }

  private drawJustifiedLine(line: string, x: number, y: number, maxWidth: number, size: number, font: string): void {
    const words = line.trim().split(/\s+/);
    if (words.length <= 1) {
      // Can't justify single word, draw normally
      this.contentOperations.push(`${this.formatNumber(x)} ${this.formatNumber(y)} Td`);
      this.contentOperations.push(`(${this.escapeString(line)}) Tj`);
      return;
    }

    const totalTextWidth = words.reduce((sum, word) => sum + this.measureText(word, size, font), 0);
    const totalSpaceWidth = maxWidth - totalTextWidth;
    const spaceWidth = totalSpaceWidth / (words.length - 1);

    this.contentOperations.push(`${this.formatNumber(x)} ${this.formatNumber(y)} Td`);
    
    for (let i = 0; i < words.length; i++) {
      this.contentOperations.push(`(${this.escapeString(words[i])}) Tj`);
      
      if (i < words.length - 1) {
        // Move to next word position
        this.contentOperations.push(`${this.formatNumber(spaceWidth)} 0 Td`);
      }
    }
  }

  private wrapText(text: string, maxWidth: number, size: number, font: string): string[] {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = this.measureText(testLine, size, font);

      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Word is too long, try to break it
          const brokenWords = this.breakLongWord(word, maxWidth, size, font);
          lines.push(...brokenWords.slice(0, -1));
          currentLine = brokenWords[brokenWords.length - 1];
        }
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  private breakLongWord(word: string, maxWidth: number, size: number, font: string): string[] {
    const parts: string[] = [];
    let currentPart = '';

    for (let i = 0; i < word.length; i++) {
      const testPart = currentPart + word[i];
      const testWidth = this.measureText(testPart, size, font);

      if (testWidth <= maxWidth) {
        currentPart = testPart;
      } else {
        if (currentPart) {
          parts.push(currentPart);
          currentPart = word[i];
        } else {
          // Single character is too wide, add it anyway
          parts.push(word[i]);
        }
      }
    }

    if (currentPart) {
      parts.push(currentPart);
    }

    return parts;
  }

  private measureText(text: string, size: number, font: string): number {
    const fontObj = this.getFont(font);
    if (fontObj) {
      return fontObj.measureText(text, size);
    }
    
    // Fallback measurement
    const avgCharWidth = size * 0.6;
    return text.length * avgCharWidth;
  }

  // Enhanced shape drawing operations
  drawRectangle(rect: Rectangle, options: DrawOptions = {}): void {
    const { x, y, width, height } = rect;
    const {
      lineWidth = 1,
      strokeColor,
      fillColor,
      opacity = 1
    } = options;

    console.log(`Drawing rectangle at (${x}, ${y}) with size ${width}x${height}`);

    this.contentOperations.push('q'); // Save graphics state

    if (opacity < 1) {
      this.setOpacity(opacity);
    }

    this.contentOperations.push(`${this.formatNumber(lineWidth)} w`); // Set line width
    
    if (fillColor) {
      this.setFillColor(fillColor);
    }
    
    if (strokeColor) {
      this.setStrokeColor(strokeColor);
    }

    // Draw rectangle
    this.contentOperations.push(`${this.formatNumber(x)} ${this.formatNumber(y)} ${this.formatNumber(width)} ${this.formatNumber(height)} re`);
    
    if (fillColor && strokeColor) {
      this.contentOperations.push('B'); // Fill and stroke
    } else if (fillColor) {
      this.contentOperations.push('f'); // Fill only
    } else if (strokeColor) {
      this.contentOperations.push('S'); // Stroke only
    }

    this.contentOperations.push('Q'); // Restore graphics state
  }

  drawRoundedRectangle(rect: Rectangle, radius: number, options: DrawOptions = {}): void {
    const { x, y, width, height } = rect;
    const r = Math.min(radius, width / 2, height / 2);

    const {
      lineWidth = 1,
      strokeColor,
      fillColor,
      opacity = 1
    } = options;

    this.contentOperations.push('q'); // Save graphics state

    if (opacity < 1) {
      this.setOpacity(opacity);
    }

    this.contentOperations.push(`${this.formatNumber(lineWidth)} w`);
    
    if (fillColor) {
      this.setFillColor(fillColor);
    }
    
    if (strokeColor) {
      this.setStrokeColor(strokeColor);
    }

    // Draw rounded rectangle using curves
    this.contentOperations.push(`${this.formatNumber(x + r)} ${this.formatNumber(y)} m`); // Move to start
    this.contentOperations.push(`${this.formatNumber(x + width - r)} ${this.formatNumber(y)} l`); // Bottom line
    this.contentOperations.push(`${this.formatNumber(x + width)} ${this.formatNumber(y)} ${this.formatNumber(x + width)} ${this.formatNumber(y + r)} v`); // Bottom-right curve
    this.contentOperations.push(`${this.formatNumber(x + width)} ${this.formatNumber(y + height - r)} l`); // Right line
    this.contentOperations.push(`${this.formatNumber(x + width)} ${this.formatNumber(y + height)} ${this.formatNumber(x + width - r)} ${this.formatNumber(y + height)} v`); // Top-right curve
    this.contentOperations.push(`${this.formatNumber(x + r)} ${this.formatNumber(y + height)} l`); // Top line
    this.contentOperations.push(`${this.formatNumber(x)} ${this.formatNumber(y + height)} ${this.formatNumber(x)} ${this.formatNumber(y + height - r)} v`); // Top-left curve
    this.contentOperations.push(`${this.formatNumber(x)} ${this.formatNumber(y + r)} l`); // Left line
    this.contentOperations.push(`${this.formatNumber(x)} ${this.formatNumber(y)} ${this.formatNumber(x + r)} ${this.formatNumber(y)} v`); // Bottom-left curve
    this.contentOperations.push('h'); // Close path

    if (fillColor && strokeColor) {
      this.contentOperations.push('B');
    } else if (fillColor) {
      this.contentOperations.push('f');
    } else if (strokeColor) {
      this.contentOperations.push('S');
    }

    this.contentOperations.push('Q'); // Restore graphics state
  }

  drawLine(from: Point, to: Point, options: DrawOptions = {}): void {
    const {
      lineWidth = 1,
      strokeColor = { r: 0, g: 0, b: 0 },
      lineCap = 'butt',
      opacity = 1
    } = options;

    console.log(`Drawing line from (${from.x}, ${from.y}) to (${to.x}, ${to.y})`);

    this.contentOperations.push('q'); // Save graphics state

    if (opacity < 1) {
      this.setOpacity(opacity);
    }

    this.contentOperations.push(`${this.formatNumber(lineWidth)} w`); // Set line width
    this.setStrokeColor(strokeColor);
    
    // Set line cap style
    const capStyle = lineCap === 'butt' ? 0 : lineCap === 'round' ? 1 : 2;
    this.contentOperations.push(`${capStyle} J`);

    // Draw line
    this.contentOperations.push(`${this.formatNumber(from.x)} ${this.formatNumber(from.y)} m`); // Move to start
    this.contentOperations.push(`${this.formatNumber(to.x)} ${this.formatNumber(to.y)} l`); // Line to end
    this.contentOperations.push('S'); // Stroke

    this.contentOperations.push('Q'); // Restore graphics state
  }

  drawCircle(center: Point, radius: number, options: DrawOptions = {}): void {
    const {
      lineWidth = 1,
      strokeColor,
      fillColor,
      opacity = 1
    } = options;

    console.log(`Drawing circle at (${center.x}, ${center.y}) with radius ${radius}`);

    this.contentOperations.push('q'); // Save graphics state

    if (opacity < 1) {
      this.setOpacity(opacity);
    }

    this.contentOperations.push(`${this.formatNumber(lineWidth)} w`);
    
    if (fillColor) {
      this.setFillColor(fillColor);
    }
    
    if (strokeColor) {
      this.setStrokeColor(strokeColor);
    }

    // Approximate circle with Bézier curves
    const k = 0.5522847498; // Control point factor for circle approximation
    const { x, y } = center;
    
    this.contentOperations.push(`${this.formatNumber(x + radius)} ${this.formatNumber(y)} m`); // Move to right point
    this.contentOperations.push(`${this.formatNumber(x + radius)} ${this.formatNumber(y + radius * k)} ${this.formatNumber(x + radius * k)} ${this.formatNumber(y + radius)} ${this.formatNumber(x)} ${this.formatNumber(y + radius)} c`);
    this.contentOperations.push(`${this.formatNumber(x - radius * k)} ${this.formatNumber(y + radius)} ${this.formatNumber(x - radius)} ${this.formatNumber(y + radius * k)} ${this.formatNumber(x - radius)} ${this.formatNumber(y)} c`);
    this.contentOperations.push(`${this.formatNumber(x - radius)} ${this.formatNumber(y - radius * k)} ${this.formatNumber(x - radius * k)} ${this.formatNumber(y - radius)} ${this.formatNumber(x)} ${this.formatNumber(y - radius)} c`);
    this.contentOperations.push(`${this.formatNumber(x + radius * k)} ${this.formatNumber(y - radius)} ${this.formatNumber(x + radius)} ${this.formatNumber(y - radius * k)} ${this.formatNumber(x + radius)} ${this.formatNumber(y)} c`);
    
    if (fillColor && strokeColor) {
      this.contentOperations.push('B');
    } else if (fillColor) {
      this.contentOperations.push('f');
    } else if (strokeColor) {
      this.contentOperations.push('S');
    }

    this.contentOperations.push('Q'); // Restore graphics state
  }

  drawEllipse(center: Point, radiusX: number, radiusY: number, options: DrawOptions = {}): void {
    // For simplicity, we'll draw an ellipse as a scaled circle
    const {
      lineWidth = 1,
      strokeColor,
      fillColor,
      opacity = 1
    } = options;

    this.contentOperations.push('q'); // Save graphics state

    if (opacity < 1) {
      this.setOpacity(opacity);
    }

    this.contentOperations.push(`${this.formatNumber(radiusX)} 0 0 ${this.formatNumber(radiusY)} ${this.formatNumber(center.x)} ${this.formatNumber(center.y)} cm`); // Transform
    
    this.contentOperations.push(`${this.formatNumber(lineWidth)} w`);
    
    if (fillColor) {
      this.setFillColor(fillColor);
    }
    
    if (strokeColor) {
      this.setStrokeColor(strokeColor);
    }

    // Draw unit circle
    const k = 0.5522847498;
    this.contentOperations.push(`1 0 m`);
    this.contentOperations.push(`1 ${this.formatNumber(k)} ${this.formatNumber(k)} 1 0 1 c`);
    this.contentOperations.push(`${this.formatNumber(-k)} 1 -1 ${this.formatNumber(k)} -1 0 c`);
    this.contentOperations.push(`-1 ${this.formatNumber(-k)} ${this.formatNumber(-k)} -1 0 -1 c`);
    this.contentOperations.push(`${this.formatNumber(k)} -1 1 ${this.formatNumber(-k)} 1 0 c`);
    
    if (fillColor && strokeColor) {
      this.contentOperations.push('B');
    } else if (fillColor) {
      this.contentOperations.push('f');
    } else if (strokeColor) {
      this.contentOperations.push('S');
    }

    this.contentOperations.push('Q'); // Restore graphics state
  }

  drawPolygon(points: Point[], options: DrawOptions = {}): void {
    if (points.length < 3) return;

    const {
      lineWidth = 1,
      strokeColor,
      fillColor,
      opacity = 1
    } = options;

    this.contentOperations.push('q'); // Save graphics state

    if (opacity < 1) {
      this.setOpacity(opacity);
    }

    this.contentOperations.push(`${this.formatNumber(lineWidth)} w`);
    
    if (fillColor) {
      this.setFillColor(fillColor);
    }
    
    if (strokeColor) {
      this.setStrokeColor(strokeColor);
    }

    // Draw polygon
    this.contentOperations.push(`${this.formatNumber(points[0].x)} ${this.formatNumber(points[0].y)} m`);
    for (let i = 1; i < points.length; i++) {
      this.contentOperations.push(`${this.formatNumber(points[i].x)} ${this.formatNumber(points[i].y)} l`);
    }
    this.contentOperations.push('h'); // Close path
    
    if (fillColor && strokeColor) {
      this.contentOperations.push('B');
    } else if (fillColor) {
      this.contentOperations.push('f');
    } else if (strokeColor) {
      this.contentOperations.push('S');
    }

    this.contentOperations.push('Q'); // Restore graphics state
  }

  private setOpacity(opacity: number): void {
    const gsName = `GS${Math.round(opacity * 100)}`;
    this.contentOperations.push(`/${gsName} gs`);
    
    // Add graphics state to resources
    if (!this.resources.ExtGState![gsName]) {
      this.resources.ExtGState![gsName] = {
        Type: 'ExtGState',
        CA: opacity, // Stroke alpha
        ca: opacity  // Fill alpha
      };
    }
  }

  // Font and resource management
  addFont(font: PDFFont): void {
    const fontName = font.getName();
    this.resources.Font![fontName] = font.getObject().id.toRef();
    this.fonts.set(fontName, font);
  }

  private getFont(fontName: string): PDFFont | undefined {
    return this.fonts.get(fontName);
  }

  // Page properties
  getSize(): Size {
    return this.config.size;
  }

  getPageRef(): PDFRef {
    return this.id.toRef();
  }

  // Content stream generation
  async getContentStream(): Promise<any> {
    // Ensure we have a proper content stream
    if (this.contentOperations.length === 0) {
      // Add a minimal content stream if empty
      this.contentOperations.push('q', 'Q');
    }

    const content = this.contentOperations.join('\n') + '\n';
    const data = new TextEncoder().encode(content);
    
    console.log(`Generated content stream with ${this.contentOperations.length} operations`);
    console.log('Content preview:', content.substring(0, 500) + '...');
    
    return {
      dict: {
        Length: data.length
      },
      data
    };
  }

  getObject(): PDFObject {
    const pageDict: PDFDict = {
      Type: 'Page',
      Parent: this.parentRef,
      MediaBox: [0, 0, this.config.size.width, this.config.size.height],
      Resources: this.resources
    };

    if (this.config.rotation) {
      pageDict.Rotate = this.config.rotation;
    }

    return new PDFObject(this.id, pageDict);
  }

  // Color operations
  private setTextColor(color: Color): void {
    if ('r' in color) {
      this.contentOperations.push(`${this.formatNumber(color.r)} ${this.formatNumber(color.g)} ${this.formatNumber(color.b)} rg`);
    } else {
      this.contentOperations.push(`${this.formatNumber(color.c)} ${this.formatNumber(color.m)} ${this.formatNumber(color.y)} ${this.formatNumber(color.k)} k`);
    }
  }

  private setFillColor(color: Color): void {
    if ('r' in color) {
      this.contentOperations.push(`${this.formatNumber(color.r)} ${this.formatNumber(color.g)} ${this.formatNumber(color.b)} rg`);
    } else {
      this.contentOperations.push(`${this.formatNumber(color.c)} ${this.formatNumber(color.m)} ${this.formatNumber(color.y)} ${this.formatNumber(color.k)} k`);
    }
  }

  private setStrokeColor(color: Color): void {
    if ('r' in color) {
      this.contentOperations.push(`${this.formatNumber(color.r)} ${this.formatNumber(color.g)} ${this.formatNumber(color.b)} RG`);
    } else {
      this.contentOperations.push(`${this.formatNumber(color.c)} ${this.formatNumber(color.m)} ${this.formatNumber(color.y)} ${this.formatNumber(color.k)} K`);
    }
  }

  private escapeString(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/\r/g, '\\r')
      .replace(/\n/g, '\\n')
      .replace(/\t/g, '\\t');
  }

  private formatNumber(num: number): string {
    // Format numbers to avoid floating point precision issues
    return Number.isInteger(num) ? num.toString() : num.toFixed(6).replace(/\.?0+$/, '');
  }
}