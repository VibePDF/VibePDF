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
      font = 'Helvetica'
    } = options;

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

  // Shape drawing operations
  drawRectangle(rect: Rectangle, options: DrawOptions = {}): void {
    const { x, y, width, height } = rect;
    const {
      lineWidth = 1,
      strokeColor,
      fillColor
    } = options;

    this.contentOperations.push('q'); // Save graphics state
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

    this.contentOperations.push('Q'); // Restore graphics state
  }

  drawLine(from: Point, to: Point, options: DrawOptions = {}): void {
    const {
      lineWidth = 1,
      strokeColor = { r: 0, g: 0, b: 0 },
      lineCap = 'butt'
    } = options;

    this.contentOperations.push('q'); // Save graphics state
    this.contentOperations.push(`${lineWidth} w`); // Set line width
    this.setStrokeColor(strokeColor);
    
    // Set line cap style
    const capStyle = lineCap === 'butt' ? 0 : lineCap === 'round' ? 1 : 2;
    this.contentOperations.push(`${capStyle} J`);

    // Draw line
    this.contentOperations.push(`${from.x} ${from.y} m`); // Move to start
    this.contentOperations.push(`${to.x} ${to.y} l`); // Line to end
    this.contentOperations.push('S'); // Stroke

    this.contentOperations.push('Q'); // Restore graphics state
  }

  drawCircle(center: Point, radius: number, options: DrawOptions = {}): void {
    const {
      lineWidth = 1,
      strokeColor,
      fillColor
    } = options;

    this.contentOperations.push('q'); // Save graphics state
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

    this.contentOperations.push('Q'); // Restore graphics state
  }

  // Font and resource management
  addFont(font: PDFFont): void {
    const fontName = font.getName();
    this.resources.Font![fontName] = font.getObject().id.toRef();
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