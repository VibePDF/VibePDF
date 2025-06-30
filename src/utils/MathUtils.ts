/**
 * Mathematical utilities for PDF processing
 */

export class Matrix {
  constructor(
    public a: number = 1,
    public b: number = 0,
    public c: number = 0,
    public d: number = 1,
    public e: number = 0,
    public f: number = 0
  ) {}

  static identity(): Matrix {
    return new Matrix();
  }

  static translation(tx: number, ty: number): Matrix {
    return new Matrix(1, 0, 0, 1, tx, ty);
  }

  static scaling(sx: number, sy: number): Matrix {
    return new Matrix(sx, 0, 0, sy, 0, 0);
  }

  static rotation(angle: number): Matrix {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Matrix(cos, sin, -sin, cos, 0, 0);
  }

  multiply(other: Matrix): Matrix {
    return new Matrix(
      this.a * other.a + this.b * other.c,
      this.a * other.b + this.b * other.d,
      this.c * other.a + this.d * other.c,
      this.c * other.b + this.d * other.d,
      this.e * other.a + this.f * other.c + other.e,
      this.e * other.b + this.f * other.d + other.f
    );
  }

  transform(x: number, y: number): { x: number; y: number } {
    return {
      x: this.a * x + this.c * y + this.e,
      y: this.b * x + this.d * y + this.f
    };
  }

  inverse(): Matrix {
    const det = this.a * this.d - this.b * this.c;
    if (Math.abs(det) < 1e-10) {
      throw new Error('Matrix is not invertible');
    }

    return new Matrix(
      this.d / det,
      -this.b / det,
      -this.c / det,
      this.a / det,
      (this.c * this.f - this.d * this.e) / det,
      (this.b * this.e - this.a * this.f) / det
    );
  }

  toArray(): number[] {
    return [this.a, this.b, this.c, this.d, this.e, this.f];
  }

  toString(): string {
    return `${this.a} ${this.b} ${this.c} ${this.d} ${this.e} ${this.f} cm`;
  }
}

export class BezierCurve {
  constructor(
    public p0: { x: number; y: number },
    public p1: { x: number; y: number },
    public p2: { x: number; y: number },
    public p3: { x: number; y: number }
  ) {}

  pointAt(t: number): { x: number; y: number } {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;

    return {
      x: mt3 * this.p0.x + 3 * mt2 * t * this.p1.x + 3 * mt * t2 * this.p2.x + t3 * this.p3.x,
      y: mt3 * this.p0.y + 3 * mt2 * t * this.p1.y + 3 * mt * t2 * this.p2.y + t3 * this.p3.y
    };
  }

  length(): number {
    // Approximate length using Simpson's rule
    const steps = 100;
    let length = 0;
    let prevPoint = this.pointAt(0);

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const point = this.pointAt(t);
      const dx = point.x - prevPoint.x;
      const dy = point.y - prevPoint.y;
      length += Math.sqrt(dx * dx + dy * dy);
      prevPoint = point;
    }

    return length;
  }

  bounds(): { x: number; y: number; width: number; height: number } {
    const points = [this.p0, this.p1, this.p2, this.p3];
    
    let minX = Math.min(...points.map(p => p.x));
    let maxX = Math.max(...points.map(p => p.x));
    let minY = Math.min(...points.map(p => p.y));
    let maxY = Math.max(...points.map(p => p.y));

    // Check extrema
    const extremaT = this.findExtrema();
    for (const t of extremaT) {
      if (t > 0 && t < 1) {
        const point = this.pointAt(t);
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
      }
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  private findExtrema(): number[] {
    const extrema: number[] = [];
    
    // Find extrema for x coordinate
    const ax = 3 * (-this.p0.x + 3 * this.p1.x - 3 * this.p2.x + this.p3.x);
    const bx = 6 * (this.p0.x - 2 * this.p1.x + this.p2.x);
    const cx = 3 * (-this.p0.x + this.p1.x);
    
    const rootsX = this.solveQuadratic(ax, bx, cx);
    extrema.push(...rootsX);
    
    // Find extrema for y coordinate
    const ay = 3 * (-this.p0.y + 3 * this.p1.y - 3 * this.p2.y + this.p3.y);
    const by = 6 * (this.p0.y - 2 * this.p1.y + this.p2.y);
    const cy = 3 * (-this.p0.y + this.p1.y);
    
    const rootsY = this.solveQuadratic(ay, by, cy);
    extrema.push(...rootsY);
    
    return extrema.filter(t => t >= 0 && t <= 1);
  }

  private solveQuadratic(a: number, b: number, c: number): number[] {
    if (Math.abs(a) < 1e-10) {
      // Linear equation
      if (Math.abs(b) < 1e-10) return [];
      return [-c / b];
    }

    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) return [];
    if (discriminant === 0) return [-b / (2 * a)];

    const sqrt = Math.sqrt(discriminant);
    return [
      (-b + sqrt) / (2 * a),
      (-b - sqrt) / (2 * a)
    ];
  }
}

export class GeometryUtils {
  static pointInRectangle(
    point: { x: number; y: number },
    rect: { x: number; y: number; width: number; height: number }
  ): boolean {
    return point.x >= rect.x &&
           point.x <= rect.x + rect.width &&
           point.y >= rect.y &&
           point.y <= rect.y + rect.height;
  }

  static rectanglesIntersect(
    rect1: { x: number; y: number; width: number; height: number },
    rect2: { x: number; y: number; width: number; height: number }
  ): boolean {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }

  static distance(
    p1: { x: number; y: number },
    p2: { x: number; y: number }
  ): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static angle(
    p1: { x: number; y: number },
    p2: { x: number; y: number }
  ): number {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
  }

  static rotatePoint(
    point: { x: number; y: number },
    center: { x: number; y: number },
    angle: number
  ): { x: number; y: number } {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dx = point.x - center.x;
    const dy = point.y - center.y;

    return {
      x: center.x + dx * cos - dy * sin,
      y: center.y + dx * sin + dy * cos
    };
  }

  static scalePoint(
    point: { x: number; y: number },
    center: { x: number; y: number },
    scaleX: number,
    scaleY: number
  ): { x: number; y: number } {
    return {
      x: center.x + (point.x - center.x) * scaleX,
      y: center.y + (point.y - center.y) * scaleY
    };
  }

  static lineIntersection(
    line1Start: { x: number; y: number },
    line1End: { x: number; y: number },
    line2Start: { x: number; y: number },
    line2End: { x: number; y: number }
  ): { x: number; y: number } | null {
    const x1 = line1Start.x, y1 = line1Start.y;
    const x2 = line1End.x, y2 = line1End.y;
    const x3 = line2Start.x, y3 = line2Start.y;
    const x4 = line2End.x, y4 = line2End.y;

    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) < 1e-10) return null; // Lines are parallel

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return {
        x: x1 + t * (x2 - x1),
        y: y1 + t * (y2 - y1)
      };
    }

    return null;
  }
}

export class NumberUtils {
  static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  static lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  static roundToPrecision(value: number, precision: number): number {
    const factor = Math.pow(10, precision);
    return Math.round(value * factor) / factor;
  }

  static degreesToRadians(degrees: number): number {
    return degrees * Math.PI / 180;
  }

  static radiansToDegrees(radians: number): number {
    return radians * 180 / Math.PI;
  }

  static isEqual(a: number, b: number, epsilon: number = 1e-10): boolean {
    return Math.abs(a - b) < epsilon;
  }

  static formatNumber(value: number, precision: number = 2): string {
    return value.toFixed(precision).replace(/\.?0+$/, '');
  }
}