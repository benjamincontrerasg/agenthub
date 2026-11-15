import { describe, it, expect } from 'vitest';
import { credentialsService, maskApiKey } from '../credentials.service.js';
import { agentService } from '../agent.service.js';

describe('Credentials Service (API Key Vault)', () => {
  it('correctly masks API keys preserving prefixes and hiding secrets', () => {
    expect(maskApiKey('sk-ant-api03-abcdef1234567890')).toBe('sk-••••7890');
    expect(maskApiKey('sk-proj-9876543210fedcba')).toBe('sk-••••dcba');
    expect(maskApiKey('AIzaSyD-1234567890abcdef')).toBe('AIz••••cdef');
    expect(maskApiKey('short')).toBe('••••••••');
    expect(maskApiKey('')).toBe('');
  });

  it('creates, retrieves, and decrypts a named API credential', async () => {
    const rawKey = 'sk-proj-test-secret-key-12345678';
    const cred = await credentialsService.create({
      name: 'OpenAI Test Vault Key',
      providerId: 'openai',
      apiKey: rawKey,
    });

    expect(cred.id).toBeDefined();
    expect(cred.name).toBe('OpenAI Test Vault Key');
    expect(cred.providerId).toBe('openai');
    expect(cred.maskedKey).toBe('sk-••••5678');
    // Ensure raw key is never stored in plaintext in the returned object
    expect((cred as any).encryptedKey).toBeUndefined();
    expect((cred as any).apiKey).toBeUndefined();

    // Verify retrieval by ID
    const fetched = await credentialsService.getById(cred.id);
    expect(fetched.name).toBe('OpenAI Test Vault Key');
    expect(fetched.maskedKey).toBe('sk-••••5678');

    // Verify secure internal decryption
    const decrypted = credentialsService.getDecryptedKey(cred.id);
    expect(decrypted).toBe(rawKey);

    // Verify listing
    const all = await credentialsService.getAll();
    expect(all.some((c) => c.id === cred.id)).toBe(true);

    // Delete
    const delResult = await credentialsService.delete(cred.id);
    expect(delResult.success).toBe(true);

    await expect(credentialsService.getById(cred.id)).rejects.toThrow();
  });

  it('associates an agent with a named credential by ID and resolves credentialName', async () => {
    const rawKey = 'sk-ant-production-team-key-9999';
    const cred = await credentialsService.create({
      name: 'Anthropic Team Prod',
      providerId: 'anthropic',
      apiKey: rawKey,
    });

    const agent = await agentService.create({
      name: 'Vault Linked Agent',
      description: 'Agent linked to a named API credential',
      role: 'Developer',
      providerId: 'anthropic',
      credentialId: cred.id,
      modelId: 'claude-3-7-sonnet',
      systemPrompt: 'You use named credentials.',
    });

    expect(agent.credentialId).toBe(cred.id);
    expect(agent.credentialName).toBe('Anthropic Team Prod');

    // Verify in getAll
    const allAgents = await agentService.getAll();
    const foundAgent = allAgents.find((a) => a.id === agent.id);
    expect(foundAgent?.credentialId).toBe(cred.id);
    expect(foundAgent?.credentialName).toBe('Anthropic Team Prod');

    // Cleanup
    await agentService.delete(agent.id);
    await credentialsService.delete(cred.id);
  });
});
