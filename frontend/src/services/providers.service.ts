import { AIProvider, ProviderId } from '@/types';
import { initialProviders } from '@/services/mock-data';
import { apiClient } from '@/services/api';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

export const providersService = {
  async getProviders(): Promise<AIProvider[]> {
    if (USE_MOCK) {
      return initialProviders;
    }
    return apiClient<AIProvider[]>('/providers');
  },

  async getProviderById(id: ProviderId): Promise<AIProvider> {
    if (USE_MOCK) {
      const found = initialProviders.find((p) => p.id === id);
      if (!found) throw new Error('Proveedor no encontrado');
      return found;
    }
    return apiClient<AIProvider>(`/providers/${id}`);
  },

  async connectProvider(id: ProviderId, apiKey: string, defaultModelId?: string): Promise<{ success: boolean; message: string }> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 600));
      return { success: true, message: 'Proveedor conectado correctamente (Modo Simulación).' };
    }
    return apiClient<{ success: boolean; message: string }>(`/providers/${id}/connect`, {
      method: 'POST',
      body: JSON.stringify({ apiKey, defaultModelId }),
    });
  },

  async testConnection(id: ProviderId): Promise<{ success: boolean; latencyMs: number; message: string }> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 500));
      return {
        success: true,
        latencyMs: Math.floor(Math.random() * 80) + 40,
        message: 'Ping de conexión completado satisfactoriamente.',
      };
    }
    return apiClient<{ success: boolean; latencyMs: number; message: string }>(`/providers/${id}/test`, {
      method: 'POST',
    });
  },
};
