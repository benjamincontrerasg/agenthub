export type Role = 'system' | 'user' | 'assistant' | 'tool';

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any> | string;
}

export interface ChatMessage {
  role: Role;
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
  name?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  tools?: ToolDefinition[];
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export type FinishReason = 'stop' | 'tool_calls' | 'length' | 'error';

export interface ChatResponse {
  content: string;
  toolCalls?: ToolCall[];
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
  finishReason: FinishReason;
}

export type StreamEvent =
  | { type: 'text_delta'; text: string }
  | { type: 'tool_call'; toolCall: ToolCall }
  | {
      type: 'done';
      usage?: { inputTokens: number; outputTokens: number };
      finishReason: FinishReason;
    };

export interface ModelInfo {
  id: string;
  name?: string;
  contextWindow?: number;
  inputCostPer1M?: number;
  outputCostPer1M?: number;
  supportsTools?: boolean;
}

export interface TestResult {
  ok: boolean;
  latencyMs: number;
  error?: string;
}

export interface ProviderConfig {
  id: string;
  kind?: string;
  apiKey?: string;
  baseUrl?: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

export class ProviderError extends Error {
  public readonly status?: number;
  public readonly retryable: boolean;

  constructor(message: string, options?: { status?: number; retryable?: boolean; cause?: unknown }) {
    super(message);
    this.name = 'ProviderError';
    this.status = options?.status;
    this.retryable = options?.retryable ?? (options?.status === 429 || (options?.status !== undefined && options.status >= 500));
    if (options?.cause) {
      this.cause = options.cause;
    }
  }
}

export interface LLMProvider {
  readonly id: string;
  readonly kind: string;
  chat(req: ChatRequest): Promise<ChatResponse>;
  stream(req: ChatRequest): AsyncGenerator<StreamEvent, void, unknown>;
  listModels(): Promise<ModelInfo[]>;
  test(): Promise<TestResult>;
}
