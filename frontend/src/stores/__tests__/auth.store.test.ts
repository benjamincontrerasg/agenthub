import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../auth.store';

describe('PASO 5 — Auth Store & Protección Frontend', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
    vi.restoreAllMocks();
  });

  it('inicia sin sesión activa por defecto (no asume usuario ni rol admin falso)', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });

  it('no crea un token ni usuario admin falso cuando el backend falla (elimina fallback offline)', async () => {
    // Simular error de red o backend no disponible
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const success = await useAuthStore.getState().login('admin@nexora.dev', 'admin123');

    expect(success).toBe(false);
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.error).toContain('No se pudo conectar');
  });

  it('establece la sesión y token real cuando el backend responde 200 OK', async () => {
    const mockUser = {
      id: 'usr-1',
      email: 'admin@nexora.dev',
      name: 'Admin',
      role: 'admin' as const,
    };
    const mockToken = 'mock-valid-jwt-token';

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ user: mockUser, token: mockToken }),
    }));

    const success = await useAuthStore.getState().login('admin@nexora.dev', 'admin123');

    expect(success).toBe(true);
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.email).toBe('admin@nexora.dev');
    expect(state.token).toBe(mockToken);
    expect(state.error).toBeNull();
  });

  it('logout limpia completamente la sesión y el token', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      token: 'some-token',
      user: {
        id: 'usr-1',
        email: 'test@nexora.dev',
        name: 'Tester',
        role: 'viewer',
      },
    });

    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });
});
