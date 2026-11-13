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
          className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border bg-slate-900/95 shadow-2xl backdrop-blur-md text-xs animate-in slide-in-from-bottom-2 duration-150 border-slate-800"
        >
          {t.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />}
          {t.type === 'error' && <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />}
          {t.type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />}
          {t.type === 'info' && <Info className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />}

          <div className="flex-1 space-y-0.5">
            <p className="font-semibold text-white">{t.title}</p>
            {t.description && <p className="text-slate-400 text-[11px]">{t.description}</p>}
          </div>

          <button
            onClick={() => removeToast(t.id)}
            className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};

