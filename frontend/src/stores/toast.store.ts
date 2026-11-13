import { create } from 'zustand';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  duration?: number;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: ({ title, description, type = 'info', duration = 3500 }) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    set((state) => ({ toasts: [...state.toasts, { id, title, description, type, duration }] }));

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      }, duration);
    }
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (title: string, description?: string) =>
    useToastStore.getState().addToast({ title, description, type: 'success' }),
  error: (title: string, description?: string) =>
    useToastStore.getState().addToast({ title, description, type: 'error' }),
  warning: (title: string, description?: string) =>
    useToastStore.getState().addToast({ title, description, type: 'warning' }),
  info: (title: string, description?: string) =>
    useToastStore.getState().addToast({ title, description, type: 'info' }),
};

