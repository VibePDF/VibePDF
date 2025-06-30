/**
 * PDF Page Tree - Manages hierarchical page structure
 */

import { PDFDict, PDFArray, PDFRef, Size, PDFError } from '../types/index.js';
import { PDFObject, PDFObjectId } from '../core/PDFObject.js';
import { PDFPage } from './PDFPage.js';

export interface PageTreeNode {
  id: PDFObjectId;
  parent?: PDFRef;
  kids: (PDFPageTreeNode | PDFPage)[];
  count: number;
  isLeaf: boolean;
}

export class PDFPageTreeNode implements PageTreeNode {
  public id: PDFObjectId;
  public parent?: PDFRef;
  public kids: (PDFPageTreeNode | PDFPage)[] = [];
  public count: number = 0;
  public isLeaf: boolean = false;
  private inheritableAttributes: PDFDict = {};

  constructor(id: PDFObjectId, parent?: PDFRef) {
    this.id = id;
    this.parent = parent;
  }

  addChild(child: PDFPageTreeNode | PDFPage): void {
    this.kids.push(child);
    this.updateCount();
    
    // Set parent reference for child
    if (child instanceof PDFPageTreeNode) {
      child.parent = this.id.toRef();
    } else {
      // For PDFPage, we need to update its parent reference
      const pageDict = child.getObject().value as PDFDict;
      pageDict.Parent = this.id.toRef();
    }
  }

  removeChild(child: PDFPageTreeNode | PDFPage): boolean {
    const index = this.kids.indexOf(child);
    if (index !== -1) {
      this.kids.splice(index, 1);
      this.updateCount();
      return true;
    }
    return false;
  }

  insertChild(index: number, child: PDFPageTreeNode | PDFPage): void {
    if (index < 0 || index > this.kids.length) {
      throw new PDFError(`Invalid insertion index: ${index}`);
    }
    
    this.kids.splice(index, 0, child);
    this.updateCount();
    
    // Set parent reference
    if (child instanceof PDFPageTreeNode) {
      child.parent = this.id.toRef();
    } else {
      const pageDict = child.getObject().value as PDFDict;
      pageDict.Parent = this.id.toRef();
    }
  }

  private updateCount(): void {
    this.count = this.kids.reduce((total, kid) => {
      if (kid instanceof PDFPageTreeNode) {
        return total + kid.count;
      } else {
        return total + 1; // PDFPage counts as 1
      }
    }, 0);
    
    // Update parent counts recursively
    if (this.parent) {
      // This would need to be handled by the parent PageTree
    }
  }

  // Inheritable attributes management
  setInheritableAttribute(key: string, value: any): void {
    this.inheritableAttributes[key] = value;
  }

  getInheritableAttribute(key: string): any {
    return this.inheritableAttributes[key];
  }

  getInheritableAttributes(): PDFDict {
    return { ...this.inheritableAttributes };
  }

  // Find operations
  findPage(pageIndex: number): PDFPage | null {
    if (pageIndex < 0 || pageIndex >= this.count) {
      return null;
    }

    let currentIndex = 0;
    for (const kid of this.kids) {
      if (kid instanceof PDFPageTreeNode) {
        if (currentIndex + kid.count > pageIndex) {
          return kid.findPage(pageIndex - currentIndex);
        }
        currentIndex += kid.count;
      } else {
        if (currentIndex === pageIndex) {
          return kid;
        }
        currentIndex++;
      }
    }

    return null;
  }

  findPageIndex(page: PDFPage): number {
    let currentIndex = 0;
    for (const kid of this.kids) {
      if (kid instanceof PDFPageTreeNode) {
        const index = kid.findPageIndex(page);
        if (index !== -1) {
          return currentIndex + index;
        }
        currentIndex += kid.count;
      } else {
        if (kid === page) {
          return currentIndex;
        }
        currentIndex++;
      }
    }
    return -1;
  }

  // Collect all pages in order
  getAllPages(): PDFPage[] {
    const pages: PDFPage[] = [];
    for (const kid of this.kids) {
      if (kid instanceof PDFPageTreeNode) {
        pages.push(...kid.getAllPages());
      } else {
        pages.push(kid);
      }
    }
    return pages;
  }

  // Tree balancing
  shouldSplit(): boolean {
    return this.kids.length > 10; // Arbitrary threshold
  }

  split(): PDFPageTreeNode[] {
    if (this.kids.length <= 1) {
      return [this];
    }

    const mid = Math.floor(this.kids.length / 2);
    const leftKids = this.kids.slice(0, mid);
    const rightKids = this.kids.slice(mid);

    // Create new nodes
    const leftNode = new PDFPageTreeNode(new PDFObjectId(1), this.parent);
    const rightNode = new PDFPageTreeNode(new PDFObjectId(2), this.parent);

    // Move kids
    leftNode.kids = leftKids;
    rightNode.kids = rightKids;

    // Update parent references
    for (const kid of leftKids) {
      if (kid instanceof PDFPageTreeNode) {
        kid.parent = leftNode.id.toRef();
      }
    }
    for (const kid of rightKids) {
      if (kid instanceof PDFPageTreeNode) {
        kid.parent = rightNode.id.toRef();
      }
    }

    // Update counts
    leftNode.updateCount();
    rightNode.updateCount();

    return [leftNode, rightNode];
  }

  // PDF object generation
  toPDFObject(): PDFObject {
    const dict: PDFDict = {
      Type: 'Pages',
      Kids: this.kids.map(kid => {
        if (kid instanceof PDFPageTreeNode) {
          return kid.id.toRef();
        } else {
          return kid.getPageRef();
        }
      }),
      Count: this.count
    };

    if (this.parent) {
      dict.Parent = this.parent;
    }

    // Add inheritable attributes
    Object.assign(dict, this.inheritableAttributes);

    return new PDFObject(this.id, dict);
  }
}

export class PDFPageTree {
  private root: PDFPageTreeNode;
  private allNodes: Map<number, PDFPageTreeNode> = new Map();
  private nextNodeId = 1;

  constructor(rootId?: PDFObjectId) {
    const id = rootId || new PDFObjectId(this.nextNodeId++);
    this.root = new PDFPageTreeNode(id);
    this.allNodes.set(id.objectNumber, this.root);
  }

  getRoot(): PDFPageTreeNode {
    return this.root;
  }

  addPage(page: PDFPage): void {
    this.insertPage(this.getPageCount(), page);
  }

  insertPage(index: number, page: PDFPage): void {
    if (index < 0 || index > this.getPageCount()) {
      throw new PDFError(`Invalid page index: ${index}`);
    }

    // Find the appropriate node to insert into
    const targetNode = this.findInsertionNode(index);
    targetNode.addChild(page);

    // Rebalance if necessary
    this.rebalanceTree();
  }

  removePage(index: number): PDFPage | null {
    const page = this.getPage(index);
    if (!page) return null;

    // Find the parent node
    const parentNode = this.findPageParent(page);
    if (parentNode) {
      parentNode.removeChild(page);
      this.rebalanceTree();
    }

    return page;
  }

  getPage(index: number): PDFPage | null {
    return this.root.findPage(index);
  }

  getPageIndex(page: PDFPage): number {
    return this.root.findPageIndex(page);
  }

  getPageCount(): number {
    return this.root.count;
  }

  getAllPages(): PDFPage[] {
    return this.root.getAllPages();
  }

  // Tree management
  private findInsertionNode(index: number): PDFPageTreeNode {
    // For simplicity, always insert into root
    // In a more sophisticated implementation, this would find the best leaf node
    return this.root;
  }

  private findPageParent(page: PDFPage): PDFPageTreeNode | null {
    return this.findPageParentRecursive(this.root, page);
  }

  private findPageParentRecursive(node: PDFPageTreeNode, page: PDFPage): PDFPageTreeNode | null {
    for (const kid of node.kids) {
      if (kid === page) {
        return node;
      } else if (kid instanceof PDFPageTreeNode) {
        const result = this.findPageParentRecursive(kid, page);
        if (result) return result;
      }
    }
    return null;
  }

  private rebalanceTree(): void {
    // Simple rebalancing: split nodes that are too large
    const nodesToCheck = [this.root];
    
    while (nodesToCheck.length > 0) {
      const node = nodesToCheck.pop()!;
      
      if (node.shouldSplit()) {
        const splitNodes = node.split();
        if (splitNodes.length > 1) {
          // Replace node with split nodes
          // This is a simplified implementation
          // In practice, you'd need to update parent references properly
        }
      }
      
      // Add child nodes to check
      for (const kid of node.kids) {
        if (kid instanceof PDFPageTreeNode) {
          nodesToCheck.push(kid);
        }
      }
    }
  }

  // Inheritable attributes
  setInheritableAttribute(key: string, value: any): void {
    this.root.setInheritableAttribute(key, value);
  }

  getInheritableAttribute(key: string): any {
    return this.root.getInheritableAttribute(key);
  }

  // Common inheritable attributes
  setMediaBox(mediaBox: [number, number, number, number]): void {
    this.setInheritableAttribute('MediaBox', mediaBox);
  }

  setCropBox(cropBox: [number, number, number, number]): void {
    this.setInheritableAttribute('CropBox', cropBox);
  }

  setRotation(rotation: number): void {
    this.setInheritableAttribute('Rotate', rotation);
  }

  setResources(resources: PDFDict): void {
    this.setInheritableAttribute('Resources', resources);
  }

  // PDF object collection
  getAllObjects(): PDFObject[] {
    const objects: PDFObject[] = [];
    
    // Add all page tree nodes
    for (const node of this.allNodes.values()) {
      objects.push(node.toPDFObject());
    }
    
    // Add all pages
    for (const page of this.getAllPages()) {
      objects.push(page.getObject());
    }
    
    return objects;
  }

  // Statistics
  getTreeStatistics(): {
    totalNodes: number;
    totalPages: number;
    maxDepth: number;
    averageFanout: number;
  } {
    const stats = {
      totalNodes: this.allNodes.size,
      totalPages: this.getPageCount(),
      maxDepth: this.calculateMaxDepth(this.root, 0),
      averageFanout: 0
    };

    // Calculate average fanout
    let totalFanout = 0;
    let nodeCount = 0;
    
    for (const node of this.allNodes.values()) {
      if (node.kids.length > 0) {
        totalFanout += node.kids.length;
        nodeCount++;
      }
    }
    
    stats.averageFanout = nodeCount > 0 ? totalFanout / nodeCount : 0;
    
    return stats;
  }

  private calculateMaxDepth(node: PDFPageTreeNode, currentDepth: number): number {
    let maxDepth = currentDepth;
    
    for (const kid of node.kids) {
      if (kid instanceof PDFPageTreeNode) {
        maxDepth = Math.max(maxDepth, this.calculateMaxDepth(kid, currentDepth + 1));
      }
    }
    
    return maxDepth;
  }

  // Optimization
  optimizeTree(): void {
    // Remove empty nodes
    this.removeEmptyNodes();
    
    // Rebalance tree
    this.rebalanceTree();
    
    // Merge small nodes
    this.mergeSmallNodes();
  }

  private removeEmptyNodes(): void {
    const nodesToRemove: PDFPageTreeNode[] = [];
    
    for (const node of this.allNodes.values()) {
      if (node !== this.root && node.kids.length === 0) {
        nodesToRemove.push(node);
      }
    }
    
    for (const node of nodesToRemove) {
      this.allNodes.delete(node.id.objectNumber);
      // Remove from parent (implementation needed)
    }
  }

  private mergeSmallNodes(): void {
    // Implementation for merging nodes with few children
    // This would help optimize the tree structure
  }
}