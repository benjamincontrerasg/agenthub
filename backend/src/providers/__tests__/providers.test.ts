import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createProvider, PROVIDER_PRESETS } from '../registry.js';
import { OpenAICompatibleProvider } from '../openai-compatible.provider.js';
import { AnthropicProvider } from '../anthropic.provider.js';
import { ProviderError } from '../types.js';

describe('Unified LLM Providers Layer (Phase 1)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('Registry & Presets', () => {
    it('creates an OpenAI-compatible provider from preset', () => {
      const p = createProvider({ id: 'openai', kind: 'openai-compatible', apiKey: 'sk-test-secret-123' });
      expect(p).toBeInstanceOf(OpenAICompatibleProvider);
      expect(p.kind).toBe('openai-compatible');
    });

    it('creates an Anthropic provider from preset', () => {
      const p = createProvider({ id: 'anthropic', kind: 'anthropic', apiKey: 'sk-ant-secret-123' });
      expect(p).toBeInstanceOf(AnthropicProvider);
      expect(p.kind).toBe('anthropic');
    });

    it('supports one-line additions via PROVIDER_PRESETS', () => {
      expect(PROVIDER_PRESETS).toHaveProperty('groq');
      expect(PROVIDER_PRESETS).toHaveProperty('deepseek');
      expect(PROVIDER_PRESETS).toHaveProperty('gemini');
      expect(PROVIDER_PRESETS).toHaveProperty('ollama');

      const deepseek = createProvider({ id: 'deepseek', apiKey: 'test' });
      expect(deepseek).toBeInstanceOf(OpenAICompatibleProvider);
    });
  });

  describe('OpenAI-Compatible Provider', () => {
    it('executes chat and parses response, tool calls and usage', async () => {
      const provider = new OpenAICompatibleProvider({
        id: 'openai',
        kind: 'openai-compatible',
        apiKey: 'secret-key-xyz',
      });

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'Respuesta generada',
                tool_calls: [
                  {
                    id: 'call_1',
                    type: 'function',
                    function: {
                      name: 'read_file',
                      arguments: '{"path":"main.ts"}',
                    },
                  },
                ],
              },
              finish_reason: 'tool_calls',
            },
          ],
          usage: { prompt_tokens: 15, completion_tokens: 25 },
        }),
      } as any);

      const res = await provider.chat({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'Lee el archivo' }],
        tools: [{ name: 'read_file', description: 'Read file', parameters: { type: 'object' } }],
      });

      expect(res.content).toBe('Respuesta generada');
      expect(res.finishReason).toBe('tool_calls');
      expect(res.toolCalls).toHaveLength(1);
      expect(res.toolCalls?.[0].name).toBe('read_file');
      expect(res.toolCalls?.[0].arguments).toEqual({ path: 'main.ts' });
      expect(res.usage).toEqual({ inputTokens: 15, outputTokens: 25 });
    });

    it('accumulates fragmented tool calls across streaming SSE chunks', async () => {
      const provider = new OpenAICompatibleProvider({
        id: 'openai',
        kind: 'openai-compatible',
        apiKey: 'secret-key-xyz',
      });

      const sseChunks = [
        'data: {"choices":[{"delta":{"content":"Analizando..."}}]}\n\n',
        'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"call_99","function":{"name":"fetch_"}}]}}]}\n\n',
        'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"name":"data","arguments":"{\\"id\\":"}}]}}]}\n\n',
        'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"123}"}}]}}]}\n\n',
        'data: {"choices":[{"finish_reason":"tool_calls"}],"usage":{"prompt_tokens":10,"completion_tokens":20}}\n\n',
        'data: [DONE]\n\n',
      ];

      const stream = new ReadableStream({
        start(controller) {
          for (const chunk of sseChunks) {
            controller.enqueue(new TextEncoder().encode(chunk));
          }
          controller.close();
        },
      });

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: stream,
      } as any);

      const events: any[] = [];
      for await (const ev of provider.stream({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'Fetch' }],
      })) {
        events.push(ev);
      }

      const textDeltas = events.filter((e) => e.type === 'text_delta');
      const toolCalls = events.filter((e) => e.type === 'tool_call');
      const doneEvent = events.find((e) => e.type === 'done');

      expect(textDeltas[0].text).toBe('Analizando...');
      expect(toolCalls).toHaveLength(1);
      expect(toolCalls[0].toolCall.name).toBe('fetch_data');
      expect(toolCalls[0].toolCall.arguments).toEqual({ id: 123 });
      expect(doneEvent.finishReason).toBe('tool_calls');
      expect(doneEvent.usage).toEqual({ inputTokens: 10, outputTokens: 20 });
    });

    it('never leaks API keys in error messages on 401/429/500', async () => {
      const secret = 'super-secret-sk-live-99999999999';
      const provider = new OpenAICompatibleProvider({
        id: 'openai',
        kind: 'openai-compatible',
        apiKey: secret,
      });

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => `Bearer ${secret} is invalid or expired.`,
      } as any);

      try {
        await provider.chat({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: 'test' }],
        });
        expect.unreachable();
      } catch (err: any) {
        expect(err).toBeInstanceOf(ProviderError);
        expect(err.message).not.toContain(secret);
        expect(err.message).toContain('[REDACTED]');
      }
    });

    it('handles cancellation via AbortSignal', async () => {
      const provider = new OpenAICompatibleProvider({
        id: 'openai',
        kind: 'openai-compatible',
        apiKey: 'test-key',
      });

      const controller = new AbortController();
      controller.abort();

      await expect(
        provider.chat({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: 'test' }],
          signal: controller.signal,
        })
      ).rejects.toThrow(/cancelada|agotado/i);
    });
  });

  describe('Anthropic Provider', () => {
    it('formats system prompt and fuses consecutive tool_results into a single user message', async () => {
      const provider = new AnthropicProvider({
        id: 'anthropic',
        kind: 'anthropic',
        apiKey: 'ant-secret-key',
      });

      let capturedBody: any;
      globalThis.fetch = vi.fn().mockImplementation(async (_url, opts) => {
        capturedBody = JSON.parse(opts.body);
        return {
          ok: true,
          json: async () => ({
            content: [{ type: 'text', text: 'Respuesta procesada' }],
            stop_reason: 'end_turn',
            usage: { input_tokens: 30, output_tokens: 15 },
          }),
        };
      });

      const res = await provider.chat({
        model: 'claude-3-5-sonnet',
        messages: [
          { role: 'system', content: 'Eres un asistente experto' },
          { role: 'user', content: 'Ejecuta las dos herramientas' },
          {
            role: 'assistant',
            content: 'Ejecutando...',
            toolCalls: [
              { id: 'tool_1', name: 'search', arguments: { q: 'nexora' } },
              { id: 'tool_2', name: 'calc', arguments: { x: 2 } },
            ],
          },
          { role: 'tool', toolCallId: 'tool_1', content: 'Resultado 1' },
          { role: 'tool', toolCallId: 'tool_2', content: 'Resultado 2' },
        ],
      });

      expect(res.content).toBe('Respuesta procesada');
      expect(capturedBody.system).toBe('Eres un asistente experto');
      expect(capturedBody.messages).toHaveLength(3); // user, assistant, and 1 consolidated user message with 2 tool_results
      const lastUserMsg = capturedBody.messages[2];
      expect(lastUserMsg.role).toBe('user');
      expect(lastUserMsg.content).toHaveLength(2);
      expect(lastUserMsg.content[0].type).toBe('tool_result');
      expect(lastUserMsg.content[1].type).toBe('tool_result');
    });

    it('streams text deltas and tool_use blocks cleanly', async () => {
      const provider = new AnthropicProvider({
        id: 'anthropic',
        kind: 'anthropic',
        apiKey: 'ant-secret-key',
      });

      const sseChunks = [
        'data: {"type":"message_start","message":{"usage":{"input_tokens":50}}}\n\n',
        'data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}\n\n',
        'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hola "}}\n\n',
        'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"mundo"}}\n\n',
        'data: {"type":"content_block_stop","index":0}\n\n',
        'data: {"type":"content_block_start","index":1,"content_block":{"type":"tool_use","id":"call_anth_1","name":"query_db"}}\n\n',
        'data: {"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":"{\\"table\\":\\"users\\"}"}}\n\n',
        'data: {"type":"content_block_stop","index":1}\n\n',
        'data: {"type":"message_delta","delta":{"stop_reason":"tool_use"},"usage":{"output_tokens":22}}\n\n',
        'data: {"type":"message_stop"}\n\n',
      ];

      const stream = new ReadableStream({
        start(controller) {
          for (const chunk of sseChunks) {
            controller.enqueue(new TextEncoder().encode(chunk));
          }
          controller.close();
        },
      });

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: stream,
      } as any);

      const events: any[] = [];
      for await (const ev of provider.stream({
        model: 'claude-3-5-sonnet',
        messages: [{ role: 'user', content: 'query' }],
      })) {
        events.push(ev);
      }

      const textDeltas = events.filter((e) => e.type === 'text_delta');
      const toolCalls = events.filter((e) => e.type === 'tool_call');
      const doneEvent = events.find((e) => e.type === 'done');

      expect(textDeltas.map((d) => d.text).join('')).toBe('Hola mundo');
      expect(toolCalls).toHaveLength(1);
      expect(toolCalls[0].toolCall.name).toBe('query_db');
      expect(toolCalls[0].toolCall.arguments).toEqual({ table: 'users' });
      expect(doneEvent.finishReason).toBe('tool_calls');
      expect(doneEvent.usage).toEqual({ inputTokens: 50, outputTokens: 22 });
    });
  });
});
