import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error';
export type NotificationCategory = 
  | 'workflow' 
  | 'agent' 
  | 'mcp' 
  | 'security' 
  | 'billing' 
  | 'system' 
  | 'approval';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  category: NotificationCategory;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
}

interface NotificationsState {
  notifications: AppNotification[];
  unreadCount: number;
  isPanelOpen: boolean;
  filter: NotificationCategory | 'all';

  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  togglePanel: () => void;
  setFilter: (filter: NotificationCategory | 'all') => void;
}

const generateId = () => `notif-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

// Notificaciones iniciales de demostración
const initialNotifications: AppNotification[] = [
  {
    id: 'notif-init-1',
    title: 'Workflow completado exitosamente',
    message: 'El pipeline "CI/CD Dev Review" finalizó en 42s con código de salida 0. Todos los agentes reportaron éxito.',
    severity: 'success',
    category: 'workflow',
    timestamp: new Date(Date.now() - 3 * 60000).toISOString(),
    read: false,
    actionUrl: '/executions',
    actionLabel: 'Ver ejecución',
  },
  {
    id: 'notif-init-2',
    title: 'Aprobación requerida',
    message: 'Developer Agent solicita permiso para ejecutar fs-write en /src/components/. Revisión humana obligatoria.',
    severity: 'warning',
    category: 'approval',
    timestamp: new Date(Date.now() - 8 * 60000).toISOString(),
    read: false,
    actionUrl: '/chat',
    actionLabel: 'Revisar solicitud',
  },
  {
    id: 'notif-init-3',
    title: 'MCP Server conectado',
    message: 'Filesystem Server respondió al health check en 23ms. 5 herramientas disponibles.',
    severity: 'info',
    category: 'mcp',
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    read: false,
    actionUrl: '/mcp',
    actionLabel: 'Ver servidor',
  },
  {
    id: 'notif-init-4',
    title: 'Alerta de seguridad Zero-Trust',
    message: 'Se detectó un intento de ejecución de herramienta sin aprobación previa. El evento fue bloqueado y registrado en auditoría.',
    severity: 'error',
    category: 'security',
    timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
    read: false,
    actionUrl: '/audit',
    actionLabel: 'Ver auditoría',
  },
  {
    id: 'notif-init-5',
    title: 'Agente Architect iniciado',
    message: 'El agente Architect Agent ha comenzado la ejecución del plan de diseño del módulo de autenticación.',
    severity: 'info',
    category: 'agent',
    timestamp: new Date(Date.now() - 35 * 60000).toISOString(),
    read: true,
    actionUrl: '/agents',
    actionLabel: 'Ver agente',
  },
  {
    id: 'notif-init-6',
    title: 'Facturación: próximo ciclo',
    message: 'Tu plan Pro se renueva en 7 días. Consumo actual: 2.4M tokens de 5M incluidos.',
    severity: 'info',
    category: 'billing',
    timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
    read: true,
    actionUrl: '/settings?tab=billing',
    actionLabel: 'Ver facturación',
  },
  {
    id: 'notif-init-7',
    title: 'Workflow falló',
    message: 'El pipeline "Data Analysis" falló en el nodo Reviewer Agent. Error: timeout de respuesta del proveedor OpenAI.',
    severity: 'error',
    category: 'workflow',
    timestamp: new Date(Date.now() - 90 * 60000).toISOString(),
    read: true,
    actionUrl: '/executions',
    actionLabel: 'Ver detalles',
  },
  {
    id: 'notif-init-8',
    title: 'Nuevo proveedor disponible',
    message: 'DeepSeek R1 ha sido agregado como proveedor. Configura tu API key para comenzar a usarlo.',
    severity: 'info',
    category: 'system',
    timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
    read: true,
    actionUrl: '/providers',
    actionLabel: 'Configurar',
  },
];

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      notifications: initialNotifications,
      unreadCount: initialNotifications.filter((n) => !n.read).length,
      isPanelOpen: false,
      filter: 'all',

      addNotification: (notification) => {
        const newNotif: AppNotification = {
          ...notification,
          id: generateId(),
          timestamp: new Date().toISOString(),
          read: false,
        };
        set((state) => ({
          notifications: [newNotif, ...state.notifications].slice(0, 100), // cap at 100
          unreadCount: state.unreadCount + 1,
        }));
      },

      markAsRead: (id) => {
        set((state) => {
          const target = state.notifications.find((n) => n.id === id);
          if (!target || target.read) return state;
          return {
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          };
        });
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },

      removeNotification: (id) => {
        set((state) => {
          const target = state.notifications.find((n) => n.id === id);
          return {
            notifications: state.notifications.filter((n) => n.id !== id),
            unreadCount: target && !target.read ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
          };
        });
      },

      clearAll: () => set({ notifications: [], unreadCount: 0 }),

      togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),

      setFilter: (filter) => set({ filter }),
    }),
    {
      name: 'NEXORA-notifications-storage',
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
      }),
    }
  )
);
