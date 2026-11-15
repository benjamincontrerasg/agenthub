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

interface SidebarNavItemProps {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
  pendingApprovalsCount: number;
  onCloseMobile: () => void;
}

const SidebarNavItem: React.FC<SidebarNavItemProps> = ({
  item,
  isActive,
  collapsed,
  pendingApprovalsCount,
  onCloseMobile,
}) => {
  const Icon = item.icon;
  const [isHovered, setIsHovered] = React.useState(false);
  const [mousePos, setMousePos] = React.useState({ x: 50, y: 50 });
  const containerRef = React.useRef<HTMLAnchorElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  React.useEffect(() => {
    if (!isHovered && !isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    // Partículas: en hover son más dinámicas, en activo son brasas ambientales suaves
    const count = isHovered ? 16 : 8;
    const particles = Array.from({ length: count }).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.7,
      vy: -0.25 - Math.random() * 0.5,
      size: Math.random() * 1.6 + 0.8,
      alpha: Math.random() * 0.7 + 0.2,
      fadeSpeed: 0.008 + Math.random() * 0.012,
      color: Math.random() > 0.35 ? '#e4f222' : '#ffffff',
    }));

    const render = () => {
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.fadeSpeed;

        if (p.alpha <= 0 || p.y < -2 || p.x < -2 || p.x > w + 2) {
          p.x = Math.random() * w;
          p.y = h + 2;
          p.vx = (Math.random() - 0.5) * 0.7;
          p.vy = -0.25 - Math.random() * 0.5;
          p.alpha = Math.random() * 0.7 + 0.3;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 4;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [isHovered, isActive]);

  return (
    <NavLink
      ref={containerRef}
      to={item.path}
      onClick={onCloseMobile}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      title={collapsed ? item.label : undefined}
      className={cn(
        'group relative flex items-center rounded-[8px] px-3 py-2 text-body font-medium transition-all duration-200 overflow-hidden select-none',
        isActive
          ? 'text-fg-brand font-[510] border border-[#e4f222]/80 shadow-[0_0_20px_-2px_rgba(228,242,34,0.4),inset_0_0_12px_rgba(228,242,34,0.15)] bg-[radial-gradient(ellipse_at_center,_rgba(228,242,34,0.18)_0%,_rgba(228,242,34,0.06)_55%,_rgba(15,16,17,0.9)_100%)]'
          : isHovered
          ? 'text-fg-primary border border-[#e4f222]/45 shadow-[0_0_15px_-3px_rgba(228,242,34,0.25)]'
          : 'text-fg-secondary border border-transparent hover:text-fg-primary'
      )}
    >
      {/* Difuminado interactivo con halo que sigue al cursor en hover */}
      {isHovered && !isActive && (
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-200"
          style={{
            background: `radial-gradient(130px circle at ${mousePos.x}px ${mousePos.y}px, rgba(228, 242, 34, 0.18) 0%, rgba(228, 242, 34, 0.05) 50%, transparent 80%)`,
          }}
        />
      )}

      {/* Partículas animadas en movimiento */}
      {(isHovered || isActive) && (
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 h-full w-full rounded-[8px]"
        />
      )}

      {/* Icono con resplandor neón */}
      <Icon
        className={cn(
          'h-4 w-4 shrink-0 transition-all duration-200 relative z-10',
          isActive
            ? 'text-fg-brand drop-shadow-[0_0_8px_rgba(228,242,34,0.7)]'
            : isHovered
            ? 'text-fg-brand drop-shadow-[0_0_5px_rgba(228,242,34,0.5)]'
            : 'text-fg-muted group-hover:text-fg-primary',
          collapsed ? 'mx-auto' : 'mr-3'
        )}
      />

      {/* Etiqueta del enlace */}
      {!collapsed && (
        <span
          className={cn(
            'flex-1 truncate text-caption sm:text-body relative z-10 transition-colors',
            isActive
              ? 'text-fg-brand font-[510] drop-shadow-[0_0_8px_rgba(228,242,34,0.5)]'
              : isHovered
              ? 'text-fg-primary'
              : 'text-fg-secondary'
          )}
        >
          {item.label}
        </span>
      )}

      {/* Contador de Aprobaciones Pendientes */}
      {!collapsed && item.showBadge && (
        <span className="relative z-10 ml-auto rounded-full bg-fg-warning/20 px-2 py-0.5 text-caption font-mono font-[510] text-fg-warning border border-fg-warning/40 animate-pulse">
          {pendingApprovalsCount} pend.
        </span>
      )}

      {collapsed && item.showBadge && (
        <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-fg-warning shadow-[0_0_6px_#fbbf24]" />
      )}

      {/* Barra de iluminación neón izquierda (solo cuando está prendido/clickeado) */}
      {isActive && (
        <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-[#e4f222] shadow-[0_0_10px_#e4f222,0_0_20px_#e4f222]" />
      )}
    </NavLink>
  );
};

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
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-bg-surface border border-border-default p-1 shadow-sm transition-all">
              <img
                src="/nexora-logo.png"
                alt="NEXORA Logo"
                className="h-full w-full object-contain filter drop-shadow select-none"
              />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-subtitle font-[510] tracking-tight text-fg-primary flex items-center gap-1.5">
                  NEXORA
                  <span className="text-caption font-mono px-1.5 py-0.2 rounded-[4px] bg-bg-brand-subtle text-fg-brand border border-border-brand">
                    SaaS
                  </span>
                </span>
                <span className="text-caption text-fg-muted">Multi-Agent System</span>
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
                <div className="px-3 pb-1 text-caption font-[510] uppercase tracking-wider text-fg-muted">
                  {group.groupTitle}
                </div>
              )}

              {group.items.map((item) => {
                const isActive =
                  item.path === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.path);

                return (
                  <SidebarNavItem
                    key={item.path}
                    item={item}
                    isActive={isActive}
                    collapsed={collapsed}
                    pendingApprovalsCount={pendingApprovalsCount}
                    onCloseMobile={onCloseMobile}
                  />
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
