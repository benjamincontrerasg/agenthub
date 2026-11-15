import React, { useEffect, useRef, useState } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, XCircle, FileCode2, Terminal, Info } from 'lucide-react';
import { ToolApprovalRequest } from '@/types';

interface ToolApprovalModalProps {
  request: ToolApprovalRequest | null;
  isOpen: boolean;
  onRespond: (approvalId: string, approved: boolean, rememberForSession?: boolean) => void;
  onClose: () => void;
}

export const ToolApprovalModal: React.FC<ToolApprovalModalProps> = ({
  request,
  isOpen,
  onRespond,
  onClose,
}) => {
  const [rememberForSession, setRememberForSession] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const approveButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap y soporte de teclado (Escape)
  useEffect(() => {
    if (!isOpen || !request) return;

    setRememberForSession(false);

    // Enfocar botón principal
    const timer = setTimeout(() => {
      approveButtonRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, request, onClose]);

  if (!isOpen || !request) return null;

  const isDestructive = request.riskLevel === 'destructive';
  const isWrite = request.riskLevel === 'write';

  const handleApprove = () => {
    onRespond(request.approvalId, true, isWrite ? rememberForSession : false);
  };

  const handleReject = () => {
    onRespond(request.approvalId, false, false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <div
        ref={modalRef}
        className={`relative w-full max-w-xl rounded-2xl border p-6 shadow-2xl transition-all ${
          isDestructive
            ? 'bg-surface-elevated border-status-danger/40 ring-1 ring-status-danger/30'
            : isWrite
            ? 'bg-surface-elevated border-status-warning/40 ring-1 ring-status-warning/30'
            : 'bg-surface-elevated border-border-subtle'
        }`}
      >
        {/* Header con Badge de Riesgo Zero-Trust */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl flex items-center justify-center ${
                isDestructive
                  ? 'bg-status-danger/10 text-status-danger'
                  : isWrite
                  ? 'bg-status-warning/10 text-status-warning'
                  : 'bg-status-success/10 text-status-success'
              }`}
            >
              {isDestructive ? (
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              ) : isWrite ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <CheckCircle2 className="w-6 h-6" />
              )}
            </div>
            <div>
              <span
                className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full uppercase tracking-wider mb-1 ${
                  isDestructive
                    ? 'bg-status-danger/15 text-status-danger border border-status-danger/30'
                    : isWrite
                    ? 'bg-status-warning/15 text-status-warning border border-status-warning/30'
                    : 'bg-status-success/15 text-status-success border border-status-success/30'
                }`}
              >
                {isDestructive
                  ? 'Riesgo Crítico / Destructivo'
                  : isWrite
                  ? 'Operación de Modificación (Write)'
                  : 'Solo Lectura (Read)'}
              </span>
              <h3 id="modal-title" className="text-lg font-bold text-fg-primary">
                Confirmación de Seguridad Zero-Trust
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-fg-muted hover:text-fg-primary p-1 rounded-lg hover:bg-surface transition-colors"
            aria-label="Cerrar modal (Escape)"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Descripción general */}
        <p id="modal-description" className="text-sm text-fg-secondary mb-4">
          El agente <strong className="text-fg-primary font-semibold">{request.agentName}</strong> ha solicitado
          ejecutar la herramienta <code className="px-1.5 py-0.5 rounded bg-surface border border-border-subtle font-mono text-xs text-brand-secondary">{request.toolName}</code>.
        </p>

        {/* Ruta afectada si aplica */}
        {request.affectedPath && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-surface border border-border-subtle text-xs">
            <FileCode2 className="w-4 h-4 text-brand-secondary shrink-0" />
            <span className="text-fg-muted">Ruta de archivo objetivo:</span>
            <code className="text-fg-primary font-mono font-medium truncate">{request.affectedPath}</code>
          </div>
        )}

        {/* Argumentos de la herramienta */}
        <div className="mb-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-fg-muted mb-1.5">
            <Terminal className="w-3.5 h-3.5" />
            <span>Argumentos y parámetros solicitados:</span>
          </div>
          <pre className="max-h-48 overflow-y-auto rounded-lg bg-black/40 border border-border-subtle p-3 text-xs font-mono text-fg-primary select-all">
            {JSON.stringify(request.toolArgs, null, 2)}
          </pre>
        </div>

        {/* Opción de recordar para la sesión */}
        {isWrite ? (
          <div className="mb-5 flex items-start gap-2.5 p-3 rounded-lg bg-surface border border-border-subtle">
            <input
              type="checkbox"
              id="remember-session"
              checked={rememberForSession}
              onChange={(e) => setRememberForSession(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border-subtle text-brand-primary focus:ring-brand-primary"
            />
            <label htmlFor="remember-session" className="text-xs text-fg-secondary cursor-pointer">
              <strong className="text-fg-primary font-medium">Recordar autorización en esta sesión</strong>
              <p className="text-fg-muted mt-0.5">
                No volver a solicitar confirmación para la herramienta <code className="font-mono text-[11px]">{request.toolName}</code> durante la sesión activa.
              </p>
            </label>
          </div>
        ) : isDestructive ? (
          <div className="mb-5 flex items-center gap-2 p-2.5 rounded-lg bg-status-danger/10 border border-status-danger/20 text-xs text-status-danger">
            <Info className="w-4 h-4 shrink-0" />
            <span>Por política Zero-Trust, las operaciones destructivas no admiten omisión ni persistencia de sesión.</span>
          </div>
        ) : null}

        {/* Acciones */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-border-subtle">
          <button
            type="button"
            onClick={handleReject}
            className="px-4 py-2 rounded-xl text-sm font-medium text-fg-primary hover:bg-surface border border-border-subtle transition-all"
          >
            Rechazar y Bloquear
          </button>
          <button
            ref={approveButtonRef}
            type="button"
            onClick={handleApprove}
            className={`px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isDestructive
                ? 'bg-status-danger hover:bg-status-danger/90 text-white focus:ring-status-danger'
                : 'bg-brand-primary hover:bg-brand-primary/90 text-white focus:ring-brand-primary'
            }`}
          >
            Autorizar Ejecución
          </button>
        </div>
      </div>
    </div>
  );
};
