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
import { PDFStreamProcessor } from '../core/PDFStream.js';
import { PDFFont } from '../fonts/PDFFont.js';
import { Matrix } from '../utils/MathUtils.js';

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
  private transformStack: Matrix[] = [];
  private currentTransform = Matrix.identity();

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

    this.saveGraphicsState();
    
    // Handle text wrapping if maxWidth is specified
    if (maxWidth) {
      this.drawWrappedText(text, x, y, maxWidth, size, font, color, align, lineHeight);
    } else {
      this.drawSingleLineText(text, x, y, size, font, color);
    }
    
    this.restoreGraphicsState();
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
    const actualLineHeight = lineHeight || this.getFont(font)?.getLineHeight(size) || size * 1.2;
    const textHeight = lines.length * actualLineHeight;
    const blockWidth = maxWidth;
    const blockHeight = textHeight + actualPadding.top + actualPadding.bottom;

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
    this.contentOperations.push(`/${font} ${size} Tf`); // Set font and size
    this.contentOperations.push(`${x} ${y} Td`); // Move to position
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
    const fontObj = this.getFont(font);
    const actualLineHeight = lineHeight || fontObj?.getLineHeight(size) || size * 1.2;
    
    this.contentOperations.push('BT');
    this.setTextColor(color);
    this.contentOperations.push(`/${font} ${size} Tf`);
    
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
        this.drawJustifiedLine(line, x, y - (i * actualLineHeight), maxWidth, size, font);
        continue;
      }
      
      const lineY = y - (i * actualLineHeight);
      this.contentOperations.push(`${lineX} ${lineY} Td`);
      this.contentOperations.push(`(${this.escapeString(line)}) Tj`);
      
      if (i < lines.length - 1) {
        this.contentOperations.push(`${-lineX} ${-actualLineHeight} Td`);
      }
    }
    
    this.contentOperations.push('ET');
  }

  private drawJustifiedLine(line: string, x: number, y: number, maxWidth: number, size: number, font: string): void {
    const words = line.trim().split(/\s+/);
    if (words.length <= 1) {
      // Can't justify single word, draw normally
      this.contentOperations.push(`${x} ${y} Td`);
      this.contentOperations.push(`(${this.escapeString(line)}) Tj`);
      return;
    }

    const totalTextWidth = words.reduce((sum, word) => sum + this.measureText(word, size, font), 0);
    const totalSpaceWidth = maxWidth - totalTextWidth;
    const spaceWidth = totalSpaceWidth / (words.length - 1);

    let currentX = x;
    this.contentOperations.push(`${currentX} ${y} Td`);
    
    for (let i = 0; i < words.length; i++) {
      this.contentOperations.push(`(${this.escapeString(words[i])}) Tj`);
      
      if (i < words.length - 1) {
        // Move to next word position
        const wordWidth = this.measureText(words[i], size, font);
        currentX += wordWidth + spaceWidth;
        this.contentOperations.push(`${spaceWidth} 0 Td`);
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

    this.saveGraphicsState();

    if (opacity < 1) {
      this.setOpacity(opacity);
    }

    this.contentOperations.push(`${lineWidth} w`); // Set line width
    
    if (fillColor) {
      this.setFillColor(fillColor);
    }
    
    if (strokeColor) {
      this.setStrokeColor(strokeColor);
    }

    // Draw rectangle
    this.contentOperations.push(`${x} ${y} ${width} ${height} re`);
    
    if (fillColor && strokeColor) {
      this.contentOperations.push('B'); // Fill and stroke
    } else if (fillColor) {
      this.contentOperations.push('f'); // Fill only
    } else if (strokeColor) {
      this.contentOperations.push('S'); // Stroke only
    }

    this.restoreGraphicsState();
  }

  drawRoundedRectangle(rect: Rectangle, radius: number, options: DrawOptions = {}): void {
    const { x, y, width, height } = rect;
    const r = Math.min(radius, width / 2, height / 2);

    this.saveGraphicsState();

    const {
      lineWidth = 1,
      strokeColor,
      fillColor,
      opacity = 1
    } = options;

    if (opacity < 1) {
      this.setOpacity(opacity);
    }

    this.contentOperations.push(`${lineWidth} w`);
    
    if (fillColor) {
      this.setFillColor(fillColor);
    }
    
    if (strokeColor) {
      this.setStrokeColor(strokeColor);
    }

    // Draw rounded rectangle using curves
    this.contentOperations.push(`${x + r} ${y} m`); // Move to start
    this.contentOperations.push(`${x + width - r} ${y} l`); // Bottom line
    this.contentOperations.push(`${x + width} ${y} ${x + width} ${y + r} v`); // Bottom-right curve
    this.contentOperations.push(`${x + width} ${y + height - r} l`); // Right line
    this.contentOperations.push(`${x + width} ${y + height} ${x + width - r} ${y + height} v`); // Top-right curve
    this.contentOperations.push(`${x + r} ${y + height} l`); // Top line
    this.contentOperations.push(`${x} ${y + height} ${x} ${y + height - r} v`); // Top-left curve
    this.contentOperations.push(`${x} ${y + r} l`); // Left line
    this.contentOperations.push(`${x} ${y} ${x + r} ${y} v`); // Bottom-left curve
    this.contentOperations.push('h'); // Close path

    if (fillColor && strokeColor) {
      this.contentOperations.push('B');
    } else if (fillColor) {
      this.contentOperations.push('f');
    } else if (strokeColor) {
      this.contentOperations.push('S');
    }

    this.restoreGraphicsState();
  }

  drawLine(from: Point, to: Point, options: DrawOptions = {}): void {
    const {
      lineWidth = 1,
      strokeColor = { r: 0, g: 0, b: 0 },
      lineCap = 'butt',
      opacity = 1
    } = options;

    this.saveGraphicsState();

    if (opacity < 1) {
      this.setOpacity(opacity);
    }

    this.contentOperations.push(`${lineWidth} w`); // Set line width
    this.setStrokeColor(strokeColor);
    
    // Set line cap style
    const capStyle = lineCap === 'butt' ? 0 : lineCap === 'round' ? 1 : 2;
    this.contentOperations.push(`${capStyle} J`);

    // Draw line
    this.contentOperations.push(`${from.x} ${from.y} m`); // Move to start
    this.contentOperations.push(`${to.x} ${to.y} l`); // Line to end
    this.contentOperations.push('S'); // Stroke

    this.restoreGraphicsState();
  }

  drawCircle(center: Point, radius: number, options: DrawOptions = {}): void {
    const {
      lineWidth = 1,
      strokeColor,
      fillColor,
      opacity = 1
    } = options;

    this.saveGraphicsState();

    if (opacity < 1) {
      this.setOpacity(opacity);
    }

    this.contentOperations.push(`${lineWidth} w`);
    
    if (fillColor) {
      this.setFillColor(fillColor);
    }
    
    if (strokeColor) {
      this.setStrokeColor(strokeColor);
    }

    // Approximate circle with Bézier curves
    const k = 0.5522847498; // Control point factor for circle approximation
    const { x, y } = center;
    
    this.contentOperations.push(`${x + radius} ${y} m`); // Move to right point
    this.contentOperations.push(`${x + radius} ${y + radius * k} ${x + radius * k} ${y + radius} ${x} ${y + radius} c`);
    this.contentOperations.push(`${x - radius * k} ${y + radius} ${x - radius} ${y + radius * k} ${x - radius} ${y} c`);
    this.contentOperations.push(`${x - radius} ${y - radius * k} ${x - radius * k} ${y - radius} ${x} ${y - radius} c`);
    this.contentOperations.push(`${x + radius * k} ${y - radius} ${x + radius} ${y - radius * k} ${x + radius} ${y} c`);
    
    if (fillColor && strokeColor) {
      this.contentOperations.push('B');
    } else if (fillColor) {
      this.contentOperations.push('f');
    } else if (strokeColor) {
      this.contentOperations.push('S');
    }

    this.restoreGraphicsState();
  }

  drawEllipse(center: Point, radiusX: number, radiusY: number, options: DrawOptions = {}): void {
    this.saveGraphicsState();
    
    // Scale to create ellipse from circle
    this.scale(radiusX / radiusY, 1);
    this.drawCircle({ x: center.x * radiusY / radiusX, y: center.y }, radiusY, options);
    
    this.restoreGraphicsState();
  }

  drawPolygon(points: Point[], options: DrawOptions = {}): void {
    if (points.length < 3) return;

    this.saveGraphicsState();

    const {
      lineWidth = 1,
      strokeColor,
      fillColor,
      opacity = 1
    } = options;

    if (opacity < 1) {
      this.setOpacity(opacity);
    }

    this.contentOperations.push(`${lineWidth} w`);
    
    if (fillColor) {
      this.setFillColor(fillColor);
    }
    
    if (strokeColor) {
      this.setStrokeColor(strokeColor);
    }

    // Draw polygon
    this.contentOperations.push(`${points[0].x} ${points[0].y} m`);
    for (let i = 1; i < points.length; i++) {
      this.contentOperations.push(`${points[i].x} ${points[i].y} l`);
    }
    this.contentOperations.push('h'); // Close path
    
    if (fillColor && strokeColor) {
      this.contentOperations.push('B');
    } else if (fillColor) {
      this.contentOperations.push('f');
    } else if (strokeColor) {
      this.contentOperations.push('S');
    }

    this.restoreGraphicsState();
  }

  // Transformation operations
  translate(x: number, y: number): void {
    const transform = Matrix.translation(x, y);
    this.applyTransform(transform);
  }

  scale(sx: number, sy: number): void {
    const transform = Matrix.scaling(sx, sy);
    this.applyTransform(transform);
  }

  rotate(angle: number): void {
    const transform = Matrix.rotation(angle);
    this.applyTransform(transform);
  }

  private applyTransform(matrix: Matrix): void {
    this.currentTransform = this.currentTransform.multiply(matrix);
    this.contentOperations.push(matrix.toString());
  }

  // Graphics state management
  saveGraphicsState(): void {
    this.contentOperations.push('q');
    this.transformStack.push(this.currentTransform);
  }

  restoreGraphicsState(): void {
    this.contentOperations.push('Q');
    if (this.transformStack.length > 0) {
      this.currentTransform = this.transformStack.pop()!;
    }
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

  getMargins() {
    return this.config.margins || { top: 0, right: 0, bottom: 0, left: 0 };
  }

  getContentArea(): Rectangle {
    const { width, height } = this.config.size;
    const margins = this.getMargins();
    
    return {
      x: margins.left || 0,
      y: margins.bottom || 0,
      width: width - (margins.left || 0) - (margins.right || 0),
      height: height - (margins.top || 0) - (margins.bottom || 0)
    };
  }

  // Content stream generation
  async getContentStream(): Promise<any> {
    const content = this.contentOperations.join('\n');
    const data = new TextEncoder().encode(content);
    
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
      this.contentOperations.push(`${color.r} ${color.g} ${color.b} rg`);
    } else {
      this.contentOperations.push(`${color.c} ${color.m} ${color.y} ${color.k} k`);
    }
  }

  private setFillColor(color: Color): void {
    if ('r' in color) {
      this.contentOperations.push(`${color.r} ${color.g} ${color.b} rg`);
    } else {
      this.contentOperations.push(`${color.c} ${color.m} ${color.y} ${color.k} k`);
    }
  }

  private setStrokeColor(color: Color): void {
    if ('r' in color) {
      this.contentOperations.push(`${color.r} ${color.g} ${color.b} RG`);
    } else {
      this.contentOperations.push(`${color.c} ${color.m} ${color.y} ${color.k} K`);
    }
  }

  private escapeString(text: string): string {
    return text.replace(/[()\\]/g, '\\$&');
  }
}