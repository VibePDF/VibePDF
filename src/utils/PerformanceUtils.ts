/**
 * Performance monitoring and optimization utilities
 */

import { PerformanceMetrics, PDFError } from '../types/index.js';

export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private timers: Map<string, number> = new Map();
  private memoryBaseline: number = 0;

  constructor() {
    this.memoryBaseline = this.getCurrentMemoryUsage();
  }

  startTimer(operation: string): void {
    this.timers.set(operation, performance.now());
  }

  endTimer(operation: string): number {
    const startTime = this.timers.get(operation);
    if (!startTime) {
      throw new PDFError(`Timer for operation '${operation}' was not started`);
    }
    
    const duration = performance.now() - startTime;
    this.timers.delete(operation);
    return duration;
  }

  recordMetrics(operation: string, metrics: Partial<PerformanceMetrics>): void {
    const existing = this.metrics.get(operation) || this.createEmptyMetrics();
    const updated = { ...existing, ...metrics };
    this.metrics.set(operation, updated);
  }

  getMetrics(operation: string): PerformanceMetrics | undefined {
    return this.metrics.get(operation);
  }

  getAllMetrics(): Map<string, PerformanceMetrics> {
    return new Map(this.metrics);
  }

  clearMetrics(): void {
    this.metrics.clear();
    this.timers.clear();
  }

  getCurrentMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  getMemoryDelta(): number {
    return this.getCurrentMemoryUsage() - this.memoryBaseline;
  }

  private createEmptyMetrics(): PerformanceMetrics {
    return {
      generationTime: 0,
      renderingTime: 0,
      memoryUsage: 0,
      fileSize: 0,
      compressionRatio: 0,
      objectCount: 0,
      pageCount: 0,
      fontCount: 0,
      imageCount: 0
    };
  }

  // Performance analysis methods
  analyzePerformance(operation: string): {
    efficiency: 'excellent' | 'good' | 'fair' | 'poor';
    bottlenecks: string[];
    recommendations: string[];
  } {
    const metrics = this.getMetrics(operation);
    if (!metrics) {
      return {
        efficiency: 'poor',
        bottlenecks: ['No metrics available'],
        recommendations: ['Enable performance monitoring']
      };
    }

    const bottlenecks: string[] = [];
    const recommendations: string[] = [];
    let efficiency: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';

    // Analyze generation time
    if (metrics.generationTime > 5000) {
      bottlenecks.push('Slow PDF generation');
      recommendations.push('Optimize content creation and reduce complexity');
      efficiency = 'poor';
    } else if (metrics.generationTime > 2000) {
      bottlenecks.push('Moderate generation time');
      recommendations.push('Consider optimizing font embedding and image processing');
      efficiency = efficiency === 'excellent' ? 'fair' : efficiency;
    }

    // Analyze memory usage
    if (metrics.memoryUsage > 100 * 1024 * 1024) { // 100MB
      bottlenecks.push('High memory usage');
      recommendations.push('Implement streaming for large documents');
      efficiency = 'poor';
    } else if (metrics.memoryUsage > 50 * 1024 * 1024) { // 50MB
      bottlenecks.push('Moderate memory usage');
      recommendations.push('Consider memory optimization techniques');
      efficiency = efficiency === 'excellent' ? 'good' : efficiency;
    }

    // Analyze file size efficiency
    const avgObjectSize = metrics.fileSize / metrics.objectCount;
    if (avgObjectSize > 10000) {
      bottlenecks.push('Large average object size');
      recommendations.push('Enable compression and optimize object structure');
      efficiency = efficiency === 'excellent' ? 'fair' : efficiency;
    }

    // Analyze compression ratio
    if (metrics.compressionRatio < 0.3) {
      bottlenecks.push('Poor compression ratio');
      recommendations.push('Enable stream compression and optimize content');
      efficiency = efficiency === 'excellent' ? 'fair' : efficiency;
    }

    return { efficiency, bottlenecks, recommendations };
  }

  generateReport(): string {
    const allMetrics = this.getAllMetrics();
    let report = 'VibePDF Performance Report\n';
    report += '========================\n\n';

    for (const [operation, metrics] of allMetrics) {
      report += `Operation: ${operation}\n`;
      report += `Generation Time: ${metrics.generationTime.toFixed(2)}ms\n`;
      report += `Memory Usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB\n`;
      report += `File Size: ${(metrics.fileSize / 1024).toFixed(2)}KB\n`;
      report += `Compression Ratio: ${(metrics.compressionRatio * 100).toFixed(1)}%\n`;
      report += `Objects: ${metrics.objectCount}\n`;
      report += `Pages: ${metrics.pageCount}\n`;
      report += `Fonts: ${metrics.fontCount}\n`;
      report += `Images: ${metrics.imageCount}\n`;

      const analysis = this.analyzePerformance(operation);
      report += `Efficiency: ${analysis.efficiency}\n`;
      
      if (analysis.bottlenecks.length > 0) {
        report += `Bottlenecks: ${analysis.bottlenecks.join(', ')}\n`;
      }
      
      if (analysis.recommendations.length > 0) {
        report += `Recommendations: ${analysis.recommendations.join(', ')}\n`;
      }
      
      report += '\n';
    }

    return report;
  }
}

export class MemoryManager {
  private static instance: MemoryManager;
  private objectPool: Map<string, any[]> = new Map();
  private maxPoolSize = 100;

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  // Object pooling for frequently created objects
  getPooledObject<T>(type: string, factory: () => T): T {
    const pool = this.objectPool.get(type) || [];
    
    if (pool.length > 0) {
      return pool.pop() as T;
    }
    
    return factory();
  }

  returnToPool(type: string, object: any): void {
    const pool = this.objectPool.get(type) || [];
    
    if (pool.length < this.maxPoolSize) {
      // Reset object state if it has a reset method
      if (typeof object.reset === 'function') {
        object.reset();
      }
      pool.push(object);
      this.objectPool.set(type, pool);
    }
  }

  clearPool(type?: string): void {
    if (type) {
      this.objectPool.delete(type);
    } else {
      this.objectPool.clear();
    }
  }

  // Memory pressure detection
  isMemoryPressureHigh(): boolean {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      return usageRatio > 0.8;
    }
    return false;
  }

  // Garbage collection hint (if available)
  suggestGarbageCollection(): void {
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
  }

  // Memory usage monitoring
  getMemoryInfo(): {
    used: number;
    total: number;
    limit: number;
    pressure: 'low' | 'medium' | 'high';
  } {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      
      let pressure: 'low' | 'medium' | 'high' = 'low';
      if (usageRatio > 0.8) pressure = 'high';
      else if (usageRatio > 0.6) pressure = 'medium';
      
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        pressure
      };
    }
    
    return {
      used: 0,
      total: 0,
      limit: 0,
      pressure: 'low'
    };
  }
}

export class OptimizationEngine {
  private static readonly OPTIMIZATION_STRATEGIES = {
    COMPRESS_STREAMS: 'compress_streams',
    OPTIMIZE_IMAGES: 'optimize_images',
    SUBSET_FONTS: 'subset_fonts',
    REMOVE_UNUSED: 'remove_unused',
    LINEARIZE: 'linearize',
    MERGE_OBJECTS: 'merge_objects'
  };

  static async optimizeDocument(document: any, strategies: string[] = []): Promise<{
    originalSize: number;
    optimizedSize: number;
    compressionRatio: number;
    appliedOptimizations: string[];
  }> {
    const originalSize = document.getFileSize?.() || 0;
    const appliedOptimizations: string[] = [];

    // Apply default strategies if none specified
    if (strategies.length === 0) {
      strategies = [
        this.OPTIMIZATION_STRATEGIES.COMPRESS_STREAMS,
        this.OPTIMIZATION_STRATEGIES.OPTIMIZE_IMAGES,
        this.OPTIMIZATION_STRATEGIES.SUBSET_FONTS,
        this.OPTIMIZATION_STRATEGIES.REMOVE_UNUSED
      ];
    }

    for (const strategy of strategies) {
      try {
        switch (strategy) {
          case this.OPTIMIZATION_STRATEGIES.COMPRESS_STREAMS:
            await this.compressStreams(document);
            appliedOptimizations.push('Stream Compression');
            break;
          case this.OPTIMIZATION_STRATEGIES.OPTIMIZE_IMAGES:
            await this.optimizeImages(document);
            appliedOptimizations.push('Image Optimization');
            break;
          case this.OPTIMIZATION_STRATEGIES.SUBSET_FONTS:
            await this.subsetFonts(document);
            appliedOptimizations.push('Font Subsetting');
            break;
          case this.OPTIMIZATION_STRATEGIES.REMOVE_UNUSED:
            await this.removeUnusedObjects(document);
            appliedOptimizations.push('Unused Object Removal');
            break;
          case this.OPTIMIZATION_STRATEGIES.LINEARIZE:
            await this.linearizeDocument(document);
            appliedOptimizations.push('Document Linearization');
            break;
          case this.OPTIMIZATION_STRATEGIES.MERGE_OBJECTS:
            await this.mergeObjects(document);
            appliedOptimizations.push('Object Merging');
            break;
        }
      } catch (error) {
        console.warn(`Optimization strategy '${strategy}' failed:`, error);
      }
    }

    const optimizedSize = document.getFileSize?.() || 0;
    const compressionRatio = originalSize > 0 ? (originalSize - optimizedSize) / originalSize : 0;

    return {
      originalSize,
      optimizedSize,
      compressionRatio,
      appliedOptimizations
    };
  }

  private static async compressStreams(document: any): Promise<void> {
    const streams = document.getStreams?.() || [];
    for (const stream of streams) {
      if (!stream.isCompressed?.()) {
        await stream.compress?.();
      }
    }
  }

  private static async optimizeImages(document: any): Promise<void> {
    const images = document.getImages?.() || [];
    for (const image of images) {
      // Optimize image compression and resolution
      if (image.canOptimize?.()) {
        await image.optimize?.();
      }
    }
  }

  private static async subsetFonts(document: any): Promise<void> {
    const fonts = document.getFonts?.() || [];
    for (const font of fonts) {
      if (font.canSubset?.() && !font.isSubset?.()) {
        await font.subset?.();
      }
    }
  }

  private static async removeUnusedObjects(document: any): Promise<void> {
    const unusedObjects = document.findUnusedObjects?.() || [];
    for (const objectId of unusedObjects) {
      document.removeObject?.(objectId);
    }
  }

  private static async linearizeDocument(document: any): Promise<void> {
    if (document.linearize && !document.isLinearized?.()) {
      await document.linearize();
    }
  }

  private static async mergeObjects(document: any): Promise<void> {
    // Merge similar objects to reduce object count
    if (document.mergeObjects) {
      await document.mergeObjects();
    }
  }

  // Performance recommendations based on document analysis
  static analyzeAndRecommend(document: any): {
    recommendations: string[];
    estimatedSavings: number;
    priority: 'low' | 'medium' | 'high';
  } {
    const recommendations: string[] = [];
    let estimatedSavings = 0;
    let priority: 'low' | 'medium' | 'high' = 'low';

    const fileSize = document.getFileSize?.() || 0;
    const images = document.getImages?.() || [];
    const fonts = document.getFonts?.() || [];
    const streams = document.getStreams?.() || [];

    // Check for uncompressed streams
    const uncompressedStreams = streams.filter((s: any) => !s.isCompressed?.());
    if (uncompressedStreams.length > 0) {
      recommendations.push(`Compress ${uncompressedStreams.length} uncompressed streams`);
      estimatedSavings += fileSize * 0.3; // Estimate 30% savings
      priority = 'high';
    }

    // Check for large images
    const largeImages = images.filter((img: any) => (img.getFileSize?.() || 0) > 1024 * 1024);
    if (largeImages.length > 0) {
      recommendations.push(`Optimize ${largeImages.length} large images`);
      estimatedSavings += largeImages.reduce((sum: number, img: any) => sum + (img.getFileSize?.() || 0), 0) * 0.5;
      priority = priority === 'low' ? 'medium' : priority;
    }

    // Check for non-subset fonts
    const nonSubsetFonts = fonts.filter((font: any) => !font.isSubset?.());
    if (nonSubsetFonts.length > 0) {
      recommendations.push(`Subset ${nonSubsetFonts.length} fonts`);
      estimatedSavings += nonSubsetFonts.reduce((sum: number, font: any) => sum + (font.getFileSize?.() || 0), 0) * 0.7;
      priority = priority === 'low' ? 'medium' : priority;
    }

    // Check for unused objects
    const unusedObjects = document.findUnusedObjects?.() || [];
    if (unusedObjects.length > 0) {
      recommendations.push(`Remove ${unusedObjects.length} unused objects`);
      estimatedSavings += fileSize * 0.1; // Estimate 10% savings
      priority = priority === 'low' ? 'medium' : priority;
    }

    // Check if document should be linearized
    if (!document.isLinearized?.() && document.getPageCount?.() > 10) {
      recommendations.push('Linearize document for faster web viewing');
      priority = priority === 'low' ? 'medium' : priority;
    }

    return {
      recommendations,
      estimatedSavings,
      priority
    };
  }
}

// Utility functions for performance measurement
export function measureAsync<T>(
  operation: () => Promise<T>,
  monitor: PerformanceMonitor,
  operationName: string
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    monitor.startTimer(operationName);
    const memoryBefore = monitor.getCurrentMemoryUsage();
    
    try {
      const result = await operation();
      const duration = monitor.endTimer(operationName);
      const memoryAfter = monitor.getCurrentMemoryUsage();
      
      monitor.recordMetrics(operationName, {
        generationTime: duration,
        memoryUsage: memoryAfter - memoryBefore
      });
      
      resolve(result);
    } catch (error) {
      monitor.endTimer(operationName);
      reject(error);
    }
  });
}

export function measureSync<T>(
  operation: () => T,
  monitor: PerformanceMonitor,
  operationName: string
): T {
  monitor.startTimer(operationName);
  const memoryBefore = monitor.getCurrentMemoryUsage();
  
  try {
    const result = operation();
    const duration = monitor.endTimer(operationName);
    const memoryAfter = monitor.getCurrentMemoryUsage();
    
    monitor.recordMetrics(operationName, {
      generationTime: duration,
      memoryUsage: memoryAfter - memoryBefore
    });
    
    return result;
  } catch (error) {
    monitor.endTimer(operationName);
    throw error;
  }
}

// Performance-aware array and object utilities
export class PerformantArray<T> extends Array<T> {
  private _capacity: number;

  constructor(initialCapacity: number = 10) {
    super();
    this._capacity = initialCapacity;
    this.length = 0;
  }

  push(...items: T[]): number {
    if (this.length + items.length > this._capacity) {
      this._capacity = Math.max(this._capacity * 2, this.length + items.length);
    }
    return super.push(...items);
  }

  // Batch operations for better performance
  pushBatch(items: T[]): void {
    if (items.length === 0) return;
    
    if (this.length + items.length > this._capacity) {
      this._capacity = Math.max(this._capacity * 2, this.length + items.length);
    }
    
    for (let i = 0; i < items.length; i++) {
      this[this.length + i] = items[i];
    }
    this.length += items.length;
  }

  clear(): void {
    this.length = 0;
  }

  getCapacity(): number {
    return this._capacity;
  }
}

export class PerformantMap<K, V> extends Map<K, V> {
  private _maxSize: number;

  constructor(maxSize: number = 1000) {
    super();
    this._maxSize = maxSize;
  }

  set(key: K, value: V): this {
    if (this.size >= this._maxSize && !this.has(key)) {
      // Remove oldest entry (first entry)
      const firstKey = this.keys().next().value;
      this.delete(firstKey);
    }
    return super.set(key, value);
  }

  setMaxSize(maxSize: number): void {
    this._maxSize = maxSize;
    while (this.size > this._maxSize) {
      const firstKey = this.keys().next().value;
      this.delete(firstKey);
    }
  }

  getMaxSize(): number {
    return this._maxSize;
  }
}