import { describe, it, expect, beforeEach } from 'vitest';
import {
  agentsService,
  setMockMode,
  resetMockAgents,
} from '../agents.service';

describe('Agents Service (Mock Mode & Operations)', () => {
  beforeEach(() => {
    setMockMode(true);
    resetMockAgents();
  });

  it('retrieves all mock agents', async () => {
    const list = await agentsService.getAgents();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThanOrEqual(1);

    const dev = list.find((a) => a.role.toLowerCase() === 'developer');
    expect(dev).toBeDefined();
  });

  it('creates a new agent and returns it in list', async () => {
    const newAgent = await agentsService.createAgent({
      name: 'Security Auditor Agent',
      description: 'Audita vulnerabilidades en dependencias y código',
      role: 'Reviewer',
      providerId: 'anthropic',
      modelId: 'claude-3-7-sonnet',
      systemPrompt: 'Eres un auditor estricto de seguridad...',
      temperature: 0.1,
      maxIterations: 10,
      allowedToolIds: ['tool-fs-read'],
      allowedAgentCommunicationIds: [],
      status: 'active',
    });

    expect(newAgent.id).toBeDefined();
    expect(newAgent.name).toBe('Security Auditor Agent');

    const list = await agentsService.getAgents();
    expect(list.some((a) => a.id === newAgent.id)).toBe(true);
  });

  it('updates an existing agent', async () => {
    const list = await agentsService.getAgents();
    const first = list[0];

    const updated = await agentsService.updateAgent(first.id, {
      name: 'Updated Name',
      temperature: 0.9,
    });

    expect(updated.name).toBe('Updated Name');
    expect(updated.temperature).toBe(0.9);

    const reFetched = await agentsService.getAgentById(first.id);
    expect(reFetched.name).toBe('Updated Name');
  });

  it('deletes an agent', async () => {
    const listBefore = await agentsService.getAgents();
    const toDelete = listBefore[0];

    const res = await agentsService.deleteAgent(toDelete.id);
    expect(res.success).toBe(true);

    const listAfter = await agentsService.getAgents();
    expect(listAfter.some((a) => a.id === toDelete.id)).toBe(false);
  });
});
