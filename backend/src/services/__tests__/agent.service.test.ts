import { describe, it, expect } from 'vitest';
import { agentService } from '../agent.service.js';

describe('Agent Service', () => {
  it('retrieves seeded agents', async () => {
    const agents = await agentService.getAll();
    expect(Array.isArray(agents)).toBe(true);
    expect(agents.length).toBeGreaterThanOrEqual(5);

    const architect = agents.find((a) => a.role === 'Architect');
    expect(architect).toBeDefined();
    expect(architect?.name).toBe('Architect Agent');
  });

  it('creates, updates and deletes a new agent', async () => {
    const created = await agentService.create({
      name: 'Security Auditor Agent',
      description: 'Audita vulnerabilidades y permisos en tiempo real',
      role: 'Reviewer',
      providerId: 'anthropic',
      modelId: 'claude-3-7-sonnet',
      systemPrompt: 'Eres un experto en ciberseguridad.',
      temperature: 0.2,
      maxIterations: 5,
      allowedToolIds: ['tool-fs-read'],
      allowedAgentCommunicationIds: ['agent-coordinator'],
    });

    expect(created.id).toBeDefined();
    expect(created.name).toBe('Security Auditor Agent');
    expect(created.allowedToolIds).toContain('tool-fs-read');
    expect(created.allowedAgentCommunicationIds).toContain('agent-coordinator');

    // Update
    const updated = await agentService.update(created.id, {
      name: 'Senior Security Auditor Agent',
      temperature: 0.1,
    });
    expect(updated.name).toBe('Senior Security Auditor Agent');
    expect(updated.temperature).toBe(0.1);

    // Delete
    const delRes = await agentService.delete(created.id);
    expect(delRes.success).toBe(true);

    // Should throw NotFoundError
    await expect(agentService.getById(created.id)).rejects.toThrow();
  });
});
