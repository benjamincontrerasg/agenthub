import { create } from 'zustand';
import { AIProvider } from '@/types';

// Limpieza única de la clave heredada de localStorage para que no interfiera con el backend real
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    window.localStorage.removeItem('NEXORA-providers-storage');
  } catch {
    // Entornos donde localStorage está restringido o no disponible
  }
}

interface ProvidersUIState {
  activeProviderModal: AIProvider | null;
  setActiveProviderModal: (provider: AIProvider | null) => void;
}

export const useProvidersStore = create<ProvidersUIState>((set) => ({
  activeProviderModal: null,
  setActiveProviderModal: (provider) => set({ activeProviderModal: provider }),
}));
