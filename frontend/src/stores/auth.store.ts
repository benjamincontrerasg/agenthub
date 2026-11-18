import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_BASE = rawApiUrl.replace(/\/v1\/?$/, '').replace(/\/+$/, '');

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'developer' | 'viewer';
  organizationId?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, _get) => ({
      // Estado inicial: SIN sesión (el usuario debe autenticarse)
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({ message: 'Error de autenticación' }));
            set({ isLoading: false, error: err.message || 'Credenciales inválidas' });
            return false;
          }

          const data = await res.json();
          if (typeof window !== 'undefined') {
            localStorage.setItem('NEXORA-token', data.token);
          }

          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          return true;
        } catch (_err: any) {
          // Sin fallback offline: si el backend no responde, mostrar error real
          set({
            isLoading: false,
            error: 'No se pudo conectar con el servidor de autenticación. Verifica que el backend esté corriendo.',
          });
          return false;
        }
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('NEXORA-token');
        }
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'NEXORA-auth-storage',
    }
  )
);
