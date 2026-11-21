import { describe, it, expect, beforeEach } from 'vitest';

const memoryStore: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => (key in memoryStore ? memoryStore[key] : null),
  setItem: (key: string, value: string) => {
    memoryStore[key] = String(value);
  },
  removeItem: (key: string) => {
    delete memoryStore[key];
  },
  clear: () => {
    for (const key of Object.keys(memoryStore)) {
      delete memoryStore[key];
    }
  },
  get length() {
    return Object.keys(memoryStore).length;
  },
  key: (i: number) => Object.keys(memoryStore)[i] ?? null,
};

if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
  });
}

import { useNotificationsStore } from '../notifications.store';

describe('Notifications Store', () => {
  beforeEach(() => {
    useNotificationsStore.setState({
      notifications: [
        {
          id: 'test-notif-1',
          title: 'Notificación 1',
          message: 'Mensaje de prueba 1',
          severity: 'info',
          category: 'workflow',
          timestamp: new Date().toISOString(),
          read: false,
        },
        {
          id: 'test-notif-2',
          title: 'Notificación 2',
          message: 'Mensaje de prueba 2',
          severity: 'warning',
          category: 'security',
          timestamp: new Date().toISOString(),
          read: true,
        },
      ],
      unreadCount: 1,
      isPanelOpen: false,
      filter: 'all',
    });
  });

  it('permite agregar una nueva notificación y actualiza unreadCount', () => {
    const store = useNotificationsStore.getState();
    store.addNotification({
      title: 'Workflow Iniciado',
      message: 'El workflow ha comenzado',
      severity: 'info',
      category: 'workflow',
    });

    const state = useNotificationsStore.getState();
    expect(state.notifications.length).toBe(3);
    expect(state.unreadCount).toBe(2);
    expect(state.notifications[0].title).toBe('Workflow Iniciado');
    expect(state.notifications[0].read).toBe(false);
  });

  it('permite marcar una notificación como leída y disminuye unreadCount', () => {
    useNotificationsStore.getState().markAsRead('test-notif-1');
    const state = useNotificationsStore.getState();
    const target = state.notifications.find((n) => n.id === 'test-notif-1');
    expect(target?.read).toBe(true);
    expect(state.unreadCount).toBe(0);
  });

  it('permite marcar todas las notificaciones como leídas', () => {
    useNotificationsStore.getState().addNotification({
      title: 'Alerta 3',
      message: 'Mensaje',
      severity: 'error',
      category: 'security',
    });
    expect(useNotificationsStore.getState().unreadCount).toBe(2);

    useNotificationsStore.getState().markAllAsRead();
    const state = useNotificationsStore.getState();
    expect(state.unreadCount).toBe(0);
    expect(state.notifications.every((n) => n.read)).toBe(true);
  });

  it('permite eliminar una notificación individual', () => {
    useNotificationsStore.getState().removeNotification('test-notif-1');
    const state = useNotificationsStore.getState();
    expect(state.notifications.length).toBe(1);
    expect(state.unreadCount).toBe(0);
  });

  it('permite vaciar todas las notificaciones', () => {
    useNotificationsStore.getState().clearAll();
    const state = useNotificationsStore.getState();
    expect(state.notifications.length).toBe(0);
    expect(state.unreadCount).toBe(0);
  });

  it('permite cambiar el filtro de categoría', () => {
    useNotificationsStore.getState().setFilter('security');
    expect(useNotificationsStore.getState().filter).toBe('security');
  });
});
