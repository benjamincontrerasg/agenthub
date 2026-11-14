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

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/providers', label: 'AI Providers', icon: Cpu, badge: '4' },
  { path: '/agents', label: 'Agents', icon: Bot, badge: '5' },
  { path: '/mcp', label: 'MCP Hub', icon: Server, badge: '3' },
  { path: '/workflows', label: 'Workflows', icon: GitFork },
  { path: '/chat', label: 'Multi-Agent Chat', icon: MessageSquare, highlight: true },
  { path: '/executions', label: 'Execution Center', icon: Activity },
  { path: '/analytics', label: 'Usage & Analytics', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const location = useLocation();

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
        <div className="flex h-16 items-center justify-between px-4 border-b border-border-default/80">
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
                  <span className="text-caption font-mono px-1.5 py-0.2 rounded bg-bg-brand-subtle/80 text-fg-brand border border-border-brand/60">
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
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-md border border-border-default text-fg-secondary hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="mb-2 px-3 text-caption font-semibold uppercase tracking-wider text-fg-secondary">
            {!collapsed ? 'Plataforma' : '•••'}
          </div>

          {navItems.map((item) => {
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
                  'flex items-center rounded-lg px-3 py-2.5 text-body font-medium transition-all group relative',
                  isActive
                    ? 'bg-bg-brand/15 text-fg-brand font-semibold border border-border-brand/30'
                    : 'text-fg-secondary hover:bg-slate-900 hover:text-slate-200'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0 transition-colors',
                    isActive ? 'text-fg-brand' : 'text-fg-secondary group-hover:text-slate-300',
                    collapsed ? 'mx-auto' : 'mr-3'
                  )}
                />

                {!collapsed && (
                  <span className="flex-1 truncate text-caption sm:text-sm">{item.label}</span>
                )}

                {!collapsed && item.badge && (
                  <span className="ml-auto rounded-full bg-bg-surface/80 px-2 py-0.5 text-caption font-mono text-fg-secondary border border-border-hover/50">
                    {item.badge}
                  </span>
                )}

                {isActive && (
                  <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-bg-brand" />
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Bottom System Status Widget */}
        <div className="p-3 border-t border-border-default/80">
          {!collapsed ? (
            <div className="rounded-lg border border-border-default/90 bg-bg-card/60 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5 text-caption font-medium text-fg-secondary">
                  <span className="h-2 w-2 rounded-full bg-fg-success animate-pulse" />
                  Local Bridge
                </span>
                <Badge variant="success" className="text-caption py-0 px-1.5">
                  Seguro
                </Badge>
              </div>
              <p className="text-caption text-fg-secondary">
                MCP Sandbox activo con validación humana requerida para operaciones de escritura.
              </p>
            </div>
          ) : (
            <div
              className="flex justify-center py-2"
              title="Local Bridge Sandbox Activo"
            >
              <ShieldCheck className="h-5 w-5 text-fg-success" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

