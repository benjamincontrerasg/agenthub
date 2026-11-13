import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Agent, AgentRole } from '@/types';
import { initialAgents } from '@/services/mock-data';
import { generateId } from '@/lib/utils';

interface AgentsState {
  agents: Agent[];
  searchQuery: string;
  roleFilter: string;
  statusFilter: string;
  setSearchQuery: (query: string) => void;
  setRoleFilter: (role: string) => void;
  setStatusFilter: (status: string) => void;
  addAgent: (agentData: Omit<Agent, 'id' | 'createdAt' | 'updatedAt' | 'stats'>) => Agent;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  deleteAgent: (id: string) => void;
  toggleAgentStatus: (id: string) => void;
  getAgentById: (id: string) => Agent | undefined;
}

export const useAgentsStore = create<AgentsState>()(
  persist(
    (set, get) => ({
      agents: initialAgents,
      searchQuery: '',
      roleFilter: 'ALL',
      statusFilter: 'ALL',

      setSearchQuery: (query) => set({ searchQuery: query }),
      setRoleFilter: (role) => set({ roleFilter: role }),
      setStatusFilter: (status) => set({ statusFilter: status }),

      addAgent: (agentData) => {
        const newAgent: Agent = {
          ...agentData,
          id: generateId('agent'),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          stats: {
            totalRuns: 0,
            avgDurationSec: 0,
            totalTokens: 0,
            successRate: 100,
          },
        };

        set((state) => ({
          agents: [newAgent, ...state.agents],
        }));

        return newAgent;
      },

      updateAgent: (id, updates) => {
        set((state) => ({
          agents: state.agents.map((agent) =>
            agent.id === id
              ? {
                  ...agent,
                  ...updates,
                  updatedAt: new Date().toISOString(),
                }
              : agent
          ),
        }));
      },

      deleteAgent: (id) => {
        set((state) => ({
          agents: state.agents.filter((agent) => agent.id !== id),
        }));
      },

      toggleAgentStatus: (id) => {
        set((state) => ({
          agents: state.agents.map((agent) =>
            agent.id === id
              ? {
                  ...agent,
                  status: agent.status === 'active' ? 'paused' : 'active',
                  updatedAt: new Date().toISOString(),
                }
              : agent
          ),
        }));
      },

      getAgentById: (id) => {
        return get().agents.find((a) => a.id === id);
      },
    }),
    {
      name: 'agenthub-agents-storage',
      partialize: (state) => ({ agents: state.agents }),
    }
  )
);

