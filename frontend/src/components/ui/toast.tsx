import React from 'react';
import { useToastStore } from '@/stores/toast.store';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-[12px] border bg-bg-card/95 shadow-2xl backdrop-blur-md text-caption animate-in slide-in-from-bottom-2 duration-150 border-border-default"
        >
          {t.type === 'success' && <CheckCircle2 className="h-4 w-4 text-fg-success shrink-0 mt-0.5" />}
          {t.type === 'error' && <AlertCircle className="h-4 w-4 text-fg-error shrink-0 mt-0.5" />}
          {t.type === 'warning' && <AlertTriangle className="h-4 w-4 text-fg-warning shrink-0 mt-0.5" />}
          {t.type === 'info' && <Info className="h-4 w-4 text-fg-brand shrink-0 mt-0.5" />}

          <div className="flex-1 space-y-0.5">
            <p className="font-[510] text-fg-primary">{t.title}</p>
            {t.description && <p className="text-fg-secondary text-caption">{t.description}</p>}
          </div>

          <button
            onClick={() => removeToast(t.id)}
            className="text-fg-secondary hover:text-[#ffffff] p-0.5 rounded cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};

