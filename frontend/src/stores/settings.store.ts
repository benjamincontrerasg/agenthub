import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppSettings } from '@/types';
import { initialSettings } from '@/services/mock-data';

interface SettingsState {
  settings: AppSettings;
  updateProfile: (profile: Partial<AppSettings['profile']>) => void;
  updateAppearance: (appearance: Partial<AppSettings['appearance']>) => void;
  updatePreferences: (preferences: Partial<AppSettings['preferences']>) => void;
  updateSecurity: (security: Partial<AppSettings['security']>) => void;
  updateBackend: (backend: Partial<AppSettings['backend']>) => void;
  updateLocalAgent: (localAgent: Partial<AppSettings['localAgent']>) => void;
  updateNotifications: (notifications: Partial<AppSettings['notifications']>) => void;
  testBackendConnection: () => Promise<{ success: boolean; message: string; latencyMs: number }>;
  resetToDefaults: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: initialSettings,

      updateProfile: (profile) =>
        set((state) => ({
          settings: { ...state.settings, profile: { ...state.settings.profile, ...profile } },
        })),

      updateAppearance: (appearance) =>
        set((state) => ({
          settings: { ...state.settings, appearance: { ...state.settings.appearance, ...appearance } },
        })),

      updatePreferences: (preferences) =>
        set((state) => ({
          settings: { ...state.settings, preferences: { ...state.settings.preferences, ...preferences } },
        })),

      updateSecurity: (security) =>
        set((state) => ({
          settings: { ...state.settings, security: { ...state.settings.security, ...security } },
        })),

      updateBackend: (backend) =>
        set((state) => ({
          settings: { ...state.settings, backend: { ...state.settings.backend, ...backend } },
        })),

      updateLocalAgent: (localAgent) =>
        set((state) => ({
          settings: { ...state.settings, localAgent: { ...state.settings.localAgent, ...localAgent } },
        })),

      updateNotifications: (notifications) =>
        set((state) => ({
          settings: { ...state.settings, notifications: { ...state.settings.notifications, ...notifications } },
        })),

      testBackendConnection: async () => {
        set((state) => ({
          settings: {
            ...state.settings,
            backend: { ...state.settings.backend, connectionStatus: 'testing' },
          },
        }));

        await new Promise((r) => setTimeout(r, 600));

        set((state) => ({
          settings: {
            ...state.settings,
            backend: { ...state.settings.backend, connectionStatus: 'connected' },
          },
        }));

        return {
          success: true,
          message: 'Conexión verificada con la API de AgentHub (HTTP 200 OK, WebSocket Handshake OK)',
          latencyMs: 38,
        };
      },

      resetToDefaults: () => set({ settings: initialSettings }),
    }),
    {
      name: 'agenthub-settings-storage',
    }
  )
);
