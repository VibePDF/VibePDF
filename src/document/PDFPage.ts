/**
 * PDFPage - Individual page handling and content generation
 */

import { 
  PageConfig, 
  TextOptions, 
  ImageOptions, 
  DrawOptions,
  Color,
  Point,
  Rectangle,
  PDFDict,
  PDFRef,
  RGBColor,
  Size
} from '../types/index.js';
import { PDFObject, PDFObjectId } from '../core/PDFObject.js';
import { PDFStreamProcessor } from '../core/PDFStream.js';
import { PDFFont } from '../fonts/PDFFont.js';
import { Matrix } from '../utils/MathUtils.js';

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
  private graphicsState = new GraphicsState();
  private transformStack: Matrix[] = [];
  private currentTransform = Matrix.identity();

  constructor(
    private id: PDFObjectId,
    private config: PageConfig,
    private parentRef: PDFRef
  ) {}

  // Text operations
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
    const actualLineHeight = lineHeight || size * 1.2;
    
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

  private wrapText(text: string, maxWidth: number, size: number, font: string): string[] {
    const words = text.split(' ');
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
          // Word is too long, break it
          lines.push(word);
        }
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  private measureText(text: string, size: number, font: string): number {
    // Simplified text measurement - should use actual font metrics
    const avgCharWidth = size * 0.6;
    return text.length * avgCharWidth;
  }

  // Shape drawing operations
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

  // Advanced path operations
  beginPath(): void {
    // Path operations will be accumulated until stroke/fill
  }

  moveTo(point: Point): void {
    this.contentOperations.push(`${point.x} ${point.y} m`);
  }

  lineTo(point: Point): void {
    this.contentOperations.push(`${point.x} ${point.y} l`);
  }

  curveTo(cp1: Point, cp2: Point, end: Point): void {
    this.contentOperations.push(`${cp1.x} ${cp1.y} ${cp2.x} ${cp2.y} ${end.x} ${end.y} c`);
  }

  closePath(): void {
    this.contentOperations.push('h');
  }

  stroke(): void {
    this.contentOperations.push('S');
  }

  fill(): void {
    this.contentOperations.push('f');
  }

  fillAndStroke(): void {
    this.contentOperations.push('B');
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

  transform(matrix: Matrix): void {
    this.applyTransform(matrix);
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

  // Image operations
  drawImage(imageRef: PDFRef, rect: Rectangle, options: ImageOptions = {}): void {
    const { preserveAspectRatio = true } = options;
    
    this.saveGraphicsState();
    
    // Transform to image rectangle
    this.contentOperations.push(`${rect.width} 0 0 ${rect.height} ${rect.x} ${rect.y} cm`);
    
    // Draw image
    this.contentOperations.push(`/Im${imageRef.objectNumber} Do`);
    
    this.restoreGraphicsState();
    
    // Add image to resources
    this.resources.XObject![`Im${imageRef.objectNumber}`] = imageRef;
  }

  // Font and resource management
  addFont(font: PDFFont): void {
    const fontName = font.getName();
    this.resources.Font![fontName] = font.getObject().id.toRef();
  }

  addColorSpace(name: string, colorSpace: any): void {
    this.resources.ColorSpace![name] = colorSpace;
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

  getRotation(): number {
    return this.config.rotation || 0;
  }

  setRotation(rotation: 0 | 90 | 180 | 270): void {
    this.config.rotation = rotation;
  }

  // Content stream generation
  async getContentStream(): Promise<any> {
    return await PDFStreamProcessor.createContentStream(this.contentOperations);
  }

  getObject(): PDFObject {
    const pageDict: PDFDict = {
      Type: 'Page',
      Parent: this.parentRef,
      MediaBox: [0, 0, this.config.size.width, this.config.size.height],
      Resources: this.resources
    };

    // Add content stream reference (would be created during document serialization)
    const contentId = new PDFObjectId(this.id.objectNumber + 1000); // Offset for content streams
    pageDict.Contents = contentId.toRef();

    if (this.config.rotation) {
      pageDict.Rotate = this.config.rotation;
    }

    // Add optional page boxes
    const margins = this.getMargins();
    if (margins.left || margins.right || margins.top || margins.bottom) {
      const cropBox = [
        margins.left || 0,
        margins.bottom || 0,
        this.config.size.width - (margins.right || 0),
        this.config.size.height - (margins.top || 0)
      ];
      pageDict.CropBox = cropBox;
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

// Graphics state tracking
class GraphicsState {
  lineWidth: number = 1;
  lineCap: number = 0;
  lineJoin: number = 0;
  miterLimit: number = 10;
  dashArray: number[] = [];
  dashPhase: number = 0;
  fillColor: Color = { r: 0, g: 0, b: 0 };
  strokeColor: Color = { r: 0, g: 0, b: 0 };
  fillAlpha: number = 1;
  strokeAlpha: number = 1;
  font?: string;
  fontSize: number = 12;
  textMatrix: Matrix = Matrix.identity();
  textLineMatrix: Matrix = Matrix.identity();
}