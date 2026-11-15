import { describe, it, expect, beforeEach } from 'vitest';
import {
  credentialsService,
  resetMockCredentials,
} from '../credentials.service';
import { setMockMode } from '../providers.service';

describe('Credentials Service (Mock Mode)', () => {
  beforeEach(() => {
    setMockMode(true);
    resetMockCredentials();
  });

  it('retrieves seeded mock credentials with masked keys', async () => {
    const list = await credentialsService.getCredentials();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBe(2);

    const openai = list.find((c) => c.providerId === 'openai');
    expect(openai).toBeDefined();
    expect(openai?.name).toBe('OpenAI Producción');
    expect(openai?.maskedKey).toContain('••••');
    // Ensure raw secret is never present
    expect((openai as any).apiKey).toBeUndefined();
    expect((openai as any).encryptedKey).toBeUndefined();
  });

  it('creates a new credential with correctly formatted mask in mock mode', async () => {
    const created = await credentialsService.createCredential({
      name: 'Google Gemini Pro Key',
      providerId: 'gemini',
      apiKey: 'AIzaSyTestApiKey12345678',
    });

    expect(created.id).toBeDefined();
    expect(created.name).toBe('Google Gemini Pro Key');
    expect(created.providerId).toBe('gemini');
    expect(created.maskedKey).toBe('AIz••••5678');

    const list = await credentialsService.getCredentials();
    expect(list.some((c) => c.id === created.id)).toBe(true);
  });

  it('updates / renames a credential alias safely', async () => {
    const list = await credentialsService.getCredentials();
    const first = list[0];

    const updated = await credentialsService.updateCredential(first.id, {
      name: 'OpenAI Producción Renovada',
    });

    expect(updated.id).toBe(first.id);
    expect(updated.name).toBe('OpenAI Producción Renovada');
    expect(updated.maskedKey).toBe(first.maskedKey);

    const reFetched = await credentialsService.getCredentials();
    const found = reFetched.find((c) => c.id === first.id);
    expect(found?.name).toBe('OpenAI Producción Renovada');
  });

  it('deletes a credential from the vault in mock mode', async () => {
    const listBefore = await credentialsService.getCredentials();
    const toDelete = listBefore[0];

    const res = await credentialsService.deleteCredential(toDelete.id);
    expect(res.success).toBe(true);

    const listAfter = await credentialsService.getCredentials();
    expect(listAfter.some((c) => c.id === toDelete.id)).toBe(false);
    expect(listAfter.length).toBe(listBefore.length - 1);
  });
});
