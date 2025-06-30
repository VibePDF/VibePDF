/**
 * Color utility functions
 */

import { RGBColor, CMYKColor, Color } from '../types/index.js';

export class ColorUtils {
  
  static rgb(r: number, g: number, b: number): RGBColor {
    return {
      r: Math.max(0, Math.min(1, r)),
      g: Math.max(0, Math.min(1, g)),
      b: Math.max(0, Math.min(1, b))
    };
  }

  static cmyk(c: number, m: number, y: number, k: number): CMYKColor {
    return {
      c: Math.max(0, Math.min(1, c)),
      m: Math.max(0, Math.min(1, m)),
      y: Math.max(0, Math.min(1, y)),
      k: Math.max(0, Math.min(1, k))
    };
  }

  static rgbToHex(color: RGBColor): string {
    const toHex = (value: number) => {
      const hex = Math.round(value * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
  }

  static hexToRgb(hex: string): RGBColor {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
      throw new Error(`Invalid hex color: ${hex}`);
    }

    return {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    };
  }

  static rgbToCmyk(color: RGBColor): CMYKColor {
    const k = 1 - Math.max(color.r, color.g, color.b);
    
    if (k === 1) {
      return { c: 0, m: 0, y: 0, k: 1 };
    }

    const c = (1 - color.r - k) / (1 - k);
    const m = (1 - color.g - k) / (1 - k);
    const y = (1 - color.b - k) / (1 - k);

    return { c, m, y, k };
  }

  static cmykToRgb(color: CMYKColor): RGBColor {
    const r = (1 - color.c) * (1 - color.k);
    const g = (1 - color.m) * (1 - color.k);
    const b = (1 - color.y) * (1 - color.k);

    return { r, g, b };
  }

  static isRgb(color: Color): color is RGBColor {
    return 'r' in color;
  }

  static isCmyk(color: Color): color is CMYKColor {
    return 'c' in color;
  }

  // Predefined colors
  static readonly BLACK = ColorUtils.rgb(0, 0, 0);
  static readonly WHITE = ColorUtils.rgb(1, 1, 1);
  static readonly RED = ColorUtils.rgb(1, 0, 0);
  static readonly GREEN = ColorUtils.rgb(0, 1, 0);
  static readonly BLUE = ColorUtils.rgb(0, 0, 1);
  static readonly YELLOW = ColorUtils.rgb(1, 1, 0);
  static readonly CYAN = ColorUtils.rgb(0, 1, 1);
  static readonly MAGENTA = ColorUtils.rgb(1, 0, 1);
  static readonly GRAY_LIGHT = ColorUtils.rgb(0.8, 0.8, 0.8);
  static readonly GRAY = ColorUtils.rgb(0.5, 0.5, 0.5);
  static readonly GRAY_DARK = ColorUtils.rgb(0.2, 0.2, 0.2);
}