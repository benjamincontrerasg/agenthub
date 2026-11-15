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
import { wsService, ConnectionStatus } from '@/services/websocket';

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
  const [wsStatus, setWsStatus] = useState<ConnectionStatus>(wsService.getStatus());

  useEffect(() => {
    return wsService.onStatusChange((status) => {
      setWsStatus(status);
    });
  }, []);

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
    title: 'NEXORA Platform',
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
          className="flex h-9 w-9 items-center justify-center rounded-[6px] border border-border-default text-[#8a8f98] hover:bg-bg-surface hover:text-[#ffffff] lg:hidden cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-subtitle sm:text-lg font-[510] tracking-tight text-[#ffffff]">
              {currentSection.title}
            </h1>
            <Badge variant="secondary" className="hidden sm:inline-flex text-caption py-0">
              v1.0-preview
            </Badge>
          </div>
          <p className="text-caption text-fg-mutedg-primaryg-secondary hidden md:block">
            {currentSection.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Search, Connection Status, Notifications, User */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Global Search Button */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center space-x-2 rounded-[6px] border border-border-default bg-bg-surface px-3 py-1.5 text-caption text-[#8a8f98] hover:border-border-hover hover:text-[#d0d6e0] transition-colors cursor-pointer"
        >
          <Search className="h-3.5 w-3.5 text-fg-mutedg-primaryg-secondary" />
          <span className="hidden sm:inline">Buscar agente, MCP o workflow...</span>
          <kbd className="hidden md:inline-flex rounded bg-bg-surface px-1.5 py-0.5 text-caption font-mono text-fg-mutedg-primaryg-secondary">
            ⌘K
          </kbd>
        </button>

        {/* WebSocket Connection Status Pill */}
        <div className="hidden sm:flex items-center space-x-2 rounded-[6px] border border-border-default bg-bg-surface px-2.5 py-1 text-caption">
          <span className="relative flex h-2 w-2">
            {wsStatus === 'connected' ? (
              <span className="relative inline-flex h-2 w-2 rounded-full bg-fg-success"></span>
            ) : wsStatus === 'reconnecting' || wsStatus === 'connecting' ? (
              <>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-fg-warning opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-fg-warning"></span>
              </>
            ) : (
              <span className="relative inline-flex h-2 w-2 rounded-full bg-fg-error"></span>
            )}
          </span>
          <span className="text-fg-secondary font-mono text-[11px]">
            {wsStatus === 'connected'
              ? 'WS En Línea'
              : wsStatus === 'reconnecting'
              ? 'WS Reconectando...'
              : wsStatus === 'connecting'
              ? 'WS Conectando...'
              : 'WS Offline'}
          </span>
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notificaciones del sistema"
            className="relative flex h-9 w-9 items-center justify-center rounded-[6px] border border-border-default bg-bg-surface text-[#8a8f98] hover:bg-bg-surface hover:text-[#ffffff] transition-colors cursor-pointer"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bg-brand opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-bg-brand"></span>
            </span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-[12px] border border-border-default bg-bg-card p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-border-default">
                <span className="text-body font-[510] text-[#ffffff]">Notificaciones</span>
                <span className="rounded-full bg-bg-brand-subtle px-2 py-0.5 text-caption text-fg-mutedg-primaryg-brand font-mono">
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
                    className="p-2.5 rounded-[6px] border border-border-default/80 bg-bg-surface hover:bg-bg-surface/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-caption font-[510] text-[#ffffff] flex items-center gap-1.5">
                        {n.type === 'warning' ? (
                          <AlertTriangle className="h-3 w-3 text-fg-mutedg-primaryg-warning" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3 text-fg-mutedg-primaryg-success" />
                        )}
                        {n.title}
                      </span>
                      <span className="text-caption text-fg-mutedg-primaryg-secondary">{n.time}</span>
                    </div>
                    <p className="mt-1 text-caption text-fg-mutedg-primaryg-secondary line-clamp-2">{n.message}</p>
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
            className="flex items-center space-x-2 rounded-[6px] border border-border-default bg-bg-surface p-1.5 hover:bg-bg-surface transition-colors cursor-pointer"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-[4px] bg-[#e4f222] text-caption font-[510] text-[#08090a]">
              {(user?.name || settings.profile.name).substring(0, 2).toUpperCase()}
            </div>
            <span className="hidden md:inline text-caption font-medium text-fg-mutedg-primaryg-primary max-w-[90px] truncate">
              {user?.name || settings.profile.name}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-fg-mutedg-primaryg-secondary" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-60 rounded-[12px] border border-border-default bg-bg-card p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-border-default">
                <div className="flex items-center justify-between">
                  <p className="text-caption font-[510] text-[#ffffff]">{user?.name || settings.profile.name}</p>
                  <Badge variant="outline" className="text-[10px] font-mono uppercase text-fg-mutedg-primaryg-brand border-border-brand/50">
                    {user?.role || 'admin'}
                  </Badge>
                </div>
                <p className="text-caption text-fg-mutedg-primaryg-secondary truncate">{user?.email || settings.profile.email}</p>
              </div>

              {/* Demo Role Switcher */}
              <div className="py-1.5 px-2 border-b border-border-default">
                <span className="text-[11px] font-medium text-fg-mutedg-primaryg-secondary uppercase block mb-1">Cambiar Rol RBAC</span>
                <div className="grid grid-cols-3 gap-1">
                  {(['admin', 'developer', 'viewer'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setDemoUser(r)}
                      className={`px-1.5 py-0.5 rounded text-[11px] font-medium cursor-pointer transition-colors ${(user?.role || 'admin') === r
                          ? 'bg-bg-brand text-fg-mutedg-primaryg-primary font-[510]'
                          : 'bg-bg-surface text-fg-mutedg-primaryg-secondary hover:text-fg-mutedg-primaryg-primary'
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
                  className="flex w-full items-center px-3 py-1.5 text-caption text-[#8a8f98] hover:bg-bg-surface hover:text-[#ffffff] rounded-[6px] cursor-pointer"
                >
                  <User className="mr-2 h-3.5 w-3.5 text-[#8a8f98]" />
                  Perfil y Ajustes
                </button>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/settings');
                  }}
                  className="flex w-full items-center px-3 py-1.5 text-caption text-[#8a8f98] hover:bg-bg-surface hover:text-[#ffffff] rounded-[6px] cursor-pointer"
                >
                  <Shield className="mr-2 h-3.5 w-3.5 text-fg-mutedg-primaryg-secondary" />
                  Políticas de Seguridad
                </button>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                    navigate('/login');
                  }}
                  className="flex w-full items-center px-3 py-1.5 text-caption text-fg-mutedg-primaryg-error hover:bg-bg-error-subtle rounded-md cursor-pointer mt-1"
                >
                  <LogOut className="mr-2 h-3.5 w-3.5 text-fg-mutedg-primaryg-error" />
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
            className="w-full max-w-xl rounded-[12px] border border-border-default bg-bg-card p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border-default">
              <div className="flex items-center space-x-2 flex-1">
                <Search className="h-4 w-4 text-fg-mutedg-primaryg-brand" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Escribe para buscar agentes, MCPs, workflows o atajos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-body text-fg-mutedg-primaryg-primary focus:outline-none placeholder:text-[#62666d]"
                />
              </div>
              <button
                onClick={() => setSearchOpen(false)}
                className="text-fg-mutedg-primaryg-secondary hover:text-[#ffffff] p-1 rounded-md"
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
                      <span className="text-caption font-[510] uppercase text-fg-mutedg-primaryg-brand px-2 py-0.5 block">
                        Agentes
                      </span>
                      {matchedAgents.map((ag) => (
                        <div
                          key={ag.id}
                          onClick={() => {
                            setSearchOpen(false);
                            navigate(`/agents/${ag.id}`);
                          }}
                          className="p-2 rounded-[6px] hover:bg-bg-surface cursor-pointer flex items-center justify-between text-fg-mutedg-primaryg-primary"
                        >
                          <span className="flex items-center gap-2">
                            <Bot className="h-3.5 w-3.5 text-fg-mutedg-primaryg-brand" />
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
                      <span className="text-caption font-[510] uppercase text-fg-mutedg-primaryg-warning px-2 py-0.5 block">
                        Herramientas MCP
                      </span>
                      {matchedTools.map((tl) => (
                        <div
                          key={tl.id}
                          onClick={() => {
                            setSearchOpen(false);
                            navigate('/mcp');
                          }}
                          className="p-2 rounded-[6px] hover:bg-bg-surface cursor-pointer flex items-center justify-between text-fg-mutedg-primaryg-primary"
                        >
                          <span className="flex items-center gap-2">
                            <Wrench className="h-3.5 w-3.5 text-fg-mutedg-primaryg-warning" />
                            {tl.name}
                          </span>
                          <span className="text-caption text-fg-mutedg-primaryg-secondary">{tl.serverName}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {matchedWorkflows.length > 0 && (
                    <div>
                      <span className="text-caption font-[510] uppercase text-fg-mutedg-primaryg-brand px-2 py-0.5 block">
                        Workflows
                      </span>
                      {matchedWorkflows.map((wf) => (
                        <div
                          key={wf.id}
                          onClick={() => {
                            setSearchOpen(false);
                            navigate('/workflows');
                          }}
                          className="p-2 rounded-[6px] hover:bg-bg-surface cursor-pointer flex items-center justify-between text-fg-mutedg-primaryg-primary"
                        >
                          <span className="flex items-center gap-2">
                            <GitFork className="h-3.5 w-3.5 text-fg-mutedg-primaryg-brand" />
                            {wf.name}
                          </span>
                          <span className="text-caption font-mono text-fg-mutedg-primaryg-secondary">v{wf.version}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {matchedAgents.length === 0 && matchedTools.length === 0 && matchedWorkflows.length === 0 && (
                    <p className="text-fg-mutedg-primaryg-secondary text-center py-4">No se encontraron resultados para "{searchQuery}"</p>
                  )}
                </>
              ) : (
                /* Default Shortcuts */
                <div>
                  <div className="text-caption font-[510] text-fg-mutedg-primaryg-secondary px-2 py-1">Accesos Directos Rápidos</div>
                  <button
                    onClick={() => {
                      setSearchOpen(false);
                      navigate('/chat');
                    }}
                    className="w-full text-left px-3 py-2 rounded-[6px] hover:bg-bg-surface text-fg-mutedg-primaryg-primary flex items-center justify-between cursor-pointer"
                  >
                    <span>💬 Abrir Multi-Agent Chat Room</span>
                    <span className="text-caption text-fg-mutedg-primaryg-brand font-mono">/chat</span>
                  </button>
                  <button
                    onClick={() => {
                      setSearchOpen(false);
                      navigate('/workflows');
                    }}
                    className="w-full text-left px-3 py-2 rounded-[6px] hover:bg-bg-surface text-fg-mutedg-primaryg-primary flex items-center justify-between cursor-pointer"
                  >
                    <span>⚡ Editor Visual de Workflows</span>
                    <span className="text-caption text-fg-mutedg-primaryg-brand font-mono">/workflows</span>
                  </button>
                  <button
                    onClick={() => {
                      setSearchOpen(false);
                      navigate('/mcp');
                    }}
                    className="w-full text-left px-3 py-2 rounded-[6px] hover:bg-bg-surface text-fg-mutedg-primaryg-primary flex items-center justify-between cursor-pointer"
                  >
                    <span>🔌 Administrar Servidores MCP</span>
                    <span className="text-caption text-fg-mutedg-primaryg-brand font-mono">/mcp</span>
                  </button>
                  <button
                    onClick={() => {
                      setSearchOpen(false);
                      navigate('/executions');
                    }}
                    className="w-full text-left px-3 py-2 rounded-[6px] hover:bg-bg-surface text-fg-mutedg-primaryg-primary flex items-center justify-between cursor-pointer"
                  >
                    <span>📊 Centro de Ejecución & Event Timeline</span>
                    <span className="text-caption text-fg-mutedg-primaryg-brand font-mono">/executions</span>
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
