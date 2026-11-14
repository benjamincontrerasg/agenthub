import { describe, it, expect, beforeEach } from 'vitest';

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

import { useAgentsStore } from '../agents.store';

describe('Agents Store', () => {
  it('loads initial default agents', () => {
    const agents = useAgentsStore.getState().agents;
    expect(agents.length).toBeGreaterThanOrEqual(5);

    const architect = agents.find((a) => a.role === 'Architect');
    expect(architect).toBeDefined();
    expect(architect?.name).toBe('Architect Agent');
  });

  it('can create a new agent', () => {
    const newAgent = useAgentsStore.getState().addAgent({
      name: 'Performance Profiler Agent',
      description: 'Audita y optimiza cuellos de botella',
      role: 'Optimizer',
      providerId: 'anthropic',
      modelId: 'claude-3-7-sonnet',
      systemPrompt: 'Analiza métricas de CPU y memoria...',
      temperature: 0.2,
      maxIterations: 10,
      allowedToolIds: ['tool-fs-read'],
      allowedAgentCommunicationIds: ['agent-developer'],
      status: 'active',
    });

    expect(newAgent.id).toBeDefined();
    const found = useAgentsStore.getState().getAgentById(newAgent.id);
    expect(found).toBeDefined();
    expect(found?.name).toBe('Performance Profiler Agent');
  });

  it('can toggle agent status between active and paused', () => {
    const agent = useAgentsStore.getState().agents[0];
    const initialStatus = agent.status;

    useAgentsStore.getState().toggleAgentStatus(agent.id);
    const updated = useAgentsStore.getState().getAgentById(agent.id);
    expect(updated?.status).not.toBe(initialStatus);
  });
});

