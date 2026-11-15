import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { Shield, Lock, Mail, ArrowRight, Bot, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, setDemoUser, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('admin@agenthub.dev');
  const [password, setPassword] = useState('admin123');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      navigate('/');
    }
  };

  const handleQuickLogin = (role: 'admin' | 'developer' | 'viewer') => {
    setDemoUser(role);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-bg-surface flex flex-col justify-center items-center p-4">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-fg-brand/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20 mb-3">
            <Bot className="h-6 w-6 text-fg-primary" />
          </div>
          <h1 className="text-title font-bold text-fg-primary tracking-tight">AgentHub Platform</h1>
          <p className="text-caption text-fg-secondary mt-1">
            Orquestación multi-agente Zero-Trust y seguridad RBAC
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border-default bg-bg-card p-6 shadow-2xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border-default">
            <div>
              <h2 className="text-subtitle font-semibold text-fg-primary">Iniciar Sesión</h2>
              <p className="text-caption text-fg-secondary">Accede a la consola de control</p>
            </div>
            <Badge variant="outline" className="border-border-brand text-fg-brand text-caption">
              RBAC v1.0
            </Badge>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-bg-error-subtle border border-border-error/40 text-caption text-fg-error flex items-start justify-between">
              <span>{error}</span>
              <button onClick={clearError} className="text-fg-secondary hover:text-fg-primary cursor-pointer">
                ×
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-caption font-medium text-fg-secondary mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-secondary" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@agenthub.dev"
                  className="w-full rounded-lg border border-border-default bg-bg-surface pl-10 pr-3 py-2 text-body text-fg-primary focus:border-border-brand focus:outline-none placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-caption font-medium text-fg-secondary mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-secondary" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-border-default bg-bg-surface pl-10 pr-3 py-2 text-body text-fg-primary focus:border-border-brand focus:outline-none placeholder:text-slate-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-bg-brand py-2.5 px-4 text-body font-semibold text-fg-primary hover:bg-violet-500 transition-colors cursor-pointer shadow-md shadow-violet-600/30 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Autenticando...</span>
              ) : (
                <>
                  <span>Ingresar a la Plataforma</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access */}
          <div className="mt-6 pt-5 border-t border-border-default">
            <p className="text-caption font-medium text-fg-secondary mb-2.5 text-center">
              Acceso Rápido por Perfil (Demo & Desarrollo):
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="p-2 rounded-lg border border-border-brand/40 bg-bg-brand-subtle hover:bg-bg-brand-subtle/80 text-center transition-colors cursor-pointer"
              >
                <div className="text-caption font-bold text-fg-brand">Admin</div>
                <div className="text-[11px] text-fg-secondary">Control Total</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('developer')}
                className="p-2 rounded-lg border border-border-default bg-bg-surface hover:bg-slate-800 text-center transition-colors cursor-pointer"
              >
                <div className="text-caption font-bold text-fg-primary">Developer</div>
                <div className="text-[11px] text-fg-secondary">Agentes & MCP</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('viewer')}
                className="p-2 rounded-lg border border-border-default bg-bg-surface hover:bg-slate-800 text-center transition-colors cursor-pointer"
              >
                <div className="text-caption font-bold text-slate-400">Viewer</div>
                <div className="text-[11px] text-fg-secondary">Solo Auditoría</div>
              </button>
            </div>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="flex items-center justify-center gap-2 mt-6 text-caption text-fg-secondary">
          <Shield className="h-3.5 w-3.5 text-fg-success" />
          <span>Autenticación firmada con HMAC-SHA256 y cifrado AES-256-GCM</span>
        </div>
      </div>
    </div>
  );
};
