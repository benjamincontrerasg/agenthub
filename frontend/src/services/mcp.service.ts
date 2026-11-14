import { MCPServer } from '@/types';
import { initialMCPServers } from '@/services/mock-data';
import { apiClient } from '@/services/api';

let mockServers: MCPServer[] = structuredClone(initialMCPServers);
let mockModeOverride: boolean | null = null;

export const isMockMode = (): boolean => {
  if (mockModeOverride !== null) return mockModeOverride;
  return import.meta.env.VITE_USE_MOCK !== 'false';
};

export const setMockMode = (enabled: boolean | null) => {
  mockModeOverride = enabled;
};

export const resetMockServers = () => {
  mockServers = structuredClone(initialMCPServers);
};

export const mcpService = {
  async getServers(): Promise<MCPServer[]> {
    if (isMockMode()) {
      return structuredClone(mockServers);
    }
    return apiClient<MCPServer[]>('/mcp/servers');
  },

  async registerServer(payload: {
    name: string;
    description: string;
    transport: 'stdio' | 'streamable-http';
    commandOrEndpoint: string;
    args?: string[];
    env?: Record<string, string>;
    allowedDirectories?: string[];
  }): Promise<MCPServer> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 100));
      const server: MCPServer = {
        ...payload,
        id: `mcp-${Date.now()}`,
        status: 'pending_validation',
        isActivated: false,
        tools: [],
        logs: [
          {
            id: `log-${Date.now()}`,
            timestamp: new Date().toISOString(),
            level: 'info',
            message: 'Servidor registrado. Pendiente de validación.',
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockServers.push(server);
      return structuredClone(server);
    }

    return apiClient<MCPServer>('/mcp/servers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async validateServer(id: string): Promise<{ success: boolean; message: string }> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 300));
      const server = mockServers.find((s) => s.id === id);
      if (server) {
        server.status = 'connected';
        server.isActivated = true;
        server.logs.push({
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'Validación completada.',
        });
      }
      return { success: true, message: 'Validación MCP completada con éxito.' };
    }

    return apiClient<{ success: boolean; message: string }>(`/mcp/servers/${id}/validate`, {
      method: 'POST',
    });
  },

  async toggleActivation(id: string, active: boolean): Promise<{ success: boolean }> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 100));
      const server = mockServers.find((s) => s.id === id);
      if (server) {
        server.isActivated = active;
        server.status = active ? 'connected' : 'disconnected';
      }
      return { success: true };
    }

    return apiClient<{ success: boolean }>(`/mcp/servers/${id}/activation`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    });
  },

  async deleteServer(id: string): Promise<{ success: boolean }> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 100));
      const idx = mockServers.findIndex((s) => s.id === id);
      if (idx !== -1) {
        mockServers.splice(idx, 1);
      }
      return { success: true };
    }

    return apiClient<{ success: boolean }>(`/mcp/servers/${id}`, {
      method: 'DELETE',
    });
  },
};
