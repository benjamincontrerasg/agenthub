import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  User,
  Shield,
  CheckCircle2,
  AlertTriangle,
  X,
  Bot,
  Wrench,
  GitFork,
  ArrowRight,
  LogOut,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useSettingsStore } from '@/stores/settings.store';
import { useAuthStore } from '@/stores/auth.store';
import { useAgents } from '@/features/agents/hooks';
import { useMCPStore } from '@/stores/mcp.store';
import { useWorkflows } from '@/features/workflows/hooks';

interface HeaderProps {
  onOpenMobile: () => void;
}

const sectionTitles: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Resumen operativo y acciones que requieren tu atención' },
  '/providers': { title: 'Proveedores de IA', subtitle: 'Conexión con Claude, OpenAI, Gemini y modelos locales' },
  '/agents': { title: 'Agentes Autónomos', subtitle: 'Equipos de IA con roles especializados y herramientas asignadas' },
  '/mcp': { title: 'MCP Hub', subtitle: 'Herramientas y capacidades externas que tus agentes pueden usar' },
  '/workflows': { title: 'Flujos de Trabajo', subtitle: 'Diseñador visual para conectar agentes en secuencia o paralelo' },
  '/chat': { title: 'Chat Multi-Agente', subtitle: 'Espacio de trabajo donde tus agentes colaboran y piden aprobación' },
  '/executions': { title: 'Centro de Ejecuciones', subtitle: 'Historial, trazabilidad y estado de tareas en tiempo real' },
  '/analytics': { title: 'Uso y Métricas', subtitle: 'Consumo de tokens, costos estimados y rendimiento de inferencia' },
  '/audit': { title: 'Auditoría Zero-Trust', subtitle: 'Trazabilidad inmutable de eventos, aprobaciones y cumplimiento' },
  '/settings': { title: 'Configuración', subtitle: 'Ajustes del sistema, seguridad y claves de cifrado' },
};

export const Header: React.FC<HeaderProps> = ({ onOpenMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { settings } = useSettingsStore();
  const { user, logout, setDemoUser } = useAuthStore();
  const { data: agents = [] } = useAgents();
  const { getAllTools } = useMCPStore();
  const { data: workflows = [] } = useWorkflows();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const allTools = getAllTools();

  // Listen to Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  const currentSection = sectionTitles[location.pathname] || {
    title: 'AgentHub Platform',
    subtitle: 'Enterprise Multi-Agent Orchestration',
  };

  const notifications = [
    {
      id: '1',
      title: 'Aprobación requerida',
      message: 'Developer Agent requiere autorización para escribir en disco local.',
      time: 'Hace 3m',
      type: 'warning',
      actionUrl: '/chat',
    },
    {
      id: '2',
      title: 'Pipeline completado',
      message: 'Autonomous Feature Pipeline finalizó con código 0.',
      time: 'Hace 12m',
      type: 'success',
      actionUrl: '/executions',
    },
    {
      id: '3',
      title: 'MCP Server verificado',
      message: 'Filesystem Server respondió al ping en 45ms.',
      time: 'Hace 25m',
      type: 'info',
      actionUrl: '/mcp',
    },
  ];

  // Filtered results
  const q = searchQuery.toLowerCase().trim();
  const matchedAgents = q ? agents.filter((a) => a.name.toLowerCase().includes(q) || a.role.toLowerCase().includes(q)) : [];
  const matchedTools = q ? allTools.filter((t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)) : [];
  const matchedWorkflows = q ? workflows.filter((w) => w.name.toLowerCase().includes(q) || w.description.toLowerCase().includes(q)) : [];

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border-default/80 bg-bg-card/85 px-4 sm:px-6 backdrop-blur-md">
      {/* Left: Mobile Toggle & Section Title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenMobile}
          aria-label="Abrir menú de navegación"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-default text-fg-secondary hover:bg-slate-900 hover:text-white lg:hidden cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-subtitle sm:text-lg font-bold tracking-tight text-fg-primary">
              {currentSection.title}
            </h1>
            <Badge variant="secondary" className="hidden sm:inline-flex text-caption py-0">
              v1.0-preview
            </Badge>
          </div>
          <p className="text-caption text-fg-secondary hidden md:block">
            {currentSection.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Search, Connection Status, Notifications, User */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Global Search Button */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center space-x-2 rounded-lg border border-border-default bg-bg-card/80 px-3 py-1.5 text-caption text-fg-secondary hover:border-slate-700 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <Search className="h-3.5 w-3.5 text-fg-secondary" />
          <span className="hidden sm:inline">Buscar agente, MCP o workflow...</span>
          <kbd className="hidden md:inline-flex rounded bg-bg-surface px-1.5 py-0.5 text-caption font-mono text-fg-secondary">
            ⌘K
          </kbd>
        </button>

        {/* Simulation Mode Compact Badge */}
        <div className="hidden sm:flex items-center space-x-1.5 rounded-lg border border-border-brand/40 bg-bg-brand-subtle px-2.5 py-1 text-caption">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-fg-brand opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-fg-brand"></span>
          </span>
          <span className="text-fg-brand font-medium">Modo Simulación</span>
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notificaciones del sistema"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border-default bg-bg-card/60 text-fg-secondary hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bg-brand opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-bg-brand"></span>
            </span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-border-default bg-bg-card p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-border-default">
                <span className="text-body font-semibold text-fg-primary">Notificaciones</span>
                <span className="rounded-full bg-bg-brand-subtle px-2 py-0.5 text-caption text-fg-brand font-mono">
                  3 nuevas
                </span>
              </div>
              <div className="mt-3 space-y-2.5 max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      setShowNotifications(false);
                      navigate(n.actionUrl);
                    }}
                    className="p-2.5 rounded-lg border border-border-default/80 bg-bg-card/60 hover:bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-caption font-semibold text-fg-primary flex items-center gap-1.5">
                        {n.type === 'warning' ? (
                          <AlertTriangle className="h-3 w-3 text-fg-warning" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3 text-fg-success" />
                        )}
                        {n.title}
                      </span>
                      <span className="text-caption text-fg-secondary">{n.time}</span>
                    </div>
                    <p className="mt-1 text-caption text-fg-secondary line-clamp-2">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 rounded-lg border border-border-default bg-bg-card/60 p-1.5 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-tr from-violet-600 to-indigo-600 text-caption font-bold text-fg-primary">
              {(user?.name || settings.profile.name).substring(0, 2).toUpperCase()}
            </div>
            <span className="hidden md:inline text-caption font-medium text-fg-primary max-w-[90px] truncate">
              {user?.name || settings.profile.name}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-fg-secondary" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-60 rounded-xl border border-border-default bg-bg-card p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-border-default">
                <div className="flex items-center justify-between">
                  <p className="text-caption font-semibold text-fg-primary">{user?.name || settings.profile.name}</p>
                  <Badge variant="outline" className="text-[10px] font-mono uppercase text-fg-brand border-border-brand/50">
                    {user?.role || 'admin'}
                  </Badge>
                </div>
                <p className="text-caption text-fg-secondary truncate">{user?.email || settings.profile.email}</p>
              </div>

              {/* Demo Role Switcher */}
              <div className="py-1.5 px-2 border-b border-border-default">
                <span className="text-[11px] font-medium text-fg-secondary uppercase block mb-1">Cambiar Rol RBAC</span>
                <div className="grid grid-cols-3 gap-1">
                  {(['admin', 'developer', 'viewer'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setDemoUser(r)}
                      className={`px-1.5 py-0.5 rounded text-[11px] font-medium cursor-pointer transition-colors ${
                        (user?.role || 'admin') === r
                          ? 'bg-bg-brand text-fg-primary font-bold'
                          : 'bg-bg-surface text-fg-secondary hover:text-fg-primary'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/settings');
                  }}
                  className="flex w-full items-center px-3 py-1.5 text-caption text-fg-secondary hover:bg-slate-800 hover:text-white rounded-md cursor-pointer"
                >
                  <User className="mr-2 h-3.5 w-3.5 text-fg-secondary" />
                  Perfil y Ajustes
                </button>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/settings');
                  }}
                  className="flex w-full items-center px-3 py-1.5 text-caption text-fg-secondary hover:bg-slate-800 hover:text-white rounded-md cursor-pointer"
                >
                  <Shield className="mr-2 h-3.5 w-3.5 text-fg-secondary" />
                  Políticas de Seguridad
                </button>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                    navigate('/login');
                  }}
                  className="flex w-full items-center px-3 py-1.5 text-caption text-fg-error hover:bg-bg-error-subtle rounded-md cursor-pointer mt-1"
                >
                  <LogOut className="mr-2 h-3.5 w-3.5 text-fg-error" />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global Search Modal (⌘K / Ctrl+K) */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-2xl border border-border-default bg-bg-card p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border-default">
              <div className="flex items-center space-x-2 flex-1">
                <Search className="h-4 w-4 text-fg-brand" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Escribe para buscar agentes, MCPs, workflows o atajos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-body text-fg-primary focus:outline-none placeholder:text-slate-500"
                />
              </div>
              <button
                onClick={() => setSearchOpen(false)}
                className="text-fg-secondary hover:text-white p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 max-h-72 overflow-y-auto space-y-2 text-caption">
              {/* Dynamic search matches */}
              {q ? (
                <>
                  {matchedAgents.length > 0 && (
                    <div>
                      <span className="text-caption font-semibold uppercase text-fg-brand px-2 py-0.5 block">
                        Agentes
                      </span>
                      {matchedAgents.map((ag) => (
                        <div
                          key={ag.id}
                          onClick={() => {
                            setSearchOpen(false);
                            navigate(`/agents/${ag.id}`);
                          }}
                          className="p-2 rounded-lg hover:bg-slate-800 cursor-pointer flex items-center justify-between text-fg-primary"
                        >
                          <span className="flex items-center gap-2">
                            <Bot className="h-3.5 w-3.5 text-fg-brand" />
                            {ag.name}
                          </span>
                          <Badge variant="outline" className="text-caption">
                            {ag.role}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  {matchedTools.length > 0 && (
                    <div>
                      <span className="text-caption font-semibold uppercase text-fg-warning px-2 py-0.5 block">
                        Herramientas MCP
                      </span>
                      {matchedTools.map((tl) => (
                        <div
                          key={tl.id}
                          onClick={() => {
                            setSearchOpen(false);
                            navigate('/mcp');
                          }}
                          className="p-2 rounded-lg hover:bg-slate-800 cursor-pointer flex items-center justify-between text-fg-primary"
                        >
                          <span className="flex items-center gap-2">
                            <Wrench className="h-3.5 w-3.5 text-fg-warning" />
                            {tl.name}
                          </span>
                          <span className="text-caption text-fg-secondary">{tl.serverName}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {matchedWorkflows.length > 0 && (
                    <div>
                      <span className="text-caption font-semibold uppercase text-fg-brand px-2 py-0.5 block">
                        Workflows
                      </span>
                      {matchedWorkflows.map((wf) => (
                        <div
                          key={wf.id}
                          onClick={() => {
                            setSearchOpen(false);
                            navigate('/workflows');
                          }}
                          className="p-2 rounded-lg hover:bg-slate-800 cursor-pointer flex items-center justify-between text-fg-primary"
                        >
                          <span className="flex items-center gap-2">
                            <GitFork className="h-3.5 w-3.5 text-fg-brand" />
                            {wf.name}
                          </span>
                          <span className="text-caption font-mono text-fg-secondary">v{wf.version}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {matchedAgents.length === 0 && matchedTools.length === 0 && matchedWorkflows.length === 0 && (
                    <p className="text-fg-secondary text-center py-4">No se encontraron resultados para "{searchQuery}"</p>
                  )}
                </>
              ) : (
                /* Default Shortcuts */
                <div>
                  <div className="text-caption font-semibold text-fg-secondary px-2 py-1">Accesos Directos Rápidos</div>
                  <button
                    onClick={() => {
                      setSearchOpen(false);
                      navigate('/chat');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-fg-primary flex items-center justify-between cursor-pointer"
                  >
                    <span>💬 Abrir Multi-Agent Chat Room</span>
                    <span className="text-caption text-fg-brand font-mono">/chat</span>
                  </button>
                  <button
                    onClick={() => {
                      setSearchOpen(false);
                      navigate('/workflows');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-fg-primary flex items-center justify-between cursor-pointer"
                  >
                    <span>⚡ Editor Visual de Workflows</span>
                    <span className="text-caption text-fg-brand font-mono">/workflows</span>
                  </button>
                  <button
                    onClick={() => {
                      setSearchOpen(false);
                      navigate('/mcp');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-fg-primary flex items-center justify-between cursor-pointer"
                  >
                    <span>🔌 Administrar Servidores MCP</span>
                    <span className="text-caption text-fg-brand font-mono">/mcp</span>
                  </button>
                  <button
                    onClick={() => {
                      setSearchOpen(false);
                      navigate('/executions');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-fg-primary flex items-center justify-between cursor-pointer"
                  >
                    <span>📊 Centro de Ejecución & Event Timeline</span>
                    <span className="text-caption text-fg-brand font-mono">/executions</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
