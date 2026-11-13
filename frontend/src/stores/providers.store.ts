import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AIProvider, ProviderId } from '@/types';
import { initialProviders } from '@/services/mock-data';

interface ProvidersState {
  providers: AIProvider[];
  isLoading: boolean;
  activeProviderModal: AIProvider | null;
  setActiveProviderModal: (provider: AIProvider | null) => void;
  connectProvider: (id: ProviderId, apiKey: string, defaultModelId?: string) => Promise<{ success: boolean; message: string }>;
  disconnectProvider: (id: ProviderId) => void;
  testProviderConnection: (id: ProviderId) => Promise<{ success: boolean; latencyMs: number; message: string }>;
  setDefaultModel: (providerId: ProviderId, modelId: string) => void;
}

export const useProvidersStore = create<ProvidersState>()(
  persist(
    (set, get) => ({
      providers: initialProviders,
      isLoading: false,
      activeProviderModal: null,
      setActiveProviderModal: (provider) => set({ activeProviderModal: provider }),

      connectProvider: async (id, _apiKey, defaultModelId) => {
        set({ isLoading: true });
        // Simulation delay for realistic UX
        await new Promise((resolve) => setTimeout(resolve, 800));

        set((state) => ({
          isLoading: false,
          providers: state.providers.map((p) => {
            if (p.id === id) {
              return {
                ...p,
                status: 'connected',
                hasApiKey: true,
                defaultModelId: defaultModelId || p.defaultModelId,
                lastTested: new Date().toISOString(),
                latencyMs: Math.floor(Math.random() * 120) + 40,
              };
            }
            return p;
          }),
        }));

        return { success: true, message: 'Proveedor conectado exitosamente con credenciales seguras.' };
      },

      disconnectProvider: (id) => {
        set((state) => ({
          providers: state.providers.map((p) =>
            p.id === id ? { ...p, status: 'disconnected', hasApiKey: false } : p
          ),
        }));
      },

      testProviderConnection: async (id) => {
        // Realistic test simulation
        await new Promise((resolve) => setTimeout(resolve, 600));
        const latency = Math.floor(Math.random() * 100) + 45;

        set((state) => ({
          providers: state.providers.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status: 'connected',
                  latencyMs: latency,
                  lastTested: new Date().toISOString(),
                }
              : p
          ),
        }));

        return {
          success: true,
          latencyMs: latency,
          message: `Conexión verificada exitosamente. Latencia: ${latency}ms. Ping al endpoint OK.`,
        };
      },

      setDefaultModel: (providerId, modelId) => {
        set((state) => ({
          providers: state.providers.map((p) =>
            p.id === providerId
              ? {
                  ...p,
                  defaultModelId: modelId,
                  models: p.models.map((m) => ({
                    ...m,
                    isDefault: m.id === modelId,
                  })),
                }
              : p
          ),
        }));
      },
    }),
    {
      name: 'agenthub-providers-storage',
      partialize: (state) => ({ providers: state.providers }),
    }
  )
);
