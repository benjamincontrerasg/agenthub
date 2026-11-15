import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenAICompatibleProvider } from '../openai-compatible.provider.js';
import { AnthropicProvider } from '../anthropic.provider.js';
import { LLMProvider, ProviderError } from '../types.js';

describe('Shared LLM Provider Contract Suite (Phase 6)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  const providersToTest: Array<{ name: string; create: () => LLMProvider; kind: string }> = [
    {
      name: 'OpenAI-Compatible Adapter',
      kind: 'openai-compatible',
      create: () =>
        new OpenAICompatibleProvider({
          id: 'openai',
          kind: 'openai-compatible',
          apiKey: 'sk-contract-key-999',
        }),
    },
    {
      name: 'Anthropic Adapter',
      kind: 'anthropic',
      create: () =>
        new AnthropicProvider({
          id: 'anthropic',
          kind: 'anthropic',
          apiKey: 'ant-contract-key-999',
        }),
    },
  ];

  for (const { name, create, kind } of providersToTest) {
    describe(`Contract implementation: ${name}`, () => {
      it('1. Chat simple returns content, usage, and finishReason: stop', async () => {
        const provider = create();

        if (kind === 'openai-compatible') {
          globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
              choices: [{ message: { role: 'assistant', content: 'Contrato válido' }, finish_reason: 'stop' }],
              usage: { prompt_tokens: 12, completion_tokens: 8 },
            }),
          } as any);
        } else {
          globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
              content: [{ type: 'text', text: 'Contrato válido' }],
              stop_reason: 'end_turn',
              usage: { input_tokens: 12, output_tokens: 8 },
            }),
          } as any);
        }

        const res = await provider.chat({
          model: 'test-model',
          messages: [{ role: 'user', content: 'Hola' }],
        });

        expect(res.content).toBe('Contrato válido');
        expect(res.finishReason).toBe('stop');
        expect(res.usage).toEqual({ inputTokens: 12, outputTokens: 8 });
      });

      it('2. Maps 401 Unauthorized to non-retryable ProviderError without credential leak', async () => {
        const secretKey = 'sk-contract-key-999';
        const provider = create();

        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          text: async () => `Invalid token: ${secretKey}`,
        } as any);

        try {
          await provider.chat({
            model: 'test-model',
            messages: [{ role: 'user', content: 'test' }],
          });
          expect.unreachable();
        } catch (err: any) {
          expect(err).toBeInstanceOf(ProviderError);
          expect(err.status).toBe(401);
          expect(err.retryable).toBe(false);
          expect(err.message).not.toContain(secretKey);
          expect(err.message).toContain('[REDACTED]');
        }
      });

      it('3. Maps 429 Rate Limit to retryable: true ProviderError', async () => {
        const provider = create();

        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          text: async () => 'Rate limit exceeded. Please wait.',
        } as any);

        try {
          await provider.chat({
            model: 'test-model',
            messages: [{ role: 'user', content: 'test' }],
          });
          expect.unreachable();
        } catch (err: any) {
          expect(err).toBeInstanceOf(ProviderError);
          expect(err.status).toBe(429);
          expect(err.retryable).toBe(true);
        }
      });

      it('4. Maps 500/502/503 Server Error to retryable: true ProviderError', async () => {
        const provider = create();

        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 503,
          statusText: 'Service Unavailable',
          text: async () => 'Overloaded. Please retry.',
        } as any);

        try {
          await provider.chat({
            model: 'test-model',
            messages: [{ role: 'user', content: 'test' }],
          });
          expect.unreachable();
        } catch (err: any) {
          expect(err).toBeInstanceOf(ProviderError);
          expect(err.status).toBe(503);
          expect(err.retryable).toBe(true);
        }
      });

      it('5. AbortSignal aborts and halts the execution promptly', async () => {
        const provider = create();
        const controller = new AbortController();
        controller.abort();

        await expect(
          provider.chat({
            model: 'test-model',
            messages: [{ role: 'user', content: 'test' }],
            signal: controller.signal,
          })
        ).rejects.toThrow(/cancelada|agotado/i);
      });
    });
  }
});
