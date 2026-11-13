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
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useSettingsStore } from '@/stores/settings.store';
import { useAgentsStore } from '@/stores/agents.store';
import { useMCPStore } from '@/stores/mcp.store';
import { useWorkflowsStore } from '@/stores/workflows.store';

interface HeaderProps {
  onOpenMobile: () => void;
}

const sectionTitles: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Vista general y métricas del ecosistema de agentes' },
  '/providers': { title: 'AI Providers', subtitle: 'Conexión y gestión de proveedores de modelos de lenguaje' },
  '/agents': { title: 'Agents', subtitle: 'Configuración, roles y orquestación de agentes autónomos' },
  '/mcp': { title: 'MCP Hub', subtitle: 'Administración de servidores Model Context Protocol' },
  '/workflows': { title: 'Workflow Builder', subtitle: 'Diseñador visual de pipelines multiagente con React Flow' },
  '/chat': { title: 'Multi-Agent Chat', subtitle: 'Sala colaborativa de ejecución e interacción con agentes' },
  '/executions': { title: 'Execution Center', subtitle: 'Trazabilidad, logs y auditoría en tiempo real' },
  '/analytics': { title: 'Usage & Analytics', subtitle: 'Consumo de tokens, costos y rendimiento' },
  '/settings': { title: 'Settings', subtitle: 'Configuración de seguridad, backend y entorno' },
};

export const Header: React.FC<HeaderProps> = ({ onOpenMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { settings } = useSettingsStore();
  const { agents } = useAgentsStore();
  const { getAllTools } = useMCPStore();
  const { workflows } = useWorkflowsStore();

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
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-800/80 bg-slate-950/85 px-4 sm:px-6 backdrop-blur-md">
      {/* Left: Mobile Toggle & Section Title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenMobile}
          aria-label="Abrir menú de navegación"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-white lg:hidden cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
              {currentSection.title}
            </h1>
            <Badge variant="secondary" className="hidden sm:inline-flex text-[10px] py-0">
              v1.0-preview
            </Badge>
          </div>
          <p className="text-xs text-slate-400 hidden md:block">
            {currentSection.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Search, Connection Status, Notifications, User */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Global Search Button */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center space-x-2 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-400 hover:border-slate-700 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <Search className="h-3.5 w-3.5 text-slate-400" />
          <span className="hidden sm:inline">Buscar agente, MCP o workflow...</span>
          <kbd className="hidden md:inline-flex rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
            ⌘K
          </kbd>
        </button>

        {/* Live Status Pill */}
        <div className="hidden sm:flex items-center space-x-2 rounded-lg border border-slate-800/80 bg-slate-900/50 px-2.5 py-1 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <span className="text-slate-300 font-medium">En línea</span>
          <span className="text-[10px] text-violet-400 font-mono">(Mock Mode)</span>
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notificaciones del sistema"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500"></span>
            </span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-sm font-semibold text-white">Notificaciones</span>
                <span className="rounded-full bg-violet-950 px-2 py-0.5 text-[10px] text-violet-300 font-mono">
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
                    className="p-2.5 rounded-lg border border-slate-800/80 bg-slate-950/60 hover:bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                        {n.type === 'warning' ? (
                          <AlertTriangle className="h-3 w-3 text-amber-400" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                        )}
                        {n.title}
                      </span>
                      <span className="text-[10px] text-slate-400">{n.time}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400 line-clamp-2">{n.message}</p>
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
            className="flex items-center space-x-2 rounded-lg border border-slate-800 bg-slate-900/60 p-1.5 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-tr from-violet-600 to-indigo-600 text-[11px] font-bold text-white">
              {settings.profile.name.substring(0, 2).toUpperCase()}
            </div>
            <span className="hidden md:inline text-xs font-medium text-slate-200 max-w-[90px] truncate">
              {settings.profile.name}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-slate-800">
                <p className="text-xs font-semibold text-white">{settings.profile.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{settings.profile.email}</p>
                <p className="mt-1 text-[10px] text-violet-400 font-mono">{settings.profile.role}</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/settings');
                  }}
                  className="flex w-full items-center px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white rounded-md cursor-pointer"
                >
                  <User className="mr-2 h-3.5 w-3.5 text-slate-400" />
                  Perfil y Ajustes
                </button>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/settings');
                  }}
                  className="flex w-full items-center px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white rounded-md cursor-pointer"
                >
                  <Shield className="mr-2 h-3.5 w-3.5 text-slate-400" />
                  Políticas de Seguridad
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
            className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2 flex-1">
                <Search className="h-4 w-4 text-violet-400" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Escribe para buscar agentes, MCPs, workflows o atajos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-sm text-white focus:outline-none placeholder:text-slate-500"
                />
              </div>
              <button
                onClick={() => setSearchOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 max-h-72 overflow-y-auto space-y-2 text-xs">
              {/* Dynamic search matches */}
              {q ? (
                <>
                  {matchedAgents.length > 0 && (
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-violet-400 px-2 py-0.5 block">
                        Agentes
                      </span>
                      {matchedAgents.map((ag) => (
                        <div
                          key={ag.id}
                          onClick={() => {
                            setSearchOpen(false);
                            navigate(`/agents/${ag.id}`);
                          }}
                          className="p-2 rounded-lg hover:bg-slate-800 cursor-pointer flex items-center justify-between text-slate-200"
                        >
                          <span className="flex items-center gap-2">
                            <Bot className="h-3.5 w-3.5 text-violet-400" />
                            {ag.name}
                          </span>
                          <Badge variant="outline" className="text-[9px]">
                            {ag.role}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  {matchedTools.length > 0 && (
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-amber-400 px-2 py-0.5 block">
                        Herramientas MCP
                      </span>
                      {matchedTools.map((tl) => (
                        <div
                          key={tl.id}
                          onClick={() => {
                            setSearchOpen(false);
                            navigate('/mcp');
                          }}
                          className="p-2 rounded-lg hover:bg-slate-800 cursor-pointer flex items-center justify-between text-slate-200"
                        >
                          <span className="flex items-center gap-2">
                            <Wrench className="h-3.5 w-3.5 text-amber-400" />
                            {tl.name}
                          </span>
                          <span className="text-[10px] text-slate-400">{tl.serverName}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {matchedWorkflows.length > 0 && (
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-blue-400 px-2 py-0.5 block">
                        Workflows
                      </span>
                      {matchedWorkflows.map((wf) => (
                        <div
                          key={wf.id}
                          onClick={() => {
                            setSearchOpen(false);
                            navigate('/workflows');
                          }}
                          className="p-2 rounded-lg hover:bg-slate-800 cursor-pointer flex items-center justify-between text-slate-200"
                        >
                          <span className="flex items-center gap-2">
                            <GitFork className="h-3.5 w-3.5 text-blue-400" />
                            {wf.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">v{wf.version}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {matchedAgents.length === 0 && matchedTools.length === 0 && matchedWorkflows.length === 0 && (
                    <p className="text-slate-400 text-center py-4">No se encontraron resultados para "{searchQuery}"</p>
                  )}
                </>
              ) : (
                /* Default Shortcuts */
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 px-2 py-1">Accesos Directos Rápidos</div>
                  <button
                    onClick={() => {
                      setSearchOpen(false);
                      navigate('/chat');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center justify-between cursor-pointer"
                  >
                    <span>💬 Abrir Multi-Agent Chat Room</span>
                    <span className="text-[10px] text-violet-400 font-mono">/chat</span>
                  </button>
                  <button
                    onClick={() => {
                      setSearchOpen(false);
                      navigate('/workflows');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center justify-between cursor-pointer"
                  >
                    <span>⚡ Editor Visual de Workflows</span>
                    <span className="text-[10px] text-violet-400 font-mono">/workflows</span>
                  </button>
                  <button
                    onClick={() => {
                      setSearchOpen(false);
                      navigate('/mcp');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center justify-between cursor-pointer"
                  >
                    <span>🔌 Administrar Servidores MCP</span>
                    <span className="text-[10px] text-violet-400 font-mono">/mcp</span>
                  </button>
                  <button
                    onClick={() => {
                      setSearchOpen(false);
                      navigate('/executions');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center justify-between cursor-pointer"
                  >
                    <span>📊 Centro de Ejecución & Event Timeline</span>
                    <span className="text-[10px] text-violet-400 font-mono">/executions</span>
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
