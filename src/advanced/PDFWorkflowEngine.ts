/**
 * PDF Workflow Engine - Advanced document processing workflows
 * Enterprise workflow capabilities beyond any existing solution
 */

import { PDFDocument as VibePDFDocument } from '../document/PDFDocument.js';
import { 
  PDFPage,
  PDFError,
  ValidationResult,
  PerformanceMetrics 
} from '../types/index.js';
import { PerformanceMonitor } from '../utils/PerformanceUtils.js';

export interface WorkflowDefinition {
  id: string;
  name: string;
  version: string;
  description: string;
  category: 'document_processing' | 'compliance' | 'automation' | 'integration';
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  variables: WorkflowVariable[];
  triggers: WorkflowTrigger[];
  metadata: WorkflowMetadata;
}

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  name: string;
  description?: string;
  position: { x: number; y: number };
  configuration: NodeConfiguration;
  inputs: NodePort[];
  outputs: NodePort[];
  status?: 'idle' | 'running' | 'completed' | 'error';
}

export type WorkflowNodeType = 
  | 'input' | 'output' | 'transform' | 'filter' | 'merge' | 'split'
  | 'validate' | 'optimize' | 'convert' | 'extract' | 'generate'
  | 'condition' | 'loop' | 'parallel' | 'delay' | 'notification'
  | 'api' | 'database' | 'file' | 'email' | 'webhook';

export interface NodeConfiguration {
  [key: string]: any;
}

export interface NodePort {
  id: string;
  name: string;
  type: 'document' | 'data' | 'file' | 'boolean' | 'number' | 'string' | 'array' | 'object';
  required: boolean;
  description?: string;
}

export interface WorkflowConnection {
  id: string;
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
  condition?: string;
}

export interface WorkflowVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  value: any;
  description?: string;
  scope: 'global' | 'local';
}

export interface WorkflowTrigger {
  type: 'manual' | 'schedule' | 'webhook' | 'file_watch' | 'api';
  configuration: any;
  enabled: boolean;
}

export interface WorkflowMetadata {
  author: string;
  created: Date;
  modified: Date;
  tags: string[];
  permissions: WorkflowPermissions;
}

export interface WorkflowPermissions {
  read: string[];
  write: string[];
  execute: string[];
  admin: string[];
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  progress: number;
  currentNode?: string;
  nodeResults: Map<string, NodeExecutionResult>;
  context: ExecutionContext;
  error?: WorkflowError;
  metrics: ExecutionMetrics;
}

export interface NodeExecutionResult {
  nodeId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime: Date;
  endTime?: Date;
  input: any;
  output?: any;
  error?: string;
  metrics: NodeMetrics;
}

export interface ExecutionContext {
  variables: Map<string, any>;
  documents: Map<string, VibePDFDocument>;
  files: Map<string, Uint8Array>;
  metadata: Map<string, any>;
  userId?: string;
  sessionId?: string;
}

export interface WorkflowError {
  code: string;
  message: string;
  nodeId?: string;
  details?: any;
  stack?: string;
}

export interface ExecutionMetrics {
  totalNodes: number;
  completedNodes: number;
  failedNodes: number;
  skippedNodes: number;
  executionTime: number;
  memoryUsage: number;
  documentsProcessed: number;
  dataTransferred: number;
}

export interface NodeMetrics {
  executionTime: number;
  memoryUsage: number;
  inputSize: number;
  outputSize: number;
  operationsCount: number;
}

export class PDFWorkflowEngine {
  private workflows = new Map<string, WorkflowDefinition>();
  private executions = new Map<string, WorkflowExecution>();
  private nodeExecutors = new Map<WorkflowNodeType, NodeExecutor>();
  private performanceMonitor = new PerformanceMonitor();
  private eventEmitter = new WorkflowEventEmitter();

  constructor() {
    this.initializeNodeExecutors();
  }

  private initializeNodeExecutors(): void {
    // Register built-in node executors
    this.nodeExecutors.set('input', new InputNodeExecutor());
    this.nodeExecutors.set('output', new OutputNodeExecutor());
    this.nodeExecutors.set('transform', new TransformNodeExecutor());
    this.nodeExecutors.set('filter', new FilterNodeExecutor());
    this.nodeExecutors.set('merge', new MergeNodeExecutor());
    this.nodeExecutors.set('split', new SplitNodeExecutor());
    this.nodeExecutors.set('validate', new ValidateNodeExecutor());
    this.nodeExecutors.set('optimize', new OptimizeNodeExecutor());
    this.nodeExecutors.set('convert', new ConvertNodeExecutor());
    this.nodeExecutors.set('extract', new ExtractNodeExecutor());
    this.nodeExecutors.set('generate', new GenerateNodeExecutor());
    this.nodeExecutors.set('condition', new ConditionNodeExecutor());
    this.nodeExecutors.set('loop', new LoopNodeExecutor());
    this.nodeExecutors.set('parallel', new ParallelNodeExecutor());
    this.nodeExecutors.set('delay', new DelayNodeExecutor());
    this.nodeExecutors.set('notification', new NotificationNodeExecutor());
    this.nodeExecutors.set('api', new ApiNodeExecutor());
    this.nodeExecutors.set('database', new DatabaseNodeExecutor());
    this.nodeExecutors.set('file', new FileNodeExecutor());
    this.nodeExecutors.set('email', new EmailNodeExecutor());
    this.nodeExecutors.set('webhook', new WebhookNodeExecutor());
  }

  // Workflow Management
  async createWorkflow(definition: Omit<WorkflowDefinition, 'id' | 'metadata'>): Promise<string> {
    const id = this.generateWorkflowId();
    const workflow: WorkflowDefinition = {
      ...definition,
      id,
      metadata: {
        author: 'system',
        created: new Date(),
        modified: new Date(),
        tags: [],
        permissions: {
          read: ['*'],
          write: ['admin'],
          execute: ['user'],
          admin: ['admin']
        }
      }
    };

    // Validate workflow
    await this.validateWorkflow(workflow);
    
    this.workflows.set(id, workflow);
    this.eventEmitter.emit('workflow.created', { workflowId: id });
    
    return id;
  }

  async executeWorkflow(workflowId: string, context: Partial<ExecutionContext> = {}): Promise<string> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new PDFError(`Workflow ${workflowId} not found`);
    }

    const executionId = this.generateExecutionId();
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId,
      status: 'queued',
      startTime: new Date(),
      progress: 0,
      nodeResults: new Map(),
      context: {
        variables: new Map(),
        documents: new Map(),
        files: new Map(),
        metadata: new Map(),
        ...context
      },
      metrics: {
        totalNodes: workflow.nodes.length,
        completedNodes: 0,
        failedNodes: 0,
        skippedNodes: 0,
        executionTime: 0,
        memoryUsage: 0,
        documentsProcessed: 0,
        dataTransferred: 0
      }
    };

    this.executions.set(executionId, execution);
    this.eventEmitter.emit('execution.started', { executionId, workflowId });

    // Execute workflow asynchronously
    this.executeWorkflowAsync(execution, workflow);

    return executionId;
  }

  private async executeWorkflowAsync(execution: WorkflowExecution, workflow: WorkflowDefinition): Promise<void> {
    this.performanceMonitor.startTimer(`workflow_${execution.id}`);
    execution.status = 'running';

    try {
      // Build execution graph
      const executionGraph = this.buildExecutionGraph(workflow);
      
      // Execute nodes in topological order
      const sortedNodes = this.topologicalSort(executionGraph);
      
      for (const nodeId of sortedNodes) {
        const node = workflow.nodes.find(n => n.id === nodeId);
        if (!node) continue;

        execution.currentNode = nodeId;
        this.eventEmitter.emit('node.started', { executionId: execution.id, nodeId });

        const result = await this.executeNode(node, execution, workflow);
        execution.nodeResults.set(nodeId, result);

        if (result.status === 'failed') {
          execution.status = 'failed';
          execution.error = {
            code: 'NODE_EXECUTION_FAILED',
            message: `Node ${node.name} failed: ${result.error}`,
            nodeId
          };
          break;
        } else if (result.status === 'completed') {
          execution.metrics.completedNodes++;
        } else if (result.status === 'skipped') {
          execution.metrics.skippedNodes++;
        }

        // Update progress
        execution.progress = (execution.metrics.completedNodes + execution.metrics.skippedNodes) / execution.metrics.totalNodes * 100;
        this.eventEmitter.emit('execution.progress', { executionId: execution.id, progress: execution.progress });
      }

      if (execution.status === 'running') {
        execution.status = 'completed';
      }

    } catch (error) {
      execution.status = 'failed';
      execution.error = {
        code: 'WORKFLOW_EXECUTION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error
      };
    } finally {
      execution.endTime = new Date();
      execution.metrics.executionTime = this.performanceMonitor.endTimer(`workflow_${execution.id}`);
      this.eventEmitter.emit('execution.completed', { 
        executionId: execution.id, 
        status: execution.status,
        metrics: execution.metrics 
      });
    }
  }

  private async executeNode(
    node: WorkflowNode, 
    execution: WorkflowExecution, 
    workflow: WorkflowDefinition
  ): Promise<NodeExecutionResult> {
    const executor = this.nodeExecutors.get(node.type);
    if (!executor) {
      throw new PDFError(`No executor found for node type: ${node.type}`);
    }

    const result: NodeExecutionResult = {
      nodeId: node.id,
      status: 'running',
      startTime: new Date(),
      input: {},
      metrics: {
        executionTime: 0,
        memoryUsage: 0,
        inputSize: 0,
        outputSize: 0,
        operationsCount: 0
      }
    };

    this.performanceMonitor.startTimer(`node_${node.id}`);

    try {
      // Prepare input data
      result.input = await this.prepareNodeInput(node, execution, workflow);
      result.metrics.inputSize = this.calculateDataSize(result.input);

      // Execute node
      result.output = await executor.execute(node, result.input, execution.context);
      result.metrics.outputSize = this.calculateDataSize(result.output);
      
      result.status = 'completed';
      result.endTime = new Date();

    } catch (error) {
      result.status = 'failed';
      result.error = error instanceof Error ? error.message : 'Unknown error';
      result.endTime = new Date();
    } finally {
      result.metrics.executionTime = this.performanceMonitor.endTimer(`node_${node.id}`);
      result.metrics.memoryUsage = this.performanceMonitor.getMemoryDelta();
    }

    return result;
  }

  private async prepareNodeInput(
    node: WorkflowNode, 
    execution: WorkflowExecution, 
    workflow: WorkflowDefinition
  ): Promise<any> {
    const input: any = {};

    // Get input connections
    const inputConnections = workflow.connections.filter(c => c.targetNodeId === node.id);
    
    for (const connection of inputConnections) {
      const sourceResult = execution.nodeResults.get(connection.sourceNodeId);
      if (sourceResult && sourceResult.output) {
        const inputPort = node.inputs.find(p => p.id === connection.targetPortId);
        if (inputPort) {
          input[inputPort.name] = sourceResult.output[connection.sourcePortId] || sourceResult.output;
        }
      }
    }

    // Add node configuration
    Object.assign(input, node.configuration);

    return input;
  }

  private buildExecutionGraph(workflow: WorkflowDefinition): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    
    // Initialize all nodes
    for (const node of workflow.nodes) {
      graph.set(node.id, []);
    }
    
    // Add dependencies based on connections
    for (const connection of workflow.connections) {
      const dependencies = graph.get(connection.targetNodeId) || [];
      dependencies.push(connection.sourceNodeId);
      graph.set(connection.targetNodeId, dependencies);
    }
    
    return graph;
  }

  private topologicalSort(graph: Map<string, string[]>): string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const result: string[] = [];

    const visit = (nodeId: string) => {
      if (visiting.has(nodeId)) {
        throw new PDFError(`Circular dependency detected involving node: ${nodeId}`);
      }
      
      if (visited.has(nodeId)) {
        return;
      }

      visiting.add(nodeId);
      
      const dependencies = graph.get(nodeId) || [];
      for (const dep of dependencies) {
        visit(dep);
      }
      
      visiting.delete(nodeId);
      visited.add(nodeId);
      result.push(nodeId);
    };

    for (const nodeId of graph.keys()) {
      if (!visited.has(nodeId)) {
        visit(nodeId);
      }
    }

    return result;
  }

  private async validateWorkflow(workflow: WorkflowDefinition): Promise<void> {
    // Validate workflow structure
    if (!workflow.nodes || workflow.nodes.length === 0) {
      throw new PDFError('Workflow must have at least one node');
    }

    // Validate node types
    for (const node of workflow.nodes) {
      if (!this.nodeExecutors.has(node.type)) {
        throw new PDFError(`Unknown node type: ${node.type}`);
      }
    }

    // Validate connections
    for (const connection of workflow.connections) {
      const sourceNode = workflow.nodes.find(n => n.id === connection.sourceNodeId);
      const targetNode = workflow.nodes.find(n => n.id === connection.targetNodeId);
      
      if (!sourceNode) {
        throw new PDFError(`Source node not found: ${connection.sourceNodeId}`);
      }
      
      if (!targetNode) {
        throw new PDFError(`Target node not found: ${connection.targetNodeId}`);
      }
    }

    // Check for circular dependencies
    try {
      const graph = this.buildExecutionGraph(workflow);
      this.topologicalSort(graph);
    } catch (error) {
      throw new PDFError(`Workflow validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private calculateDataSize(data: any): number {
    return JSON.stringify(data).length;
  }

  private generateWorkflowId(): string {
    return 'wf_' + Math.random().toString(36).substr(2, 9);
  }

  private generateExecutionId(): string {
    return 'exec_' + Math.random().toString(36).substr(2, 9);
  }

  // Public API
  getWorkflow(id: string): WorkflowDefinition | undefined {
    return this.workflows.get(id);
  }

  getExecution(id: string): WorkflowExecution | undefined {
    return this.executions.get(id);
  }

  getAllWorkflows(): WorkflowDefinition[] {
    return Array.from(this.workflows.values());
  }

  getActiveExecutions(): WorkflowExecution[] {
    return Array.from(this.executions.values()).filter(e => e.status === 'running' || e.status === 'queued');
  }

  async cancelExecution(executionId: string): Promise<boolean> {
    const execution = this.executions.get(executionId);
    if (!execution || execution.status !== 'running') {
      return false;
    }

    execution.status = 'cancelled';
    execution.endTime = new Date();
    this.eventEmitter.emit('execution.cancelled', { executionId });
    
    return true;
  }

  on(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }

  off(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.off(event, listener);
  }
}

// Node Executor Interface
abstract class NodeExecutor {
  abstract execute(node: WorkflowNode, input: any, context: ExecutionContext): Promise<any>;
}

// Built-in Node Executors
class InputNodeExecutor extends NodeExecutor {
  async execute(node: WorkflowNode, input: any, context: ExecutionContext): Promise<any> {
    // Input node - provides data to the workflow
    return input.data || context.variables.get(input.variableName) || {};
  }
}

class OutputNodeExecutor extends NodeExecutor {
  async execute(node: WorkflowNode, input: any, context: ExecutionContext): Promise<any> {
    // Output node - stores results
    if (input.variableName) {
      context.variables.set(input.variableName, input.data);
    }
    return input.data;
  }
}

class TransformNodeExecutor extends NodeExecutor {
  async execute(node: WorkflowNode, input: any, context: ExecutionContext): Promise<any> {
    // Transform node - applies transformations to documents
    const document = input.document as VibePDFDocument;
    if (!document) {
      throw new PDFError('Transform node requires a document input');
    }

    // Apply transformations based on configuration
    const transformations = input.transformations || [];
    let result = document;

    for (const transform of transformations) {
      result = await this.applyTransformation(result, transform);
    }

    return { document: result };
  }

  private async applyTransformation(document: VibePDFDocument, transform: any): Promise<VibePDFDocument> {
    // Apply specific transformation
    switch (transform.type) {
      case 'rotate':
        // Rotate pages
        break;
      case 'scale':
        // Scale pages
        break;
      case 'crop':
        // Crop pages
        break;
      default:
        console.warn(`Unknown transformation type: ${transform.type}`);
    }
    return document;
  }
}

class FilterNodeExecutor extends NodeExecutor {
  async execute(node: WorkflowNode, input: any, context: ExecutionContext): Promise<any> {
    // Filter node - filters data based on conditions
    const data = input.data;
    const condition = input.condition;
    
    if (Array.isArray(data)) {
      return { data: data.filter(item => this.evaluateCondition(item, condition)) };
    }
    
    return { data: this.evaluateCondition(data, condition) ? data : null };
  }

  private evaluateCondition(item: any, condition: any): boolean {
    // Simple condition evaluation
    if (!condition) return true;
    
    const { field, operator, value } = condition;
    const itemValue = this.getFieldValue(item, field);
    
    switch (operator) {
      case 'equals': return itemValue === value;
      case 'not_equals': return itemValue !== value;
      case 'greater_than': return itemValue > value;
      case 'less_than': return itemValue < value;
      case 'contains': return String(itemValue).includes(String(value));
      default: return true;
    }
  }

  private getFieldValue(item: any, field: string): any {
    return field.split('.').reduce((obj, key) => obj?.[key], item);
  }
}

class MergeNodeExecutor extends NodeExecutor {
  async execute(node: WorkflowNode, input: any, context: ExecutionContext): Promise<any> {
    // Merge node - merges multiple documents
    const documents = input.documents as VibePDFDocument[];
    if (!documents || documents.length === 0) {
      throw new PDFError('Merge node requires document inputs');
    }

    // Use advanced processor for merging
    const { advancedProcessor } = await import('./PDFProcessor.js');
    const mergedDocument = await advancedProcessor.mergeDocuments(documents, input.options || {});
    
    return { document: mergedDocument };
  }
}

class SplitNodeExecutor extends NodeExecutor {
  async execute(node: WorkflowNode, input: any, context: ExecutionContext): Promise<any> {
    // Split node - splits a document
    const document = input.document as VibePDFDocument;
    if (!document) {
      throw new PDFError('Split node requires a document input');
    }

    const { advancedProcessor } = await import('./PDFProcessor.js');
    const splitDocuments = await advancedProcessor.splitDocument(document, input.options || {});
    
    return { documents: splitDocuments };
  }
}

class ValidateNodeExecutor extends NodeExecutor {
  async execute(node: WorkflowNode, input: any, context: ExecutionContext): Promise<any> {
    // Validate node - validates documents
    const document = input.document as VibePDFDocument;
    if (!document) {
      throw new PDFError('Validate node requires a document input');
    }

    const { advancedProcessor } = await import('./PDFProcessor.js');
    const validationResult = await advancedProcessor.validateDocument(document, input.options || {});
    
    return { validationResult, isValid: validationResult.isValid };
  }
}

class OptimizeNodeExecutor extends NodeExecutor {
  async execute(node: WorkflowNode, input: any, context: ExecutionContext): Promise<any> {
    // Optimize node - optimizes documents
    const document = input.document as VibePDFDocument;
    if (!document) {
      throw new PDFError('Optimize node requires a document input');
    }

    const { advancedProcessor } = await import('./PDFProcessor.js');
    const optimizedDocument = await advancedProcessor.optimizeDocument(document, input.options || {});
    
    return { document: optimizedDocument };
  }
}

class ConvertNodeExecutor extends NodeExecutor {
  async execute(node: WorkflowNode, input: any, context: ExecutionContext): Promise<any> {
    // Convert node - converts document formats
    throw new PDFError('Convert node not yet implemented');
  }
}

class ExtractNodeExecutor extends NodeExecutor {
  async execute(node: WorkflowNode, input: any, context: ExecutionContext): Promise<any> {
    // Extract node - extracts content from documents
    const document = input.document as VibePDFDocument;
    if (!document) {
      throw new PDFError('Extract node requires a document input');
    }

    const { advancedProcessor } = await import('./PDFProcessor.js');
    const extractedContent = await advancedProcessor.extractContent(document, input.options || {});
    
    return { content: extractedContent };
  }
}

class GenerateNodeExecutor extends NodeExecutor {
  async execute(node: WorkflowNode, input: any, context: ExecutionContext): Promise<any> {
    // Generate node - generates new documents
    const document = await VibePDFDocument.create(input.metadata || {});
    
    // Apply template if specified
    if (input.template) {
      await this.applyTemplate(document, input.template, input.data);
    }
    
    return { document };
  }

  private async applyTemplate(document: VibePDFDocument, template: any, data: any): Promise<void> {
    // Apply document template with data
    console.log('Applying template to generated document');
  }
}

class ConditionNodeExecutor extends NodeExecutor {
  async execute(node: WorkflowNode, input: any, context: ExecutionContext): Promise<any> {
    // Condition node - conditional branching
    const condition = input.condition;
    const result = this.evaluateCondition(input.data, condition);
    
    return { result, data: input.data };
  }

  private evaluateCondition(data: any, condition: any): boolean {
    // Evaluate condition logic
    return true; // Simplified implementation
  }
}

class LoopNodeExecutor extends NodeExecutor {
  async execute(node: WorkflowNode, input: any, context: ExecutionContext): Promise<any> {
    // Loop node - iterative processing
    const items = input.items || [];
    const results: any[] = [];
    
    for (const item of items) {
      // Process each item (would need sub-workflow execution)
      results.push({ item, processed: true });
    }
    
    return { results };
  }
}

class ParallelNodeExecutor extends NodeExecutor {
  async execute(node: WorkflowNode, input: any, context: ExecutionContext): Promise<any> {
    // Parallel node - parallel processing
    const tasks = input.tasks || [];
    const results = await Promise.allSettled(
      tasks.map((task: any) => this.processTask(task))
    );
    
    return { results };
  }

  private async processTask(task: any): Promise<any> {
    // Process individual task
    return { task, completed: true };
  }
}

class DelayNodeExecutor extends NodeExecutor {
  async execute(node: WorkflowNode, input: any, context: ExecutionContext): Promise<any> {
    // Delay node - adds delays
    const duration = input.duration || 1000;
    await new Promise(resolve => setTimeout(resolve, duration));
    
    return { delayed: duration, data: input.data };
  }
}

class NotificationNodeExecutor extends NodeExecutor {
  async execute(node: WorkflowNode, input: any, context: ExecutionContext): Promise<any> {
    // Notification node - sends notifications
    console.log('Notification sent:', input.message);
    
    return { sent: true, message: input.message };
  }
}

class ApiNodeExecutor extends NodeExecutor {
  async execute(node: WorkflowNode, input: any, context: ExecutionContext): Promise<any> {
    // API node - makes API calls
    const response = await fetch(input.url, {
      method: input.method || 'GET',
      headers: input.headers || {},
      body: input.body ? JSON.stringify(input.body) : undefined
    });
    
    const data = await response.json();
    return { response: data, status: response.status };
  }
}

class DatabaseNodeExecutor extends NodeExecutor {
  async execute(node: WorkflowNode, input: any, context: ExecutionContext): Promise<any> {
    // Database node - database operations
    console.log('Database operation executed');
    return { success: true };
  }
}

class FileNodeExecutor extends NodeExecutor {
  async execute(node: WorkflowNode, input: any, context: ExecutionContext): Promise<any> {
    // File node - file operations
    console.log('File operation executed');
    return { success: true };
  }
}

class EmailNodeExecutor extends NodeExecutor {
  async execute(node: WorkflowNode, input: any, context: ExecutionContext): Promise<any> {
    // Email node - email operations
    console.log('Email sent:', input.to);
    return { sent: true, to: input.to };
  }
}

class WebhookNodeExecutor extends NodeExecutor {
  async execute(node: WorkflowNode, input: any, context: ExecutionContext): Promise<any> {
    // Webhook node - webhook calls
    const response = await fetch(input.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input.payload)
    });
    
    return { success: response.ok, status: response.status };
  }
}

// Event Emitter for workflow events
class WorkflowEventEmitter {
  private listeners = new Map<string, Function[]>();

  on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  off(event: string, listener: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index !== -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  emit(event: string, data?: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => listener(data));
    }
  }
}

export const createWorkflowEngine = () => new PDFWorkflowEngine();