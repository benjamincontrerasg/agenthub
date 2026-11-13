import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MCPServer, MCPTool } from '@/types';
import { initialMCPServers } from '@/services/mock-data';
import { generateId } from '@/lib/utils';

interface MCPState {
  servers: MCPServer[];
  selectedServerId: string | null;
  searchQuery: string;
  setSelectedServerId: (id: string | null) => void;
  setSearchQuery: (q: string) => void;
  addServer: (serverData: {
    name: string;
    description: string;
    transport: 'stdio' | 'streamable-http';
    commandOrEndpoint: string;
    args?: string[];
    env?: Record<string, string>;
    allowedDirectories?: string[];
  }) => MCPServer;
  toggleServerActivation: (id: string) => void;
  validateServer: (id: string) => Promise<{ success: boolean; message: string }>;
  deleteServer: (id: string) => void;
  assignToolToAgent: (toolId: string, agentId: string) => void;
  removeToolFromAgent: (toolId: string, agentId: string) => void;
  getAllTools: () => MCPTool[];
}

export const useMCPStore = create<MCPState>()(
  persist(
    (set, get) => ({
      servers: initialMCPServers,
      selectedServerId: 'mcp-filesystem',
      searchQuery: '',

      setSelectedServerId: (id) => set({ selectedServerId: id }),
      setSearchQuery: (q) => set({ searchQuery: q }),

      addServer: (serverData) => {
        const newServerId = generateId('mcp');
        const defaultTool: MCPTool = {
          id: generateId('tool'),
          serverId: newServerId,
          serverName: serverData.name,
          name: 'execute_command',
          description: `Herramienta registrada automáticamente para ${serverData.name}`,
          isWriteOperation: false,
          requiresApproval: false,
          assignedAgentIds: ['agent-developer'],
          inputSchema: {
            type: 'object',
            properties: {
              param: { name: 'param', type: 'string', description: 'Parámetro de ejecución' },
            },
          },
        };

        const newServer: MCPServer = {
          ...serverData,
          id: newServerId,
          status: 'pending_validation',
          isActivated: false,
          tools: [defaultTool],
          logs: [
            {
              id: generateId('log'),
              timestamp: new Date().toISOString(),
              level: 'info',
              message: 'Servidor registrado en modo seguro. Pendiente de validación de conexión.',
            },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          servers: [...state.servers, newServer],
          selectedServerId: newServerId,
        }));

        return newServer;
      },

      toggleServerActivation: (id) => {
        set((state) => ({
          servers: state.servers.map((s) => {
            if (s.id === id) {
              const nextActive = !s.isActivated;
              return {
                ...s,
                isActivated: nextActive,
                status: nextActive ? (s.status === 'pending_validation' ? 'pending_validation' : 'connected') : 'disconnected',
                updatedAt: new Date().toISOString(),
                logs: [
                  ...s.logs,
                  {
                    id: generateId('log'),
                    timestamp: new Date().toISOString(),
                    level: 'info',
                    message: nextActive ? 'Servidor activado por el usuario.' : 'Servidor desactivado.',
                  },
                ],
              };
            }
            return s;
          }),
        }));
      },

      validateServer: async (id) => {
        await new Promise((r) => setTimeout(r, 700));

        set((state) => ({
          servers: state.servers.map((s) => {
            if (s.id === id) {
              return {
                ...s,
                status: 'connected',
                isActivated: true,
                updatedAt: new Date().toISOString(),
                logs: [
                  ...s.logs,
                  {
                    id: generateId('log'),
                    timestamp: new Date().toISOString(),
                    level: 'info',
                    message: 'Handshake MCP completado. Esquema de herramientas validado.',
                  },
                ],
              };
            }
            return s;
          }),
        }));

        return {
          success: true,
          message: 'Servidor MCP verificado y conectado exitosamente.',
        };
      },

      deleteServer: (id) => {
        set((state) => ({
          servers: state.servers.filter((s) => s.id !== id),
          selectedServerId: state.selectedServerId === id ? (state.servers[0]?.id || null) : state.selectedServerId,
        }));
      },

      assignToolToAgent: (toolId, agentId) => {
        set((state) => ({
          servers: state.servers.map((server) => ({
            ...server,
            tools: server.tools.map((tool) => {
              if (tool.id === toolId && !tool.assignedAgentIds.includes(agentId)) {
                return {
                  ...tool,
                  assignedAgentIds: [...tool.assignedAgentIds, agentId],
                };
              }
              return tool;
            }),
          })),
        }));
      },

      removeToolFromAgent: (toolId, agentId) => {
        set((state) => ({
          servers: state.servers.map((server) => ({
            ...server,
            tools: server.tools.map((tool) => {
              if (tool.id === toolId) {
                return {
                  ...tool,
                  assignedAgentIds: tool.assignedAgentIds.filter((id) => id !== agentId),
                };
              }
              return tool;
            }),
          })),
        }));
      },

      getAllTools: () => {
        return get().servers.flatMap((s) => s.tools);
      },
    }),
    {
      name: 'agenthub-mcp-storage',
      partialize: (state) => ({ servers: state.servers }),
    }
  )
);

