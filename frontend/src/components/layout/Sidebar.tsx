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
          label: 'Chat Multi-Agente',
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
        { path: '/audit', label: 'Auditoría Zero-Trust', icon: ShieldCheck },
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
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#08090a] border border-[rgba(255,255,255,0.08)] p-1 shadow-sm group-hover:border-[rgba(228,242,34,0.35)] group-hover:shadow-[0_0_12px_rgba(228,242,34,0.15)] transition-all">
              <img
                src="/nexora-logo.png"
                alt="NEXORA Logo"
                className="h-full w-full object-contain filter drop-shadow select-none"
              />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-subtitle font-[510] tracking-tight text-[#ffffff] flex items-center gap-1.5">
                  NEXORA
                  <span className="text-caption font-mono px-1.5 py-0.2 rounded-[4px] bg-bg-brand-subtle text-[#e4f222] border border-[rgba(228,242,34,0.35)]">
                    SaaS
                  </span>
                </span>
                <span className="text-caption text-[#8a8f98]">Multi-Agent System</span>
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
                <div className="px-3 pb-1 text-caption font-[510] uppercase tracking-wider text-[#62666d]">
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
                      'flex items-center rounded-[6px] px-3 py-2 text-body font-medium transition-all group relative',
                      isActive
                        ? 'bg-[rgba(228,242,34,0.08)] text-[#e4f222] font-[510] border border-[rgba(228,242,34,0.25)] shadow-xs'
                        : 'text-[#8a8f98] hover:bg-[#161718] hover:text-[#d0d6e0]'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-colors',
                        isActive ? 'text-[#e4f222]' : 'text-[#62666d] group-hover:text-[#d0d6e0]',
                        collapsed ? 'mx-auto' : 'mr-3'
                      )}
                    />

                    {!collapsed && (
                      <span className="flex-1 truncate text-caption sm:text-body">{item.label}</span>
                    )}

                    {/* Pending Approvals Counter Badge */}
                    {!collapsed && item.showBadge && (
                      <span className="ml-auto rounded-full bg-fg-warning/20 px-2 py-0.5 text-caption font-mono font-[510] text-fg-warning border border-fg-warning/40 animate-pulse">
                        {pendingApprovalsCount} pend.
                      </span>
                    )}

                    {collapsed && item.showBadge && (
                      <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-fg-warning" />
                    )}

                    {isActive && (
                      <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-[#e4f222]" />
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
            <div className="rounded-[6px] border border-border-default/90 bg-bg-card/60 p-2.5">
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
