/**
 * PDF Optimization - File size reduction and performance enhancement
 */

import { 
  PDFDict, 
  PDFStream, 
  CompressionType,
  PDFError 
} from '../types/index.js';
import { PDFStreamProcessor } from '../core/PDFStream.js';

export interface OptimizationOptions {
  compressImages?: boolean;
  imageQuality?: number; // 0-100
  compressStreams?: boolean;
  removeUnusedObjects?: boolean;
  optimizeFonts?: boolean;
  linearize?: boolean;
  removeMetadata?: boolean;
  flattenTransparency?: boolean;
  downsampleImages?: boolean;
  maxImageResolution?: number;
}

export interface OptimizationResult {
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  optimizations: OptimizationStep[];
  warnings: string[];
}

export interface OptimizationStep {
  type: string;
  description: string;
  sizeBefore: number;
  sizeAfter: number;
  savings: number;
}

export class PDFOptimizer {
  private options: OptimizationOptions;

  constructor(options: OptimizationOptions = {}) {
    this.options = {
      compressImages: true,
      imageQuality: 85,
      compressStreams: true,
      removeUnusedObjects: true,
      optimizeFonts: true,
      linearize: false,
      removeMetadata: false,
      flattenTransparency: false,
      downsampleImages: false,
      maxImageResolution: 300,
      ...options
    };
  }

  async optimize(documentBytes: Uint8Array): Promise<OptimizationResult> {
    const originalSize = documentBytes.length;
    const optimizations: OptimizationStep[] = [];
    const warnings: string[] = [];

    let currentBytes = documentBytes;

    // Parse document structure
    const document = await this.parseDocument(currentBytes);

    // Apply optimizations
    if (this.options.removeUnusedObjects) {
      const result = await this.removeUnusedObjects(document);
      optimizations.push(result.step);
      currentBytes = result.data;
      warnings.push(...result.warnings);
    }

    if (this.options.compressStreams) {
      const result = await this.compressStreams(document);
      optimizations.push(result.step);
      currentBytes = result.data;
    }

    if (this.options.compressImages) {
      const result = await this.compressImages(document);
      optimizations.push(result.step);
      currentBytes = result.data;
      warnings.push(...result.warnings);
    }

    if (this.options.optimizeFonts) {
      const result = await this.optimizeFonts(document);
      optimizations.push(result.step);
      currentBytes = result.data;
    }

    if (this.options.downsampleImages) {
      const result = await this.downsampleImages(document);
      optimizations.push(result.step);
      currentBytes = result.data;
      warnings.push(...result.warnings);
    }

    if (this.options.flattenTransparency) {
      const result = await this.flattenTransparency(document);
      optimizations.push(result.step);
      currentBytes = result.data;
    }

    if (this.options.removeMetadata) {
      const result = await this.removeMetadata(document);
      optimizations.push(result.step);
      currentBytes = result.data;
      warnings.push('Metadata removed - may affect compliance and accessibility');
    }

    if (this.options.linearize) {
      const result = await this.linearizeDocument(document);
      optimizations.push(result.step);
      currentBytes = result.data;
    }

    // Rebuild document
    currentBytes = await this.rebuildDocument(document);

    const optimizedSize = currentBytes.length;
    const compressionRatio = (originalSize - optimizedSize) / originalSize;

    return {
      originalSize,
      optimizedSize,
      compressionRatio,
      optimizations,
      warnings
    };
  }

  private async parseDocument(data: Uint8Array): Promise<any> {
    // Parse PDF document structure
    // This would use the PDFParser to extract objects, streams, etc.
    return {
      objects: new Map(),
      streams: [],
      images: [],
      fonts: [],
      metadata: {}
    };
  }

  private async removeUnusedObjects(document: any): Promise<{
    step: OptimizationStep;
    data: Uint8Array;
    warnings: string[];
  }> {
    const sizeBefore = this.calculateDocumentSize(document);
    
    // Identify and remove unused objects
    const usedObjects = this.findUsedObjects(document);
    const removedCount = document.objects.size - usedObjects.size;
    
    // Remove unused objects
    for (const [id, obj] of document.objects) {
      if (!usedObjects.has(id)) {
        document.objects.delete(id);
      }
    }

    const sizeAfter = this.calculateDocumentSize(document);
    
    return {
      step: {
        type: 'remove_unused_objects',
        description: `Removed ${removedCount} unused objects`,
        sizeBefore,
        sizeAfter,
        savings: sizeBefore - sizeAfter
      },
      data: await this.serializeDocument(document),
      warnings: removedCount > 0 ? [`Removed ${removedCount} unused objects`] : []
    };
  }

  private async compressStreams(document: any): Promise<{
    step: OptimizationStep;
    data: Uint8Array;
  }> {
    const sizeBefore = this.calculateDocumentSize(document);
    let compressedCount = 0;

    // Compress all uncompressed streams
    for (const stream of document.streams) {
      if (!this.isStreamCompressed(stream)) {
        await this.compressStream(stream);
        compressedCount++;
      }
    }

    const sizeAfter = this.calculateDocumentSize(document);

    return {
      step: {
        type: 'compress_streams',
        description: `Compressed ${compressedCount} streams`,
        sizeBefore,
        sizeAfter,
        savings: sizeBefore - sizeAfter
      },
      data: await this.serializeDocument(document)
    };
  }

  private async compressImages(document: any): Promise<{
    step: OptimizationStep;
    data: Uint8Array;
    warnings: string[];
  }> {
    const sizeBefore = this.calculateDocumentSize(document);
    const warnings: string[] = [];
    let compressedCount = 0;

    for (const image of document.images) {
      const originalSize = image.data.length;
      
      try {
        const compressedData = await this.compressImageData(
          image.data, 
          image.format, 
          this.options.imageQuality!
        );
        
        if (compressedData.length < originalSize) {
          image.data = compressedData;
          compressedCount++;
        }
      } catch (error) {
        warnings.push(`Failed to compress image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    const sizeAfter = this.calculateDocumentSize(document);

    return {
      step: {
        type: 'compress_images',
        description: `Compressed ${compressedCount} images`,
        sizeBefore,
        sizeAfter,
        savings: sizeBefore - sizeAfter
      },
      data: await this.serializeDocument(document),
      warnings
    };
  }

  private async optimizeFonts(document: any): Promise<{
    step: OptimizationStep;
    data: Uint8Array;
  }> {
    const sizeBefore = this.calculateDocumentSize(document);
    let optimizedCount = 0;

    for (const font of document.fonts) {
      if (font.canSubset()) {
        await this.subsetFont(font, document);
        optimizedCount++;
      }
    }

    const sizeAfter = this.calculateDocumentSize(document);

    return {
      step: {
        type: 'optimize_fonts',
        description: `Optimized ${optimizedCount} fonts`,
        sizeBefore,
        sizeAfter,
        savings: sizeBefore - sizeAfter
      },
      data: await this.serializeDocument(document)
    };
  }

  private async downsampleImages(document: any): Promise<{
    step: OptimizationStep;
    data: Uint8Array;
    warnings: string[];
  }> {
    const sizeBefore = this.calculateDocumentSize(document);
    const warnings: string[] = [];
    let downsampledCount = 0;

    for (const image of document.images) {
      if (image.resolution > this.options.maxImageResolution!) {
        try {
          const downsampledData = await this.downsampleImage(
            image.data,
            image.resolution,
            this.options.maxImageResolution!
          );
          
          image.data = downsampledData;
          image.resolution = this.options.maxImageResolution!;
          downsampledCount++;
        } catch (error) {
          warnings.push(`Failed to downsample image: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    const sizeAfter = this.calculateDocumentSize(document);

    return {
      step: {
        type: 'downsample_images',
        description: `Downsampled ${downsampledCount} images`,
        sizeBefore,
        sizeAfter,
        savings: sizeBefore - sizeAfter
      },
      data: await this.serializeDocument(document),
      warnings
    };
  }

  private async flattenTransparency(document: any): Promise<{
    step: OptimizationStep;
    data: Uint8Array;
  }> {
    const sizeBefore = this.calculateDocumentSize(document);
    
    // Flatten transparency groups and blend modes
    let flattenedCount = 0;
    
    for (const page of document.pages || []) {
      if (page.hasTransparency()) {
        await this.flattenPageTransparency(page);
        flattenedCount++;
      }
    }

    const sizeAfter = this.calculateDocumentSize(document);

    return {
      step: {
        type: 'flatten_transparency',
        description: `Flattened transparency on ${flattenedCount} pages`,
        sizeBefore,
        sizeAfter,
        savings: sizeBefore - sizeAfter
      },
      data: await this.serializeDocument(document)
    };
  }

  private async removeMetadata(document: any): Promise<{
    step: OptimizationStep;
    data: Uint8Array;
  }> {
    const sizeBefore = this.calculateDocumentSize(document);
    
    // Remove metadata objects
    document.metadata = {};
    
    // Remove XMP metadata streams
    document.streams = document.streams.filter((stream: any) => 
      stream.dict.Type !== 'Metadata'
    );

    const sizeAfter = this.calculateDocumentSize(document);

    return {
      step: {
        type: 'remove_metadata',
        description: 'Removed document metadata',
        sizeBefore,
        sizeAfter,
        savings: sizeBefore - sizeAfter
      },
      data: await this.serializeDocument(document)
    };
  }

  private async linearizeDocument(document: any): Promise<{
    step: OptimizationStep;
    data: Uint8Array;
  }> {
    const sizeBefore = this.calculateDocumentSize(document);
    
    // Linearize document for fast web view
    await this.reorderObjectsForLinearization(document);
    
    const sizeAfter = this.calculateDocumentSize(document);

    return {
      step: {
        type: 'linearize',
        description: 'Linearized document for fast web view',
        sizeBefore,
        sizeAfter,
        savings: sizeBefore - sizeAfter
      },
      data: await this.serializeDocument(document)
    };
  }

  // Helper methods
  private findUsedObjects(document: any): Set<string> {
    const used = new Set<string>();
    
    // Start from catalog and traverse all references
    this.traverseReferences(document.catalog, document, used);
    
    return used;
  }

  private traverseReferences(obj: any, document: any, used: Set<string>): void {
    if (!obj) return;
    
    if (typeof obj === 'object' && 'objectNumber' in obj) {
      const id = `${obj.objectNumber}_${obj.generationNumber}`;
      if (!used.has(id)) {
        used.add(id);
        const referencedObj = document.objects.get(id);
        if (referencedObj) {
          this.traverseReferences(referencedObj.value, document, used);
        }
      }
    } else if (Array.isArray(obj)) {
      for (const item of obj) {
        this.traverseReferences(item, document, used);
      }
    } else if (typeof obj === 'object') {
      for (const value of Object.values(obj)) {
        this.traverseReferences(value, document, used);
      }
    }
  }

  private isStreamCompressed(stream: any): boolean {
    return stream.dict.Filter !== undefined;
  }

  private async compressStream(stream: any): Promise<void> {
    const compressedStream = await PDFStreamProcessor.createCompressedStream(
      stream.data,
      CompressionType.FlateDecode,
      stream.dict
    );
    
    stream.data = compressedStream.data;
    stream.dict = compressedStream.dict;
  }

  private async compressImageData(data: Uint8Array, format: string, quality: number): Promise<Uint8Array> {
    // Image compression implementation
    // This would use canvas or WebAssembly for actual image processing
    return data; // Placeholder
  }

  private subsetFont(font: any, document: any): Promise<void> {
    // Font subsetting implementation
    return Promise.resolve();
  }

  private async downsampleImage(data: Uint8Array, currentRes: number, targetRes: number): Promise<Uint8Array> {
    // Image downsampling implementation
    return data; // Placeholder
  }

  private async flattenPageTransparency(page: any): Promise<void> {
    // Transparency flattening implementation
  }

  private async reorderObjectsForLinearization(document: any): Promise<void> {
    // Linearization implementation
  }

  private calculateDocumentSize(document: any): number {
    // Calculate approximate document size
    let size = 0;
    
    for (const obj of document.objects.values()) {
      size += JSON.stringify(obj).length; // Rough estimate
    }
    
    for (const stream of document.streams) {
      size += stream.data.length;
    }
    
    return size;
  }

  private async serializeDocument(document: any): Promise<Uint8Array> {
    // Serialize document back to PDF bytes
    return new Uint8Array(0); // Placeholder
  }

  private async rebuildDocument(document: any): Promise<Uint8Array> {
    // Rebuild the entire document with optimizations applied
    return await this.serializeDocument(document);
  }
}

export class StreamOptimizer {
  static async optimizeContentStream(operations: string[]): Promise<string[]> {
    const optimized: string[] = [];
    
    // Remove redundant operations
    for (let i = 0; i < operations.length; i++) {
      const op = operations[i];
      
      // Skip redundant graphics state changes
      if (i > 0 && op === operations[i - 1] && this.isGraphicsStateOp(op)) {
        continue;
      }
      
      optimized.push(op);
    }
    
    return optimized;
  }

  private static isGraphicsStateOp(op: string): boolean {
    return op.endsWith(' w') || // line width
           op.endsWith(' J') || // line cap
           op.endsWith(' j') || // line join
           op.endsWith(' M') || // miter limit
           op.endsWith(' d') || // dash pattern
           op.endsWith(' ri') || // rendering intent
           op.endsWith(' i') || // flatness
           op.endsWith(' gs'); // graphics state
  }
}