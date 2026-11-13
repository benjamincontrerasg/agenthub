import { MCPServer } from '@/types';
import { initialMCPServers } from '@/services/mock-data';
import { apiClient } from '@/services/api';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

export const mcpService = {
  async getServers(): Promise<MCPServer[]> {
    if (USE_MOCK) {
      return initialMCPServers;
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
    if (USE_MOCK) {
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
      return server;
    }
    return apiClient<MCPServer>('/mcp/servers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async validateServer(id: string): Promise<{ success: boolean; message: string }> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 600));
      return { success: true, message: 'Validación MCP completada con éxito.' };
    }
    return apiClient<{ success: boolean; message: string }>(`/mcp/servers/${id}/validate`, {
      method: 'POST',
    });
  },

  async toggleActivation(id: string, active: boolean): Promise<{ success: boolean }> {
    if (USE_MOCK) {
      return { success: true };
    }
    return apiClient<{ success: boolean }>(`/mcp/servers/${id}/activation`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    });
  },
};

