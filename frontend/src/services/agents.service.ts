import { Agent } from '@/types';
import { initialAgents } from '@/services/mock-data';
import { apiClient } from '@/services/api';

let mockAgents: Agent[] = structuredClone(initialAgents);
let mockModeOverride: boolean | null = null;

export const isMockMode = (): boolean => {
  if (mockModeOverride !== null) return mockModeOverride;
  return import.meta.env.VITE_USE_MOCK !== 'false';
};

export const setMockMode = (enabled: boolean | null) => {
  mockModeOverride = enabled;
};

export const resetMockAgents = () => {
  mockAgents = structuredClone(initialAgents);
};

export const agentsService = {
  async getAgents(): Promise<Agent[]> {
    if (isMockMode()) {
      return structuredClone(mockAgents);
    }
    return apiClient<Agent[]>('/agents');
  },

  async getAgentById(id: string): Promise<Agent> {
    if (isMockMode()) {
      const found = mockAgents.find((a) => a.id === id);
      if (!found) throw new Error(`Agente con ID '${id}' no encontrado`);
      return structuredClone(found);
    }
    return apiClient<Agent>(`/agents/${id}`);
  },

  async createAgent(
    agent: Omit<Agent, 'id' | 'createdAt' | 'updatedAt' | 'stats'>
  ): Promise<Agent> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 100));
      const created: Agent = {
        ...agent,
        id: `agent-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stats: { totalRuns: 0, avgDurationSec: 0, totalTokens: 0, successRate: 100 },
      };
      mockAgents.unshift(created);
      return structuredClone(created);
    }

    return apiClient<Agent>('/agents', {
      method: 'POST',
      body: JSON.stringify(agent),
    });
  },

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 100));
      const idx = mockAgents.findIndex((a) => a.id === id);
      if (idx === -1) throw new Error(`Agente con ID '${id}' no encontrado`);

      const updated = {
        ...mockAgents[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      mockAgents[idx] = updated;
      return structuredClone(updated);
    }

    return apiClient<Agent>(`/agents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async deleteAgent(id: string): Promise<{ success: boolean }> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 100));
      const idx = mockAgents.findIndex((a) => a.id === id);
      if (idx !== -1) {
        mockAgents.splice(idx, 1);
      }
      return { success: true };
    }

    return apiClient<{ success: boolean }>(`/agents/${id}`, {
      method: 'DELETE',
    });
  },
};
