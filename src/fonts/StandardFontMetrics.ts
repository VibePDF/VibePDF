/**
 * Standard font metrics for built-in PDF fonts
 */

import { FontMetrics, StandardFonts } from '../types/index.js';

export const StandardFontMetrics: Record<string, FontMetrics> = {
  [StandardFonts.Helvetica]: {
    unitsPerEm: 1000,
    ascent: 718,
    descent: -207,
    lineGap: 0,
    capHeight: 718,
    xHeight: 523
  },
  [StandardFonts.HelveticaBold]: {
    unitsPerEm: 1000,
    ascent: 718,
    descent: -207,
    lineGap: 0,
    capHeight: 718,
    xHeight: 532
  },
  [StandardFonts.HelveticaOblique]: {
    unitsPerEm: 1000,
    ascent: 718,
    descent: -207,
    lineGap: 0,
    capHeight: 718,
    xHeight: 523
  },
  [StandardFonts.HelveticaBoldOblique]: {
    unitsPerEm: 1000,
    ascent: 718,
    descent: -207,
    lineGap: 0,
    capHeight: 718,
    xHeight: 532
  },
  [StandardFonts.TimesRoman]: {
    unitsPerEm: 1000,
    ascent: 683,
    descent: -217,
    lineGap: 0,
    capHeight: 662,
    xHeight: 450
  },
  [StandardFonts.TimesBold]: {
    unitsPerEm: 1000,
    ascent: 683,
    descent: -217,
    lineGap: 0,
    capHeight: 676,
    xHeight: 461
  },
  [StandardFonts.TimesItalic]: {
    unitsPerEm: 1000,
    ascent: 683,
    descent: -217,
    lineGap: 0,
    capHeight: 653,
    xHeight: 441
  },
  [StandardFonts.TimesBoldItalic]: {
    unitsPerEm: 1000,
    ascent: 683,
    descent: -217,
    lineGap: 0,
    capHeight: 669,
    xHeight: 462
  },
  [StandardFonts.Courier]: {
    unitsPerEm: 1000,
    ascent: 629,
    descent: -157,
    lineGap: 0,
    capHeight: 562,
    xHeight: 426
  },
  [StandardFonts.CourierBold]: {
    unitsPerEm: 1000,
    ascent: 629,
    descent: -157,
    lineGap: 0,
    capHeight: 562,
    xHeight: 439
  },
  [StandardFonts.CourierOblique]: {
    unitsPerEm: 1000,
    ascent: 629,
    descent: -157,
    lineGap: 0,
    capHeight: 562,
    xHeight: 426
  },
  [StandardFonts.CourierBoldOblique]: {
    unitsPerEm: 1000,
    ascent: 629,
    descent: -157,
    lineGap: 0,
    capHeight: 562,
    xHeight: 439
  },
  [StandardFonts.Symbol]: {
    unitsPerEm: 1000,
    ascent: 1010,
    descent: -293,
    lineGap: 0,
    capHeight: 673,
    xHeight: 457
  },
  [StandardFonts.ZapfDingbats]: {
    unitsPerEm: 1000,
    ascent: 820,
    descent: -180,
    lineGap: 0,
    capHeight: 820,
    xHeight: 500
  }
};