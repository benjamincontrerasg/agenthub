import { Agent } from '@/types';
import { initialAgents } from '@/services/mock-data';
import { apiClient } from '@/services/api';

export interface AgentMemoryItem {
  id: string;
  agentId: string;
  content: string;
  metadata?: Record<string, any>;
  embedding?: number[];
  createdAt: string;
  similarity?: number;
}

let mockMemories: Record<string, AgentMemoryItem[]> = {
  'agent-coordinator': [
    {
      id: 'mem-seed-1',
      agentId: 'agent-coordinator',
      content: 'Estrategia de delegación: arquitectos analizan diseño, desarrolladores generan código con pruebas.',
      metadata: { category: 'orchestration', confidence: 0.98 },
      createdAt: new Date().toISOString(),
    },
  ],
  'agent-architect': [
    {
      id: 'mem-seed-2',
      agentId: 'agent-architect',
      content: 'Arquitectura Zero-Trust: todo comando de modificación MCP requiere confirmación humana obligatoria.',
      metadata: { category: 'security', confidence: 0.99 },
      createdAt: new Date().toISOString(),
    },
  ],
};

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

  async getMemories(agentId: string): Promise<AgentMemoryItem[]> {
    if (isMockMode()) {
      return structuredClone(mockMemories[agentId] || []);
    }
    return apiClient<AgentMemoryItem[]>(`/agents/${agentId}/memories`);
  },

  async addMemory(agentId: string, content: string, metadata?: Record<string, any>): Promise<AgentMemoryItem> {
    if (isMockMode()) {
      const item: AgentMemoryItem = {
        id: `mem-${Date.now()}`,
        agentId,
        content,
        metadata: metadata || { category: 'manual' },
        createdAt: new Date().toISOString(),
      };
      if (!mockMemories[agentId]) mockMemories[agentId] = [];
      mockMemories[agentId].unshift(item);
      return structuredClone(item);
    }
    return apiClient<AgentMemoryItem>(`/agents/${agentId}/memories`, {
      method: 'POST',
      body: JSON.stringify({ content, metadata }),
    });
  },

  async searchMemories(agentId: string, query: string, limit = 5): Promise<AgentMemoryItem[]> {
    if (isMockMode()) {
      const list = mockMemories[agentId] || [];
      const q = query.toLowerCase();
      return list
        .filter((m) => m.content.toLowerCase().includes(q) || (m.metadata?.category || '').includes(q))
        .map((m) => ({ ...m, similarity: 0.85 + Math.random() * 0.14 }))
        .slice(0, limit);
    }
    return apiClient<AgentMemoryItem[]>(`/agents/${agentId}/memories/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  },

  async deleteMemory(agentId: string, memoryId: string): Promise<{ success: boolean }> {
    if (isMockMode()) {
      if (mockMemories[agentId]) {
        mockMemories[agentId] = mockMemories[agentId].filter((m) => m.id !== memoryId);
      }
      return { success: true };
    }
    return apiClient<{ success: boolean }>(`/agents/${agentId}/memories/${memoryId}`, {
      method: 'DELETE',
    });
  },
};
