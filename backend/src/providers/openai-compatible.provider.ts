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

interface FragmentedToolCall {
  id?: string;
  name?: string;
  arguments: string;
}

export class OpenAICompatibleProvider implements LLMProvider {
  public readonly id: string;
  public readonly kind: string;
  protected readonly apiKey?: string;
  protected readonly baseUrl: string;
  protected readonly defaultHeaders: Record<string, string>;
  protected readonly timeoutMs: number;

  constructor(config: ProviderConfig) {
    this.id = config.id;
    this.kind = config.kind || 'openai-compatible';
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
    this.timeoutMs = config.timeoutMs ?? 30000;

    const headers: Record<string, string> = {
      ...(config.headers || {}),
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    this.defaultHeaders = headers;
  }

  protected formatMessages(messages: ChatRequest['messages']): any[] {
    return messages.map((m) => {
      if (m.role === 'tool') {
        return {
          role: 'tool',
          tool_call_id: m.toolCallId || 'default-tool-id',
          content: m.content,
        };
      }

      if (m.role === 'assistant' && m.toolCalls && m.toolCalls.length > 0) {
        return {
          role: 'assistant',
          content: m.content || null,
          tool_calls: m.toolCalls.map((tc) => ({
            id: tc.id,
            type: 'function',
            function: {
              name: tc.name,
              arguments: typeof tc.arguments === 'string' ? tc.arguments : JSON.stringify(tc.arguments),
            },
          })),
        };
      }

      return {
        role: m.role,
        content: m.content,
        ...(m.name ? { name: m.name } : {}),
      };
    });
  }

  protected formatTools(tools?: ChatRequest['tools']): any[] | undefined {
    if (!tools || tools.length === 0) return undefined;
    return tools.map((t) => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }));
  }

  public async chat(req: ChatRequest): Promise<ChatResponse> {
    const payload: any = {
      model: req.model,
      messages: this.formatMessages(req.messages),
      temperature: req.temperature,
      max_tokens: req.maxTokens,
    };

    const tools = this.formatTools(req.tools);
    if (tools) {
      payload.tools = tools;
    }

    const res = await requestHttp(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.defaultHeaders,
      body: payload,
      timeoutMs: this.timeoutMs,
      signal: req.signal,
    });

    const data: any = await res.json();
    const choice = data.choices?.[0];
    if (!choice) {
      throw new ProviderError('El proveedor no devolvió opciones (choices) válidas.', { status: 502 });
    }

    const toolCalls: ToolCall[] = [];
    if (choice.message?.tool_calls) {
      for (const tc of choice.message.tool_calls) {
        const rawArgs = tc.function?.arguments || '{}';
        const parsedArgs = safeJson(rawArgs) || rawArgs;
        toolCalls.push({
          id: tc.id || `call-${Date.now()}`,
          name: tc.function?.name || '',
          arguments: parsedArgs,
        });
      }
    }

    const finishReasonMap: Record<string, FinishReason> = {
      stop: 'stop',
      tool_calls: 'tool_calls',
      function_call: 'tool_calls',
      length: 'length',
    };

    return {
      content: choice.message?.content || '',
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usage: data.usage
        ? {
            inputTokens: data.usage.prompt_tokens ?? 0,
            outputTokens: data.usage.completion_tokens ?? 0,
          }
        : undefined,
      finishReason: finishReasonMap[choice.finish_reason] || (toolCalls.length > 0 ? 'tool_calls' : 'stop'),
    };
  }

  public async *stream(req: ChatRequest): AsyncGenerator<StreamEvent, void, unknown> {
    const payload: any = {
      model: req.model,
      messages: this.formatMessages(req.messages),
      temperature: req.temperature,
      max_tokens: req.maxTokens,
      stream: true,
      stream_options: { include_usage: true },
    };

    const tools = this.formatTools(req.tools);
    if (tools) {
      payload.tools = tools;
    }

    const res = await requestHttp(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.defaultHeaders,
      body: payload,
      timeoutMs: this.timeoutMs,
      signal: req.signal,
    });

    if (!res.body) {
      throw new ProviderError('Cuerpo de respuesta vacío en streaming SSE.', { status: 502 });
    }

    const toolMap = new Map<number, FragmentedToolCall>();
    let usage: { inputTokens: number; outputTokens: number } | undefined;
    let finishReason: FinishReason = 'stop';

    for await (const rawChunk of parseSSEStream(res.body)) {
      const data = safeJson<any>(rawChunk);
      if (!data) continue;

      if (data.usage) {
        usage = {
          inputTokens: data.usage.prompt_tokens ?? 0,
          outputTokens: data.usage.completion_tokens ?? 0,
        };
      }

      const choice = data.choices?.[0];
      if (!choice) continue;

      if (choice.finish_reason) {
        if (choice.finish_reason === 'tool_calls' || choice.finish_reason === 'function_call') {
          finishReason = 'tool_calls';
        } else if (choice.finish_reason === 'length') {
          finishReason = 'length';
        } else {
          finishReason = 'stop';
        }
      }

      const delta = choice.delta;
      if (!delta) continue;

      if (delta.content) {
        yield { type: 'text_delta', text: delta.content };
      }

      if (delta.tool_calls && Array.isArray(delta.tool_calls)) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index ?? 0;
          const existing = toolMap.get(idx) || { arguments: '' };
          if (tc.id) existing.id = tc.id;
          if (tc.function?.name) existing.name = (existing.name || '') + tc.function.name;
          if (tc.function?.arguments) existing.arguments += tc.function.arguments;
          toolMap.set(idx, existing);
        }
      }
    }

    // Emit consolidated tool calls
    if (toolMap.size > 0) {
      finishReason = 'tool_calls';
      for (const [idx, item] of toolMap.entries()) {
        const parsedArgs = safeJson(item.arguments) || item.arguments;
        yield {
          type: 'tool_call',
          toolCall: {
            id: item.id || `call-${Date.now()}-${idx}`,
            name: item.name || 'tool',
            arguments: parsedArgs,
          },
        };
      }
    }

    yield {
      type: 'done',
      usage,
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
      const rawList = Array.isArray(data) ? data : data.data || [];
      return rawList.map((m: any) => ({
        id: m.id || m.name,
        name: m.name || m.id,
        contextWindow: m.context_window,
        supportsTools: true,
      }));
    } catch (err: any) {
      // Fallback: Si el endpoint /models no está implementado o falla
      return [{ id: 'default', name: 'Default Model', supportsTools: true }];
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
        error: err.message || 'Error de conexión con el proveedor',
      };
    }
  }
}
