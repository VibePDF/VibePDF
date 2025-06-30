/**
 * PDF Content Stream - Handles page content operations
 */

import { Point, Color, RGBColor, CMYKColor, PDFError } from '../types/index.js';
import { Matrix } from '../utils/MathUtils.js';

export interface GraphicsState {
  ctm: Matrix; // Current transformation matrix
  lineWidth: number;
  lineCap: number;
  lineJoin: number;
  miterLimit: number;
  dashArray: number[];
  dashPhase: number;
  fillColor: Color;
  strokeColor: Color;
  fillAlpha: number;
  strokeAlpha: number;
  font?: string;
  fontSize: number;
  textMatrix: Matrix;
  textLineMatrix: Matrix;
  characterSpacing: number;
  wordSpacing: number;
  horizontalScaling: number;
  leading: number;
  textRise: number;
  renderingMode: number;
}

export class PDFContentStream {
  private operations: string[] = [];
  private graphicsStateStack: GraphicsState[] = [];
  private currentState: GraphicsState;

  constructor() {
    this.currentState = this.createDefaultGraphicsState();
  }

  private createDefaultGraphicsState(): GraphicsState {
    return {
      ctm: Matrix.identity(),
      lineWidth: 1,
      lineCap: 0,
      lineJoin: 0,
      miterLimit: 10,
      dashArray: [],
      dashPhase: 0,
      fillColor: { r: 0, g: 0, b: 0 },
      strokeColor: { r: 0, g: 0, b: 0 },
      fillAlpha: 1,
      strokeAlpha: 1,
      fontSize: 12,
      textMatrix: Matrix.identity(),
      textLineMatrix: Matrix.identity(),
      characterSpacing: 0,
      wordSpacing: 0,
      horizontalScaling: 100,
      leading: 0,
      textRise: 0,
      renderingMode: 0
    };
  }

  // Graphics state operators
  saveGraphicsState(): void {
    this.graphicsStateStack.push({ ...this.currentState });
    this.operations.push('q');
  }

  restoreGraphicsState(): void {
    if (this.graphicsStateStack.length === 0) {
      throw new PDFError('Cannot restore graphics state: stack is empty');
    }
    this.currentState = this.graphicsStateStack.pop()!;
    this.operations.push('Q');
  }

  // Transformation operators
  concatenateMatrix(matrix: Matrix): void {
    this.currentState.ctm = this.currentState.ctm.multiply(matrix);
    this.operations.push(matrix.toString());
  }

  translate(tx: number, ty: number): void {
    this.concatenateMatrix(Matrix.translation(tx, ty));
  }

  scale(sx: number, sy: number): void {
    this.concatenateMatrix(Matrix.scaling(sx, sy));
  }

  rotate(angle: number): void {
    this.concatenateMatrix(Matrix.rotation(angle));
  }

  // Path construction operators
  moveTo(x: number, y: number): void {
    this.operations.push(`${this.formatNumber(x)} ${this.formatNumber(y)} m`);
  }

  lineTo(x: number, y: number): void {
    this.operations.push(`${this.formatNumber(x)} ${this.formatNumber(y)} l`);
  }

  curveTo(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): void {
    this.operations.push(
      `${this.formatNumber(x1)} ${this.formatNumber(y1)} ${this.formatNumber(x2)} ${this.formatNumber(y2)} ${this.formatNumber(x3)} ${this.formatNumber(y3)} c`
    );
  }

  closePath(): void {
    this.operations.push('h');
  }

  rectangle(x: number, y: number, width: number, height: number): void {
    this.operations.push(
      `${this.formatNumber(x)} ${this.formatNumber(y)} ${this.formatNumber(width)} ${this.formatNumber(height)} re`
    );
  }

  // Path painting operators
  stroke(): void {
    this.operations.push('S');
  }

  closeAndStroke(): void {
    this.operations.push('s');
  }

  fill(): void {
    this.operations.push('f');
  }

  fillEvenOdd(): void {
    this.operations.push('f*');
  }

  fillAndStroke(): void {
    this.operations.push('B');
  }

  fillAndStrokeEvenOdd(): void {
    this.operations.push('B*');
  }

  closeFillAndStroke(): void {
    this.operations.push('b');
  }

  endPath(): void {
    this.operations.push('n');
  }

  // Clipping path operators
  clip(): void {
    this.operations.push('W');
  }

  clipEvenOdd(): void {
    this.operations.push('W*');
  }

  // Graphics state operators
  setLineWidth(width: number): void {
    this.currentState.lineWidth = width;
    this.operations.push(`${this.formatNumber(width)} w`);
  }

  setLineCap(cap: number): void {
    this.currentState.lineCap = cap;
    this.operations.push(`${cap} J`);
  }

  setLineJoin(join: number): void {
    this.currentState.lineJoin = join;
    this.operations.push(`${join} j`);
  }

  setMiterLimit(limit: number): void {
    this.currentState.miterLimit = limit;
    this.operations.push(`${this.formatNumber(limit)} M`);
  }

  setDashPattern(array: number[], phase: number = 0): void {
    this.currentState.dashArray = [...array];
    this.currentState.dashPhase = phase;
    const arrayStr = array.map(n => this.formatNumber(n)).join(' ');
    this.operations.push(`[${arrayStr}] ${this.formatNumber(phase)} d`);
  }

  // Color operators
  setStrokeColor(color: Color): void {
    this.currentState.strokeColor = color;
    if ('r' in color) {
      this.operations.push(`${this.formatNumber(color.r)} ${this.formatNumber(color.g)} ${this.formatNumber(color.b)} RG`);
    } else {
      this.operations.push(`${this.formatNumber(color.c)} ${this.formatNumber(color.m)} ${this.formatNumber(color.y)} ${this.formatNumber(color.k)} K`);
    }
  }

  setFillColor(color: Color): void {
    this.currentState.fillColor = color;
    if ('r' in color) {
      this.operations.push(`${this.formatNumber(color.r)} ${this.formatNumber(color.g)} ${this.formatNumber(color.b)} rg`);
    } else {
      this.operations.push(`${this.formatNumber(color.c)} ${this.formatNumber(color.m)} ${this.formatNumber(color.y)} ${this.formatNumber(color.k)} k`);
    }
  }

  setStrokeGray(gray: number): void {
    this.operations.push(`${this.formatNumber(gray)} G`);
  }

  setFillGray(gray: number): void {
    this.operations.push(`${this.formatNumber(gray)} g`);
  }

  // Text operators
  beginText(): void {
    this.operations.push('BT');
    this.currentState.textMatrix = Matrix.identity();
    this.currentState.textLineMatrix = Matrix.identity();
  }

  endText(): void {
    this.operations.push('ET');
  }

  setFont(fontName: string, size: number): void {
    this.currentState.font = fontName;
    this.currentState.fontSize = size;
    this.operations.push(`/${fontName} ${this.formatNumber(size)} Tf`);
  }

  setTextMatrix(matrix: Matrix): void {
    this.currentState.textMatrix = matrix;
    this.currentState.textLineMatrix = matrix;
    this.operations.push(matrix.toString().replace(' cm', ' Tm'));
  }

  moveText(tx: number, ty: number): void {
    const moveMatrix = Matrix.translation(tx, ty);
    this.currentState.textLineMatrix = this.currentState.textLineMatrix.multiply(moveMatrix);
    this.currentState.textMatrix = this.currentState.textLineMatrix;
    this.operations.push(`${this.formatNumber(tx)} ${this.formatNumber(ty)} Td`);
  }

  moveTextAndSetLeading(tx: number, ty: number): void {
    this.currentState.leading = -ty;
    this.moveText(tx, ty);
    // Replace last Td with TD
    this.operations[this.operations.length - 1] = 
      this.operations[this.operations.length - 1].replace(' Td', ' TD');
  }

  nextLine(): void {
    this.moveText(0, -this.currentState.leading);
    // Replace Td with T*
    this.operations[this.operations.length - 1] = 'T*';
  }

  setCharacterSpacing(spacing: number): void {
    this.currentState.characterSpacing = spacing;
    this.operations.push(`${this.formatNumber(spacing)} Tc`);
  }

  setWordSpacing(spacing: number): void {
    this.currentState.wordSpacing = spacing;
    this.operations.push(`${this.formatNumber(spacing)} Tw`);
  }

  setHorizontalScaling(scaling: number): void {
    this.currentState.horizontalScaling = scaling;
    this.operations.push(`${this.formatNumber(scaling)} Tz`);
  }

  setLeading(leading: number): void {
    this.currentState.leading = leading;
    this.operations.push(`${this.formatNumber(leading)} TL`);
  }

  setTextRise(rise: number): void {
    this.currentState.textRise = rise;
    this.operations.push(`${this.formatNumber(rise)} Ts`);
  }

  setTextRenderingMode(mode: number): void {
    this.currentState.renderingMode = mode;
    this.operations.push(`${mode} Tr`);
  }

  showText(text: string): void {
    const escaped = this.escapeString(text);
    this.operations.push(`(${escaped}) Tj`);
  }

  showTextWithPositioning(textArray: (string | number)[]): void {
    const elements = textArray.map(element => {
      if (typeof element === 'string') {
        return `(${this.escapeString(element)})`;
      } else {
        return this.formatNumber(element);
      }
    });
    this.operations.push(`[${elements.join(' ')}] TJ`);
  }

  moveToNextLineAndShowText(text: string): void {
    const escaped = this.escapeString(text);
    this.operations.push(`(${escaped}) '`);
  }

  setWordAndCharacterSpacingAndShowText(wordSpacing: number, charSpacing: number, text: string): void {
    const escaped = this.escapeString(text);
    this.operations.push(`${this.formatNumber(wordSpacing)} ${this.formatNumber(charSpacing)} (${escaped}) "`);
  }

  // XObject operators
  paintXObject(name: string): void {
    this.operations.push(`/${name} Do`);
  }

  // Inline image operators
  beginInlineImage(): void {
    this.operations.push('BI');
  }

  inlineImageData(): void {
    this.operations.push('ID');
  }

  endInlineImage(): void {
    this.operations.push('EI');
  }

  // Shading operators
  paintShading(name: string): void {
    this.operations.push(`/${name} sh`);
  }

  // Marked content operators
  beginMarkedContent(tag: string): void {
    this.operations.push(`/${tag} BMC`);
  }

  beginMarkedContentWithProperties(tag: string, properties: string): void {
    this.operations.push(`/${tag} /${properties} BDC`);
  }

  endMarkedContent(): void {
    this.operations.push('EMC');
  }

  // Compatibility operators
  beginCompatibilitySection(): void {
    this.operations.push('BX');
  }

  endCompatibilitySection(): void {
    this.operations.push('EX');
  }

  // Custom operations
  addRawOperation(operation: string): void {
    this.operations.push(operation);
  }

  // Output
  getOperations(): string[] {
    return [...this.operations];
  }

  toString(): string {
    return this.operations.join('\n');
  }

  toBytes(): Uint8Array {
    return new TextEncoder().encode(this.toString());
  }

  clear(): void {
    this.operations = [];
    this.graphicsStateStack = [];
    this.currentState = this.createDefaultGraphicsState();
  }

  // Helper methods
  private formatNumber(num: number): string {
    if (Number.isInteger(num)) {
      return num.toString();
    }
    return num.toFixed(6).replace(/\.?0+$/, '');
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

  // Advanced drawing helpers
  drawRectangle(x: number, y: number, width: number, height: number, fill?: boolean, stroke?: boolean): void {
    this.rectangle(x, y, width, height);
    
    if (fill && stroke) {
      this.fillAndStroke();
    } else if (fill) {
      this.fill();
    } else if (stroke) {
      this.stroke();
    } else {
      this.endPath();
    }
  }

  drawCircle(centerX: number, centerY: number, radius: number, fill?: boolean, stroke?: boolean): void {
    // Approximate circle with Bézier curves
    const k = 0.5522847498; // Control point factor
    
    this.moveTo(centerX + radius, centerY);
    this.curveTo(
      centerX + radius, centerY + radius * k,
      centerX + radius * k, centerY + radius,
      centerX, centerY + radius
    );
    this.curveTo(
      centerX - radius * k, centerY + radius,
      centerX - radius, centerY + radius * k,
      centerX - radius, centerY
    );
    this.curveTo(
      centerX - radius, centerY - radius * k,
      centerX - radius * k, centerY - radius,
      centerX, centerY - radius
    );
    this.curveTo(
      centerX + radius * k, centerY - radius,
      centerX + radius, centerY - radius * k,
      centerX + radius, centerY
    );
    
    if (fill && stroke) {
      this.fillAndStroke();
    } else if (fill) {
      this.fill();
    } else if (stroke) {
      this.stroke();
    } else {
      this.endPath();
    }
  }

  drawLine(x1: number, y1: number, x2: number, y2: number): void {
    this.moveTo(x1, y1);
    this.lineTo(x2, y2);
    this.stroke();
  }

  drawPolygon(points: Point[], fill?: boolean, stroke?: boolean): void {
    if (points.length < 2) return;
    
    this.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      this.lineTo(points[i].x, points[i].y);
    }
    this.closePath();
    
    if (fill && stroke) {
      this.fillAndStroke();
    } else if (fill) {
      this.fill();
    } else if (stroke) {
      this.stroke();
    } else {
      this.endPath();
    }
  }
}