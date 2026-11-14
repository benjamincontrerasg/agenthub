import { describe, it, expect } from 'vitest';
import { providerService } from '../provider.service.js';
import { db } from '../../db/connection.js';
import * as schema from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { decrypt } from '../../lib/crypto.js';

describe('Provider Service', () => {
  it('retrieves all seeded providers', async () => {
    const providers = await providerService.getAll();
    expect(Array.isArray(providers)).toBe(true);
    expect(providers.length).toBeGreaterThanOrEqual(4);

    const openai = providers.find((p) => p.id === 'openai');
    expect(openai).toBeDefined();
    expect(openai?.name).toBe('OpenAI');
  });

  it('connects a provider with encrypted API key and updates default model', async () => {
    const fakeKey = 'sk-test-fake-key-12345';
    const result = await providerService.connect('openai', fakeKey, 'gpt-4o');

    expect(result.success).toBe(true);

    // Verify database record has encrypted key, not plain text
    const record = db.select().from(schema.providers).where(eq(schema.providers.id, 'openai')).get();
    expect(record).toBeDefined();
    expect(record?.hasApiKey).toBe(true);
    expect(record?.status).toBe('connected');
    expect(record?.encryptedApiKey).toBeDefined();
    expect(record?.encryptedApiKey).not.toBe(fakeKey);

    // Verify decryption matches original fake key
    expect(decrypt(record!.encryptedApiKey!)).toBe(fakeKey);

    // Verify getById
    const provider = await providerService.getById('openai');
    expect(provider.hasApiKey).toBe(true);
    expect(provider.status).toBe('connected');
    expect(provider.defaultModelId).toBe('gpt-4o');

    // Verify models isDefault
    const models = db.select().from(schema.models).where(eq(schema.models.providerId, 'openai')).all();
    const gpt4o = models.find((m) => m.id === 'gpt-4o');
    expect(gpt4o?.isDefault).toBe(true);
  });

  it('disconnects a provider and clears encrypted credentials', async () => {
    const result = await providerService.disconnect('openai');
    expect(result.success).toBe(true);

    const record = db.select().from(schema.providers).where(eq(schema.providers.id, 'openai')).get();
    expect(record).toBeDefined();
    expect(record?.hasApiKey).toBe(false);
    expect(record?.status).toBe('disconnected');
    expect(record?.encryptedApiKey).toBeNull();
    expect(record?.latencyMs).toBeNull();
    expect(record?.lastTested).toBeNull();

    const provider = await providerService.getById('openai');
    expect(provider.hasApiKey).toBe(false);
    expect(provider.status).toBe('disconnected');
  });

  it('updates default model and validates model ownership', async () => {
    // Valid model
    const res = await providerService.updateDefaultModel('openai', 'gpt-4o-mini');
    expect(res.success).toBe(true);

    const provider = await providerService.getById('openai');
    expect(provider.defaultModelId).toBe('gpt-4o-mini');

    // Invalid model belonging to another provider or nonexistent
    await expect(providerService.updateDefaultModel('openai', 'claude-3-7-sonnet')).rejects.toThrow();
    await expect(providerService.updateDefaultModel('openai', 'non-existent-model')).rejects.toThrow();
  });

  it('throws NotFoundError for non-existent provider', async () => {
    await expect(providerService.getById('non-existent-provider')).rejects.toThrow();
    await expect(providerService.connect('non-existent-provider', 'sk-test-123')).rejects.toThrow();
    await expect(providerService.disconnect('non-existent-provider')).rejects.toThrow();
    await expect(providerService.updateDefaultModel('non-existent-provider', 'any-model')).rejects.toThrow();
  });
});
