import {
  LLMProvider,
  ProviderConfig,
  ChatRequest,
  ChatResponse,
  StreamEvent,
  ModelInfo,
  TestResult,
  ToolCall,
  FinishReason,
  ProviderError,
} from './types.js';
import { requestHttp, parseSSEStream, safeJson } from './http.js';

export class AnthropicProvider implements LLMProvider {
  public readonly id: string;
  public readonly kind = 'anthropic';
  protected readonly apiKey?: string;
  protected readonly baseUrl: string;
  protected readonly timeoutMs: number;
  protected readonly defaultHeaders: Record<string, string>;

  constructor(config: ProviderConfig) {
    this.id = config.id;
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl || 'https://api.anthropic.com/v1').replace(/\/+$/, '');
    this.timeoutMs = config.timeoutMs ?? 30000;

    const headers: Record<string, string> = {
      'anthropic-version': '2023-06-01',
      ...(config.headers || {}),
    };
    if (this.apiKey) {
      headers['x-api-key'] = this.apiKey;
    }
    this.defaultHeaders = headers;
  }

  protected formatMessagesAndSystem(messages: ChatRequest['messages']): { systemPrompt?: string; anthropicMessages: any[] } {
    let systemPrompt: string | undefined;
    const rawList: any[] = [];

    for (const m of messages) {
      if (m.role === 'system') {
        systemPrompt = (systemPrompt ? `${systemPrompt}\n\n` : '') + m.content;
        continue;
      }

      if (m.role === 'tool') {
        rawList.push({
          role: 'user',
          isToolResult: true,
          content: [
            {
              type: 'tool_result',
              tool_use_id: m.toolCallId || 'default-tool-id',
              content: m.content,
            },
          ],
        });
        continue;
      }

      if (m.role === 'assistant' && m.toolCalls && m.toolCalls.length > 0) {
        const blocks: any[] = [];
        if (m.content) {
          blocks.push({ type: 'text', text: m.content });
        }
        for (const tc of m.toolCalls) {
          blocks.push({
            type: 'tool_use',
            id: tc.id,
            name: tc.name,
            input: typeof tc.arguments === 'string' ? safeJson(tc.arguments) || {} : tc.arguments,
          });
        }
        rawList.push({
          role: 'assistant',
          content: blocks,
        });
        continue;
      }

      rawList.push({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      });
    }

    // Fusión de tool_results consecutivos en un solo mensaje user
    const consolidatedMessages: any[] = [];
    for (const item of rawList) {
      const prev = consolidatedMessages[consolidatedMessages.length - 1];
      if (item.isToolResult && prev && prev.isToolResult) {
        prev.content.push(...item.content);
      } else {
        consolidatedMessages.push(item);
      }
    }

    // Limpiar metadata interna isToolResult
    const finalMessages = consolidatedMessages.map(({ isToolResult, ...rest }) => rest);

    return { systemPrompt, anthropicMessages: finalMessages };
  }

  protected formatTools(tools?: ChatRequest['tools']): any[] | undefined {
    if (!tools || tools.length === 0) return undefined;
    return tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.parameters,
    }));
  }

  public async chat(req: ChatRequest): Promise<ChatResponse> {
    const { systemPrompt, anthropicMessages } = this.formatMessagesAndSystem(req.messages);

    const payload: any = {
      model: req.model,
      messages: anthropicMessages,
      max_tokens: req.maxTokens || 4096,
      temperature: req.temperature,
    };

    if (systemPrompt) {
      payload.system = systemPrompt;
    }

    const tools = this.formatTools(req.tools);
    if (tools) {
      payload.tools = tools;
    }

    const res = await requestHttp(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: this.defaultHeaders,
      body: payload,
      timeoutMs: this.timeoutMs,
      signal: req.signal,
    });

    const data: any = await res.json();
    let textContent = '';
    const toolCalls: ToolCall[] = [];

    if (Array.isArray(data.content)) {
      for (const block of data.content) {
        if (block.type === 'text') {
          textContent += block.text;
        } else if (block.type === 'tool_use') {
          toolCalls.push({
            id: block.id,
            name: block.name,
            arguments: block.input || {},
          });
        }
      }
    }

    let finishReason: FinishReason = 'stop';
    if (data.stop_reason === 'tool_use') {
      finishReason = 'tool_calls';
    } else if (data.stop_reason === 'max_tokens') {
      finishReason = 'length';
    } else if (data.stop_reason === 'stop_sequence' || data.stop_reason === 'end_turn') {
      finishReason = 'stop';
    }

    return {
      content: textContent,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usage: data.usage
        ? {
            inputTokens: data.usage.input_tokens ?? 0,
            outputTokens: data.usage.output_tokens ?? 0,
          }
        : undefined,
      finishReason,
    };
  }

  public async *stream(req: ChatRequest): AsyncGenerator<StreamEvent, void, unknown> {
    const { systemPrompt, anthropicMessages } = this.formatMessagesAndSystem(req.messages);

    const payload: any = {
      model: req.model,
      messages: anthropicMessages,
      max_tokens: req.maxTokens || 4096,
      temperature: req.temperature,
      stream: true,
    };

    if (systemPrompt) {
      payload.system = systemPrompt;
    }

    const tools = this.formatTools(req.tools);
    if (tools) {
      payload.tools = tools;
    }

    const res = await requestHttp(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: this.defaultHeaders,
      body: payload,
      timeoutMs: this.timeoutMs,
      signal: req.signal,
    });

    if (!res.body) {
      throw new ProviderError('Cuerpo de respuesta vacío en streaming SSE.', { status: 502 });
    }

    let inputTokens = 0;
    let outputTokens = 0;
    let finishReason: FinishReason = 'stop';

    let currentTool: { id: string; name: string; partialJson: string } | null = null;
    const completedToolCalls: ToolCall[] = [];

    for await (const rawChunk of parseSSEStream(res.body)) {
      const data = safeJson<any>(rawChunk);
      if (!data) continue;

      if (data.type === 'message_start' && data.message?.usage) {
        inputTokens = data.message.usage.input_tokens ?? 0;
      }

      if (data.type === 'content_block_start' && data.content_block?.type === 'tool_use') {
        currentTool = {
          id: data.content_block.id,
          name: data.content_block.name,
          partialJson: '',
        };
      }

      if (data.type === 'content_block_delta') {
        if (data.delta?.type === 'text_delta' && data.delta.text) {
          yield { type: 'text_delta', text: data.delta.text };
        } else if (data.delta?.type === 'input_json_delta' && data.delta.partial_json) {
          if (currentTool) {
            currentTool.partialJson += data.delta.partial_json;
          }
        }
      }

      if (data.type === 'content_block_stop') {
        if (currentTool) {
          const parsed = safeJson(currentTool.partialJson) || currentTool.partialJson;
          completedToolCalls.push({
            id: currentTool.id,
            name: currentTool.name,
            arguments: parsed,
          });
          currentTool = null;
        }
      }

      if (data.type === 'message_delta') {
        if (data.usage?.output_tokens) {
          outputTokens = data.usage.output_tokens;
        }
        if (data.delta?.stop_reason) {
          if (data.delta.stop_reason === 'tool_use') {
            finishReason = 'tool_calls';
          } else if (data.delta.stop_reason === 'max_tokens') {
            finishReason = 'length';
          } else {
            finishReason = 'stop';
          }
        }
      }
    }

    if (completedToolCalls.length > 0) {
      finishReason = 'tool_calls';
      for (const tc of completedToolCalls) {
        yield { type: 'tool_call', toolCall: tc };
      }
    }

    yield {
      type: 'done',
      usage: { inputTokens, outputTokens },
      finishReason,
    };
  }

  public async listModels(): Promise<ModelInfo[]> {
    try {
      const res = await requestHttp(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: this.defaultHeaders,
        timeoutMs: Math.min(this.timeoutMs, 10000),
      });

      const data: any = await res.json();
      const raw = Array.isArray(data) ? data : data.data || [];
      return raw.map((m: any) => ({
        id: m.id,
        name: m.display_name || m.id,
        supportsTools: true,
      }));
    } catch {
      return [
        { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', contextWindow: 200000, supportsTools: true },
        { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', contextWindow: 200000, supportsTools: true },
        { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', contextWindow: 200000, supportsTools: true },
      ];
    }
  }

  public async test(): Promise<TestResult> {
    const start = Date.now();
    try {
      await this.listModels();
      return {
        ok: true,
        latencyMs: Math.max(Date.now() - start, 1),
      };
    } catch (err: any) {
      return {
        ok: false,
        latencyMs: Date.now() - start,
        error: err.message || 'Error de conexión con Anthropic API',
      };
    }
  }
}
