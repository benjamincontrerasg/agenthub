import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Cpu,
  Bot,
  Server,
  GitFork,
  MessageSquare,
  Activity,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useChatStore } from '@/stores/chat.store';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  showBadge?: boolean;
}

interface NavGroup {
  groupTitle: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const location = useLocation();
  const { conversations } = useChatStore();

  // Contar aprobaciones pendientes reales en conversaciones
  const pendingApprovalsCount = conversations.reduce((acc, conv) => {
    const pendingInConv = conv.messages.filter(
      (m) => m.approvalRequest?.status === 'pending'
    ).length;
    return acc + pendingInConv;
  }, 0);

  const navGroups: NavGroup[] = [
    {
      groupTitle: 'General',
      items: [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      groupTitle: 'Construir',
      items: [
        { path: '/providers', label: 'Proveedores de IA', icon: Cpu },
        { path: '/agents', label: 'Agentes Autónomos', icon: Bot },
        { path: '/mcp', label: 'MCP Hub', icon: Server },
        { path: '/workflows', label: 'Flujos de Trabajo', icon: GitFork },
      ],
    },
    {
      groupTitle: 'Operar',
      items: [
        {
          path: '/chat',
          label: 'Chat Multiagente',
          icon: MessageSquare,
          showBadge: pendingApprovalsCount > 0,
        },
        { path: '/executions', label: 'Centro de Ejecuciones', icon: Activity },
        { path: '/analytics', label: 'Uso y Métricas', icon: BarChart3 },
      ],
    },
    {
      groupTitle: 'Ajustes',
      items: [
        { path: '/settings', label: 'Configuración', icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Main Sidebar Element */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border-default/80 bg-bg-card/95 backdrop-blur-md transition-all duration-300 ease-in-out lg:static',
          collapsed ? 'w-18' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo & Brand */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-border-default/80 shrink-0">
          <NavLink
            to="/"
            onClick={onCloseMobile}
            className="flex items-center space-x-3 overflow-hidden group"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 shadow-md shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-all">
              <Sparkles className="h-5 w-5 text-fg-primary" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-subtitle font-bold tracking-tight text-fg-primary flex items-center gap-1.5">
                  AgentHub
                  <span className="text-caption font-mono px-1.5 py-0.2 rounded bg-bg-brand-subtle text-fg-brand border border-border-brand/60">
                    SaaS
                  </span>
                </span>
                <span className="text-caption text-fg-secondary">Multi-Agent System</span>
              </div>
            )}
          </NavLink>

          {/* Desktop Collapse Button */}
          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-md border border-border-default text-fg-secondary hover:bg-bg-surface hover:text-fg-primary transition-colors cursor-pointer"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Grouped Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {navGroups.map((group) => (
            <div key={group.groupTitle} className="space-y-1">
              {!collapsed && (
                <div className="px-3 pb-1 text-caption font-semibold uppercase tracking-wider text-fg-muted">
                  {group.groupTitle}
                </div>
              )}

              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.path === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.path);

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onCloseMobile}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'flex items-center rounded-lg px-3 py-2 text-body font-medium transition-all group relative',
                      isActive
                        ? 'bg-bg-brand-subtle text-fg-brand font-semibold border border-border-brand/40 shadow-xs'
                        : 'text-fg-secondary hover:bg-bg-surface hover:text-fg-primary'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-colors',
                        isActive ? 'text-fg-brand' : 'text-fg-secondary group-hover:text-fg-primary',
                        collapsed ? 'mx-auto' : 'mr-3'
                      )}
                    />

                    {!collapsed && (
                      <span className="flex-1 truncate text-caption sm:text-body">{item.label}</span>
                    )}

                    {/* Pending Approvals Counter Badge */}
                    {!collapsed && item.showBadge && (
                      <span
                        title={`${pendingApprovalsCount} aprobación(es) pendiente(s)`}
                        aria-label={`${pendingApprovalsCount} aprobaciones pendientes`}
                        className="ml-2 shrink-0 min-w-6 rounded-full bg-fg-warning/20 px-1.5 py-0.5 text-center text-caption font-mono font-semibold text-fg-warning border border-fg-warning/40"
                      >
                        {pendingApprovalsCount}
                      </span>
                    )}

                    {collapsed && item.showBadge && (
                      <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-fg-warning" />
                    )}

                    {isActive && (
                      <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-fg-brand" />
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom System Status Widget */}
        <div className="p-3 border-t border-border-default/80 shrink-0">
          {!collapsed ? (
            <div className="rounded-lg border border-border-default/90 bg-bg-card/60 p-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-1.5 text-caption font-medium text-fg-secondary">
                  <span className="h-2 w-2 rounded-full bg-fg-success" />
                  Zero-Trust Bridge
                </span>
                <Badge variant="success" className="text-caption py-0 px-1.5">
                  Activo
                </Badge>
              </div>
              <p className="text-caption text-fg-muted">
                Aprobación humana requerida para escritura.
              </p>
            </div>
          ) : (
            <div
              className="flex justify-center py-2"
              title="Zero-Trust Bridge Activo"
            >
              <ShieldCheck className="h-5 w-5 text-fg-success" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
