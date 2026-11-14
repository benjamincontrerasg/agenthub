import { AIProvider, ProviderId } from '@/types';
import { initialProviders } from '@/services/mock-data';
import { apiClient } from '@/services/api';

let mockProviders: AIProvider[] = structuredClone(initialProviders);
let mockModeOverride: boolean | null = null;

export const isMockMode = (): boolean => {
  if (mockModeOverride !== null) return mockModeOverride;
  return import.meta.env.VITE_USE_MOCK !== 'false';
};

export const setMockMode = (enabled: boolean | null) => {
  mockModeOverride = enabled;
};

export const resetMockProviders = () => {
  mockProviders = structuredClone(initialProviders);
};

export const providersService = {
  async getProviders(): Promise<AIProvider[]> {
    if (isMockMode()) {
      return structuredClone(mockProviders);
    }
    return apiClient<AIProvider[]>('/providers');
  },

  async getProviderById(id: ProviderId): Promise<AIProvider> {
    if (isMockMode()) {
      const found = mockProviders.find((p) => p.id === id);
      if (!found) throw new Error(`Proveedor '${id}' no encontrado`);
      return structuredClone(found);
    }
    return apiClient<AIProvider>(`/providers/${id}`);
  },

  async connectProvider(
    id: ProviderId,
    apiKey: string,
    defaultModelId?: string
  ): Promise<{ success: boolean; message: string }> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 100));
      const target = mockProviders.find((p) => p.id === id);
      if (!target) throw new Error(`Proveedor '${id}' no encontrado`);

      target.status = 'connected';
      target.hasApiKey = true;
      target.lastTested = new Date().toISOString();
      target.latencyMs = Math.floor(Math.random() * 80) + 40;

      if (defaultModelId) {
        target.defaultModelId = defaultModelId;
        target.models = target.models.map((m) => ({
          ...m,
          isDefault: m.id === defaultModelId,
        }));
      }

      return {
        success: true,
        message: `Proveedor ${target.name} conectado correctamente (Modo Simulación).`,
      };
    }

    return apiClient<{ success: boolean; message: string }>(`/providers/${id}/connect`, {
      method: 'POST',
      body: JSON.stringify({ apiKey, defaultModelId }),
    });
  },

  async disconnectProvider(id: ProviderId): Promise<{ success: boolean; message: string }> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 100));
      const target = mockProviders.find((p) => p.id === id);
      if (!target) throw new Error(`Proveedor '${id}' no encontrado`);

      target.status = 'disconnected';
      target.hasApiKey = false;
      delete target.latencyMs;
      delete target.lastTested;

      return {
        success: true,
        message: `Proveedor ${target.name} desconectado correctamente (Modo Simulación).`,
      };
    }

    return apiClient<{ success: boolean; message: string }>(`/providers/${id}/credentials`, {
      method: 'DELETE',
    });
  },

  async setDefaultModel(id: ProviderId, defaultModelId: string): Promise<{ success: boolean; message: string }> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 100));
      const target = mockProviders.find((p) => p.id === id);
      if (!target) throw new Error(`Proveedor '${id}' no encontrado`);

      target.defaultModelId = defaultModelId;
      target.models = target.models.map((m) => ({
        ...m,
        isDefault: m.id === defaultModelId,
      }));

      return {
        success: true,
        message: `Modelo predeterminado actualizado para ${target.name}.`,
      };
    }

    return apiClient<{ success: boolean; message: string }>(`/providers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ defaultModelId }),
    });
  },

  async testConnection(id: ProviderId): Promise<{ success: boolean; latencyMs: number; message: string }> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 100));
      const target = mockProviders.find((p) => p.id === id);
      const latency = Math.floor(Math.random() * 80) + 40;
      if (target) {
        target.latencyMs = latency;
        target.lastTested = new Date().toISOString();
        target.status = 'connected';
      }
      return {
        success: true,
        latencyMs: latency,
        message: 'Ping de conexión completado satisfactoriamente.',
      };
    }

    return apiClient<{ success: boolean; latencyMs: number; message: string }>(`/providers/${id}/test`, {
      method: 'POST',
    });
  },
};
