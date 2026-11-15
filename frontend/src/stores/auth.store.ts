import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  setDemoUser: (role: 'admin' | 'developer' | 'viewer') => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: {
        id: 'usr-admin-default',
        email: 'admin@NEXORA.dev',
        name: 'Administrador SecOps',
        role: 'admin',
        organizationId: 'org-default',
      },
      token: 'jwt-dev-token-default-admin',
      isAuthenticated: true,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch('http://localhost:3001/auth/login', {
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
        } catch (err: any) {
          // Fallback offline / desarrollo
          if (email === 'admin@NEXORA.dev' && password === 'admin123') {
            const mockUser: AuthUser = {
              id: 'usr-admin-default',
              email: 'admin@NEXORA.dev',
              name: 'Administrador SecOps',
              role: 'admin',
            };
            const mockToken = 'jwt-dev-token-default-admin';
            if (typeof window !== 'undefined') {
              localStorage.setItem('NEXORA-token', mockToken);
            }
            set({
              user: mockUser,
              token: mockToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return true;
          }

          set({ isLoading: false, error: err.message || 'Error al conectar con el servidor de autenticación' });
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

      setDemoUser: (role: 'admin' | 'developer' | 'viewer') => {
        const rolesMap: Record<string, AuthUser> = {
          admin: {
            id: 'usr-admin-default',
            email: 'admin@NEXORA.dev',
            name: 'Administrador SecOps',
            role: 'admin',
          },
          developer: {
            id: 'usr-dev-01',
            email: 'dev@NEXORA.dev',
            name: 'Ingeniero de Agentes',
            role: 'developer',
          },
          viewer: {
            id: 'usr-viewer-01',
            email: 'auditor@NEXORA.dev',
            name: 'Auditor Externo',
            role: 'viewer',
          },
        };

        const u = rolesMap[role] || rolesMap.admin;
        set({
          user: u,
          token: `jwt-dev-token-${role}`,
          isAuthenticated: true,
        });
        if (typeof window !== 'undefined') {
          localStorage.setItem('NEXORA-token', `jwt-dev-token-${role}`);
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'NEXORA-auth-storage',
    }
  )
);
