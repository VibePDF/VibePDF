/**
 * PDF Resources - Manages fonts, images, and other resources
 */

import { PDFDict, PDFRef, PDFError } from '../types/index.js';
import { PDFObject, PDFObjectId } from './PDFObject.js';

export interface ResourceEntry {
  name: string;
  object: PDFObject;
  reference: PDFRef;
}

export class PDFResourceManager {
  private fonts: Map<string, ResourceEntry> = new Map();
  private xObjects: Map<string, ResourceEntry> = new Map();
  private colorSpaces: Map<string, ResourceEntry> = new Map();
  private patterns: Map<string, ResourceEntry> = new Map();
  private shadings: Map<string, ResourceEntry> = new Map();
  private extGStates: Map<string, ResourceEntry> = new Map();
  private properties: Map<string, ResourceEntry> = new Map();
  private nextResourceId = 1;

  // Font management
  addFont(fontObject: PDFObject, customName?: string): string {
    const name = customName || this.generateResourceName('F');
    const entry: ResourceEntry = {
      name,
      object: fontObject,
      reference: fontObject.id.toRef()
    };
    this.fonts.set(name, entry);
    return name;
  }

  getFont(name: string): ResourceEntry | undefined {
    return this.fonts.get(name);
  }

  getAllFonts(): Map<string, ResourceEntry> {
    return new Map(this.fonts);
  }

  // XObject management (images, forms)
  addXObject(xObjectObject: PDFObject, customName?: string): string {
    const name = customName || this.generateResourceName('Im');
    const entry: ResourceEntry = {
      name,
      object: xObjectObject,
      reference: xObjectObject.id.toRef()
    };
    this.xObjects.set(name, entry);
    return name;
  }

  getXObject(name: string): ResourceEntry | undefined {
    return this.xObjects.get(name);
  }

  getAllXObjects(): Map<string, ResourceEntry> {
    return new Map(this.xObjects);
  }

  // Color space management
  addColorSpace(colorSpaceObject: PDFObject, customName?: string): string {
    const name = customName || this.generateResourceName('CS');
    const entry: ResourceEntry = {
      name,
      object: colorSpaceObject,
      reference: colorSpaceObject.id.toRef()
    };
    this.colorSpaces.set(name, entry);
    return name;
  }

  getColorSpace(name: string): ResourceEntry | undefined {
    return this.colorSpaces.get(name);
  }

  // Pattern management
  addPattern(patternObject: PDFObject, customName?: string): string {
    const name = customName || this.generateResourceName('P');
    const entry: ResourceEntry = {
      name,
      object: patternObject,
      reference: patternObject.id.toRef()
    };
    this.patterns.set(name, entry);
    return name;
  }

  getPattern(name: string): ResourceEntry | undefined {
    return this.patterns.get(name);
  }

  // Shading management
  addShading(shadingObject: PDFObject, customName?: string): string {
    const name = customName || this.generateResourceName('Sh');
    const entry: ResourceEntry = {
      name,
      object: shadingObject,
      reference: shadingObject.id.toRef()
    };
    this.shadings.set(name, entry);
    return name;
  }

  getShading(name: string): ResourceEntry | undefined {
    return this.shadings.get(name);
  }

  // Extended graphics state management
  addExtGState(extGStateObject: PDFObject, customName?: string): string {
    const name = customName || this.generateResourceName('GS');
    const entry: ResourceEntry = {
      name,
      object: extGStateObject,
      reference: extGStateObject.id.toRef()
    };
    this.extGStates.set(name, entry);
    return name;
  }

  getExtGState(name: string): ResourceEntry | undefined {
    return this.extGStates.get(name);
  }

  // Properties management (for marked content)
  addProperty(propertyObject: PDFObject, customName?: string): string {
    const name = customName || this.generateResourceName('MC');
    const entry: ResourceEntry = {
      name,
      object: propertyObject,
      reference: propertyObject.id.toRef()
    };
    this.properties.set(name, entry);
    return name;
  }

  getProperty(name: string): ResourceEntry | undefined {
    return this.properties.get(name);
  }

  // Resource dictionary generation
  generateResourceDict(): PDFDict {
    const resources: PDFDict = {};

    // Add fonts
    if (this.fonts.size > 0) {
      const fontDict: PDFDict = {};
      for (const [name, entry] of this.fonts) {
        fontDict[name] = entry.reference;
      }
      resources.Font = fontDict;
    }

    // Add XObjects
    if (this.xObjects.size > 0) {
      const xObjectDict: PDFDict = {};
      for (const [name, entry] of this.xObjects) {
        xObjectDict[name] = entry.reference;
      }
      resources.XObject = xObjectDict;
    }

    // Add color spaces
    if (this.colorSpaces.size > 0) {
      const colorSpaceDict: PDFDict = {};
      for (const [name, entry] of this.colorSpaces) {
        colorSpaceDict[name] = entry.reference;
      }
      resources.ColorSpace = colorSpaceDict;
    }

    // Add patterns
    if (this.patterns.size > 0) {
      const patternDict: PDFDict = {};
      for (const [name, entry] of this.patterns) {
        patternDict[name] = entry.reference;
      }
      resources.Pattern = patternDict;
    }

    // Add shadings
    if (this.shadings.size > 0) {
      const shadingDict: PDFDict = {};
      for (const [name, entry] of this.shadings) {
        shadingDict[name] = entry.reference;
      }
      resources.Shading = shadingDict;
    }

    // Add extended graphics states
    if (this.extGStates.size > 0) {
      const extGStateDict: PDFDict = {};
      for (const [name, entry] of this.extGStates) {
        extGStateDict[name] = entry.reference;
      }
      resources.ExtGState = extGStateDict;
    }

    // Add properties
    if (this.properties.size > 0) {
      const propertiesDict: PDFDict = {};
      for (const [name, entry] of this.properties) {
        propertiesDict[name] = entry.reference;
      }
      resources.Properties = propertiesDict;
    }

    return resources;
  }

  // Get all resource objects
  getAllResourceObjects(): PDFObject[] {
    const objects: PDFObject[] = [];
    
    for (const entry of this.fonts.values()) {
      objects.push(entry.object);
    }
    for (const entry of this.xObjects.values()) {
      objects.push(entry.object);
    }
    for (const entry of this.colorSpaces.values()) {
      objects.push(entry.object);
    }
    for (const entry of this.patterns.values()) {
      objects.push(entry.object);
    }
    for (const entry of this.shadings.values()) {
      objects.push(entry.object);
    }
    for (const entry of this.extGStates.values()) {
      objects.push(entry.object);
    }
    for (const entry of this.properties.values()) {
      objects.push(entry.object);
    }
    
    return objects;
  }

  // Merge resources from another manager
  mergeResources(other: PDFResourceManager): void {
    // Merge fonts
    for (const [name, entry] of other.fonts) {
      if (!this.fonts.has(name)) {
        this.fonts.set(name, entry);
      }
    }

    // Merge XObjects
    for (const [name, entry] of other.xObjects) {
      if (!this.xObjects.has(name)) {
        this.xObjects.set(name, entry);
      }
    }

    // Merge other resource types similarly
    for (const [name, entry] of other.colorSpaces) {
      if (!this.colorSpaces.has(name)) {
        this.colorSpaces.set(name, entry);
      }
    }

    for (const [name, entry] of other.patterns) {
      if (!this.patterns.has(name)) {
        this.patterns.set(name, entry);
      }
    }

    for (const [name, entry] of other.shadings) {
      if (!this.shadings.has(name)) {
        this.shadings.set(name, entry);
      }
    }

    for (const [name, entry] of other.extGStates) {
      if (!this.extGStates.has(name)) {
        this.extGStates.set(name, entry);
      }
    }

    for (const [name, entry] of other.properties) {
      if (!this.properties.has(name)) {
        this.properties.set(name, entry);
      }
    }
  }

  // Resource optimization
  removeUnusedResources(usedResourceNames: Set<string>): void {
    // Remove unused fonts
    for (const [name] of this.fonts) {
      if (!usedResourceNames.has(name)) {
        this.fonts.delete(name);
      }
    }

    // Remove unused XObjects
    for (const [name] of this.xObjects) {
      if (!usedResourceNames.has(name)) {
        this.xObjects.delete(name);
      }
    }

    // Remove other unused resources similarly
    for (const [name] of this.colorSpaces) {
      if (!usedResourceNames.has(name)) {
        this.colorSpaces.delete(name);
      }
    }

    for (const [name] of this.patterns) {
      if (!usedResourceNames.has(name)) {
        this.patterns.delete(name);
      }
    }

    for (const [name] of this.shadings) {
      if (!usedResourceNames.has(name)) {
        this.shadings.delete(name);
      }
    }

    for (const [name] of this.extGStates) {
      if (!usedResourceNames.has(name)) {
        this.extGStates.delete(name);
      }
    }

    for (const [name] of this.properties) {
      if (!usedResourceNames.has(name)) {
        this.properties.delete(name);
      }
    }
  }

  // Clear all resources
  clear(): void {
    this.fonts.clear();
    this.xObjects.clear();
    this.colorSpaces.clear();
    this.patterns.clear();
    this.shadings.clear();
    this.extGStates.clear();
    this.properties.clear();
    this.nextResourceId = 1;
  }

  // Statistics
  getResourceCount(): {
    fonts: number;
    xObjects: number;
    colorSpaces: number;
    patterns: number;
    shadings: number;
    extGStates: number;
    properties: number;
    total: number;
  } {
    return {
      fonts: this.fonts.size,
      xObjects: this.xObjects.size,
      colorSpaces: this.colorSpaces.size,
      patterns: this.patterns.size,
      shadings: this.shadings.size,
      extGStates: this.extGStates.size,
      properties: this.properties.size,
      total: this.fonts.size + this.xObjects.size + this.colorSpaces.size + 
             this.patterns.size + this.shadings.size + this.extGStates.size + 
             this.properties.size
    };
  }

  private generateResourceName(prefix: string): string {
    return `${prefix}${this.nextResourceId++}`;
  }
}

// Extended Graphics State helper
export class ExtendedGraphicsState {
  static createOpacityState(fillOpacity?: number, strokeOpacity?: number): PDFDict {
    const state: PDFDict = {
      Type: 'ExtGState'
    };

    if (fillOpacity !== undefined) {
      state.ca = fillOpacity; // Non-stroking alpha
    }

    if (strokeOpacity !== undefined) {
      state.CA = strokeOpacity; // Stroking alpha
    }

    return state;
  }

  static createBlendModeState(blendMode: string): PDFDict {
    return {
      Type: 'ExtGState',
      BM: blendMode
    };
  }

  static createLineCapState(lineCap: number): PDFDict {
    return {
      Type: 'ExtGState',
      LC: lineCap
    };
  }

  static createLineJoinState(lineJoin: number): PDFDict {
    return {
      Type: 'ExtGState',
      LJ: lineJoin
    };
  }

  static createLineWidthState(lineWidth: number): PDFDict {
    return {
      Type: 'ExtGState',
      LW: lineWidth
    };
  }

  static createMiterLimitState(miterLimit: number): PDFDict {
    return {
      Type: 'ExtGState',
      ML: miterLimit
    };
  }

  static createDashPatternState(dashArray: number[], dashPhase: number): PDFDict {
    return {
      Type: 'ExtGState',
      D: [dashArray, dashPhase]
    };
  }

  static createRenderingIntentState(intent: string): PDFDict {
    return {
      Type: 'ExtGState',
      RI: intent
    };
  }

  static createOverprintState(overprintFill?: boolean, overprintStroke?: boolean): PDFDict {
    const state: PDFDict = {
      Type: 'ExtGState'
    };

    if (overprintFill !== undefined) {
      state.op = overprintFill;
    }

    if (overprintStroke !== undefined) {
      state.OP = overprintStroke;
    }

    return state;
  }

  static createFlatnessState(flatness: number): PDFDict {
    return {
      Type: 'ExtGState',
      FL: flatness
    };
  }

  static createSmoothingState(smoothness: number): PDFDict {
    return {
      Type: 'ExtGState',
      SM: smoothness
    };
  }

  static createStrokeAdjustmentState(strokeAdjustment: boolean): PDFDict {
    return {
      Type: 'ExtGState',
      SA: strokeAdjustment
    };
  }

  static createTextKnockoutState(textKnockout: boolean): PDFDict {
    return {
      Type: 'ExtGState',
      TK: textKnockout
    };
  }
}