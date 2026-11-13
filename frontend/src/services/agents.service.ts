import { Agent } from '@/types';
import { initialAgents } from '@/services/mock-data';
import { apiClient } from '@/services/api';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

export const agentsService = {
  async getAgents(): Promise<Agent[]> {
    if (USE_MOCK) {
      return initialAgents;
    }
    return apiClient<Agent[]>('/agents');
  },

  async getAgentById(id: string): Promise<Agent> {
    if (USE_MOCK) {
      const found = initialAgents.find((a) => a.id === id);
      if (!found) throw new Error('Agente no encontrado');
      return found;
    }
    return apiClient<Agent>(`/agents/${id}`);
  },

  async createAgent(agent: Omit<Agent, 'id' | 'createdAt' | 'updatedAt' | 'stats'>): Promise<Agent> {
    if (USE_MOCK) {
      const created: Agent = {
        ...agent,
        id: `agent-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stats: { totalRuns: 0, avgDurationSec: 0, totalTokens: 0, successRate: 100 },
      };
      return created;
    }
    return apiClient<Agent>('/agents', {
      method: 'POST',
      body: JSON.stringify(agent),
    });
  },

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent> {
    if (USE_MOCK) {
      const existing = initialAgents.find((a) => a.id === id);
      return { ...(existing || ({} as Agent)), ...updates, updatedAt: new Date().toISOString() };
    }
    return apiClient<Agent>(`/agents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async deleteAgent(id: string): Promise<{ success: boolean }> {
    if (USE_MOCK) {
      return { success: true };
    }
    return apiClient<{ success: boolean }>(`/agents/${id}`, {
      method: 'DELETE',
    });
  },
};

