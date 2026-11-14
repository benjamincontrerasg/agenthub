import { describe, it, expect, beforeEach } from 'vitest';
import {
  providersService,
  setMockMode,
  resetMockProviders,
} from '../providers.service';

// Mock localStorage for headless Node test environment
const memoryStore: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => (key in memoryStore ? memoryStore[key] : null),
  setItem: (key: string, value: string) => {
    memoryStore[key] = String(value);
  },
  removeItem: (key: string) => {
    delete memoryStore[key];
  },
  clear: () => {
    for (const key of Object.keys(memoryStore)) {
      delete memoryStore[key];
    }
  },
  get length() {
    return Object.keys(memoryStore).length;
  },
  key: (i: number) => Object.keys(memoryStore)[i] ?? null,
};

if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
  });
}

describe('Providers Service (Mock Mode & Security)', () => {
  beforeEach(() => {
    setMockMode(true);
    resetMockProviders();
    globalThis.localStorage.clear();
  });

  it('retrieves all mock providers', async () => {
    const list = await providersService.getProviders();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThanOrEqual(4);

    const openai = list.find((p) => p.id === 'openai');
    expect(openai).toBeDefined();
    expect(openai?.name).toBe('OpenAI');
  });

  it('connects a provider and updates subsequent getProviders queries', async () => {
    const fakeKey = 'sk-test-fake-secret-99999';
    const connectRes = await providersService.connectProvider('openai', fakeKey, 'gpt-4o');
    expect(connectRes.success).toBe(true);

    const updatedList = await providersService.getProviders();
    const openai = updatedList.find((p) => p.id === 'openai');
    expect(openai?.status).toBe('connected');
    expect(openai?.hasApiKey).toBe(true);
    expect(openai?.defaultModelId).toBe('gpt-4o');
    expect(openai?.lastTested).toBeDefined();

    // Verify models isDefault
    const gpt4o = openai?.models.find((m) => m.id === 'gpt-4o');
    expect(gpt4o?.isDefault).toBe(true);

    const byId = await providersService.getProviderById('openai');
    expect(byId.status).toBe('connected');
    expect(byId.hasApiKey).toBe(true);
  });

  it('tests connectivity and updates latency', async () => {
    const res = await providersService.testConnection('openai');
    expect(res.success).toBe(true);
    expect(res.latencyMs).toBeGreaterThan(0);

    const openai = await providersService.getProviderById('openai');
    expect(openai.latencyMs).toBe(res.latencyMs);
    expect(openai.status).toBe('connected');
  });

  it('disconnects a provider and updates state', async () => {
    // First connect
    await providersService.connectProvider('openai', 'sk-test-fake-key');

    // Then disconnect
    const disconnRes = await providersService.disconnectProvider('openai');
    expect(disconnRes.success).toBe(true);

    const updatedList = await providersService.getProviders();
    const openai = updatedList.find((p) => p.id === 'openai');
    expect(openai?.status).toBe('disconnected');
    expect(openai?.hasApiKey).toBe(false);
    expect(openai?.latencyMs).toBeUndefined();
    expect(openai?.lastTested).toBeUndefined();
  });

  it('updates default model', async () => {
    const res = await providersService.setDefaultModel('openai', 'gpt-4o-mini');
    expect(res.success).toBe(true);

    const openai = await providersService.getProviderById('openai');
    expect(openai.defaultModelId).toBe('gpt-4o-mini');
  });

  it('guarantees API key is NEVER persisted or leaked in client state or storage', async () => {
    const sensitiveKey = 'sk-super-secret-client-token-NEVER-LEAK';
    await providersService.connectProvider('anthropic', sensitiveKey);

    const providers = await providersService.getProviders();
    const anthropic = providers.find((p) => p.id === 'anthropic');

    // Verify plain text key is NOT on the provider object
    const serializedProvider = JSON.stringify(anthropic);
    expect(serializedProvider).not.toContain(sensitiveKey);
    expect((anthropic as any).apiKey).toBeUndefined();
    expect((anthropic as any).encryptedApiKey).toBeUndefined();

    // Verify all providers payload never contains the sensitive key
    const fullPayload = JSON.stringify(providers);
    expect(fullPayload).not.toContain(sensitiveKey);

    // Verify localStorage has zero references to the key
    const allStorageKeys = Object.keys(memoryStore);
    for (const key of allStorageKeys) {
      const val = globalThis.localStorage.getItem(key) || '';
      expect(val).not.toContain(sensitiveKey);
    }

    // Verify legacy storage key was wiped
    expect(globalThis.localStorage.getItem('agenthub-providers-storage')).toBeNull();
  });
});
