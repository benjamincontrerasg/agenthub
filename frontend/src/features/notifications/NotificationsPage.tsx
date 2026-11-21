import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  BellOff,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Trash2,
  CheckCheck,
  Filter,
  ArrowRight,
  GitFork,
  Bot,
  Server,
  Shield,
  CreditCard,
  Settings,
  ShieldAlert,
  Clock,
  X,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useNotificationsStore,
  AppNotification,
  NotificationCategory,
  NotificationSeverity,
} from '@/stores/notifications.store';

const severityConfig: Record<NotificationSeverity, { icon: React.ElementType; color: string; bg: string; border: string }> = {
  info: { icon: Info, color: 'text-fg-brand', bg: 'bg-bg-brand-subtle', border: 'border-border-brand/40' },
  success: { icon: CheckCircle2, color: 'text-fg-success', bg: 'bg-bg-success-subtle', border: 'border-border-success/40' },
  warning: { icon: AlertTriangle, color: 'text-fg-warning', bg: 'bg-bg-warning-subtle', border: 'border-border-warning/40' },
  error: { icon: XCircle, color: 'text-fg-error', bg: 'bg-bg-error-subtle', border: 'border-border-error/40' },
};

const categoryConfig: Record<NotificationCategory, { icon: React.ElementType; label: string; color: string }> = {
  workflow: { icon: GitFork, label: 'Workflow', color: 'text-fg-brand' },
  agent: { icon: Bot, label: 'Agente', color: 'text-emerald-400' },
  mcp: { icon: Server, label: 'MCP', color: 'text-orange-400' },
  security: { icon: Shield, label: 'Seguridad', color: 'text-red-400' },
  billing: { icon: CreditCard, label: 'Facturación', color: 'text-violet-400' },
  system: { icon: Settings, label: 'Sistema', color: 'text-cyan-400' },
  approval: { icon: ShieldAlert, label: 'Aprobación', color: 'text-yellow-400' },
};

function formatTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `Hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days}d`;
}

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    filter,
    setFilter,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotificationsStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredNotifications = useMemo(() => {
    if (filter === 'all') return notifications;
    return notifications.filter((n) => n.category === filter);
  }, [notifications, filter]);

  const categories: (NotificationCategory | 'all')[] = [
    'all',
    'workflow',
    'agent',
    'mcp',
    'security',
    'approval',
    'billing',
    'system',
  ];

  const selectedNotification = selectedId
    ? notifications.find((n) => n.id === selectedId)
    : null;

  const handleNotificationClick = (n: AppNotification) => {
    if (!n.read) markAsRead(n.id);
    setSelectedId(n.id);
  };

  // Stats
  const statsByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    notifications.forEach((n) => {
      counts[n.category] = (counts[n.category] || 0) + 1;
    });
    return counts;
  }, [notifications]);

  const statsBySeverity = useMemo(() => {
    const counts: Record<string, number> = { info: 0, success: 0, warning: 0, error: 0 };
    notifications.forEach((n) => {
      counts[n.severity] = (counts[n.severity] || 0) + 1;
    });
    return counts;
  }, [notifications]);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-[510] text-fg-primary flex items-center gap-2">
            <Bell className="h-5 w-5 text-fg-brand" />
            Centro de Notificaciones
          </h2>
          <p className="text-caption text-fg-secondary mt-1">
            Alertas en tiempo real de workflows, agentes, seguridad y facturación
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={markAllAsRead}
              className="gap-1.5"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar todo leído
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={clearAll}
            className="gap-1.5 text-fg-error hover:bg-bg-error-subtle"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Limpiar
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-bg-card border-border-default">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-[8px] bg-bg-brand-subtle flex items-center justify-center">
              <Bell className="h-5 w-5 text-fg-brand" />
            </div>
            <div>
              <p className="text-lg font-[510] text-fg-primary">{unreadCount}</p>
              <p className="text-caption text-fg-secondary">Sin leer</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-bg-card border-border-default">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-[8px] bg-bg-error-subtle flex items-center justify-center">
              <XCircle className="h-5 w-5 text-fg-error" />
            </div>
            <div>
              <p className="text-lg font-[510] text-fg-primary">{statsBySeverity.error}</p>
              <p className="text-caption text-fg-secondary">Errores</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-bg-card border-border-default">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-[8px] bg-bg-warning-subtle flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-fg-warning" />
            </div>
            <div>
              <p className="text-lg font-[510] text-fg-primary">{statsBySeverity.warning}</p>
              <p className="text-caption text-fg-secondary">Advertencias</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-bg-card border-border-default">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-[8px] bg-bg-success-subtle flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-fg-success" />
            </div>
            <div>
              <p className="text-lg font-[510] text-fg-primary">{statsBySeverity.success}</p>
              <p className="text-caption text-fg-secondary">Exitosos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {categories.map((cat) => {
          const isActive = filter === cat;
          const catInfo = cat === 'all' ? null : categoryConfig[cat];
          const count = cat === 'all' ? notifications.length : (statsByCategory[cat] || 0);
          const CatIcon = catInfo?.icon || Filter;

          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-caption font-medium whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'bg-bg-brand-subtle text-fg-brand border border-border-brand'
                  : 'text-fg-secondary hover:bg-bg-surface hover:text-fg-primary border border-transparent'
              }`}
            >
              <CatIcon className="h-3.5 w-3.5" />
              {cat === 'all' ? 'Todas' : catInfo?.label}
              <span className="font-mono text-[10px] opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content: List + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Notification List */}
        <div className="lg:col-span-3 space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
          {filteredNotifications.length === 0 ? (
            <Card className="bg-bg-card border-border-default">
              <CardContent className="p-8 text-center">
                <BellOff className="h-10 w-10 text-fg-muted mx-auto mb-3" />
                <p className="text-body text-fg-secondary">No hay notificaciones</p>
                <p className="text-caption text-fg-muted mt-1">
                  Las alertas de tus workflows, agentes y sistemas aparecerán aquí
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((n) => {
              const sev = severityConfig[n.severity];
              const cat = categoryConfig[n.category];
              const SevIcon = sev.icon;
              const CatIcon = cat.icon;
              const isSelected = selectedId === n.id;

              return (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`group p-3 rounded-[8px] border transition-all cursor-pointer ${
                    isSelected
                      ? `${sev.bg} ${sev.border} shadow-sm`
                      : n.read
                        ? 'border-border-default/60 bg-bg-card/60 hover:bg-bg-surface'
                        : `border-border-default bg-bg-card hover:bg-bg-surface shadow-xs`
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Severity Icon */}
                    <div className={`mt-0.5 h-8 w-8 rounded-[6px] ${sev.bg} flex items-center justify-center shrink-0`}>
                      <SevIcon className={`h-4 w-4 ${sev.color}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {!n.read && (
                            <span className="h-2 w-2 rounded-full bg-fg-brand shrink-0" />
                          )}
                          <span className={`text-caption font-[510] truncate ${n.read ? 'text-fg-secondary' : 'text-fg-primary'}`}>
                            {n.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className={`text-[10px] ${cat.color} border-current/30`}>
                            <CatIcon className="h-2.5 w-2.5 mr-0.5" />
                            {cat.label}
                          </Badge>
                          <span className="text-[10px] text-fg-muted font-mono flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            {formatTimeAgo(n.timestamp)}
                          </span>
                        </div>
                      </div>
                      <p className={`mt-1 text-caption line-clamp-2 ${n.read ? 'text-fg-muted' : 'text-fg-secondary'}`}>
                        {n.message}
                      </p>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(n.id);
                        if (selectedId === n.id) setSelectedId(null);
                      }}
                      className="opacity-0 group-hover:opacity-100 mt-0.5 p-1 rounded text-fg-muted hover:text-fg-error transition-all"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-2">
          {selectedNotification ? (
            <Card className="bg-bg-card border-border-default sticky top-20">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const sev = severityConfig[selectedNotification.severity];
                      const SevIcon = sev.icon;
                      return (
                        <div className={`h-10 w-10 rounded-[8px] ${sev.bg} flex items-center justify-center`}>
                          <SevIcon className={`h-5 w-5 ${sev.color}`} />
                        </div>
                      );
                    })()}
                    <div>
                      <CardTitle className="text-body">{selectedNotification.title}</CardTitle>
                      <CardDescription className="text-caption flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        {new Date(selectedNotification.timestamp).toLocaleString('es-CL')}
                      </CardDescription>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedId(null)}
                    className="p-1 rounded text-fg-muted hover:text-fg-primary"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-caption text-fg-secondary leading-relaxed">
                  {selectedNotification.message}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[6px] border border-border-default bg-bg-surface p-2.5">
                    <p className="text-[10px] font-mono uppercase text-fg-muted">Categoría</p>
                    <p className="text-caption font-[510] text-fg-primary flex items-center gap-1 mt-0.5">
                      {(() => {
                        const cat = categoryConfig[selectedNotification.category];
                        const CatIcon = cat.icon;
                        return (
                          <>
                            <CatIcon className={`h-3.5 w-3.5 ${cat.color}`} />
                            {cat.label}
                          </>
                        );
                      })()}
                    </p>
                  </div>
                  <div className="rounded-[6px] border border-border-default bg-bg-surface p-2.5">
                    <p className="text-[10px] font-mono uppercase text-fg-muted">Severidad</p>
                    <p className={`text-caption font-[510] mt-0.5 capitalize ${severityConfig[selectedNotification.severity].color}`}>
                      {selectedNotification.severity === 'info' && 'Informativo'}
                      {selectedNotification.severity === 'success' && 'Éxito'}
                      {selectedNotification.severity === 'warning' && 'Advertencia'}
                      {selectedNotification.severity === 'error' && 'Error'}
                    </p>
                  </div>
                  <div className="rounded-[6px] border border-border-default bg-bg-surface p-2.5">
                    <p className="text-[10px] font-mono uppercase text-fg-muted">Estado</p>
                    <p className="text-caption font-[510] text-fg-primary mt-0.5">
                      {selectedNotification.read ? '✓ Leída' : '● Sin leer'}
                    </p>
                  </div>
                  <div className="rounded-[6px] border border-border-default bg-bg-surface p-2.5">
                    <p className="text-[10px] font-mono uppercase text-fg-muted">ID</p>
                    <p className="text-[10px] font-mono text-fg-muted mt-0.5 truncate">
                      {selectedNotification.id}
                    </p>
                  </div>
                </div>

                {selectedNotification.actionUrl && (
                  <Button
                    size="sm"
                    onClick={() => navigate(selectedNotification.actionUrl!)}
                    className="w-full gap-1.5"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                    {selectedNotification.actionLabel || 'Ver detalle'}
                  </Button>
                )}

                <div className="flex gap-2">
                  {!selectedNotification.read && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markAsRead(selectedNotification.id)}
                      className="flex-1 gap-1.5"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Marcar leída
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      removeNotification(selectedNotification.id);
                      setSelectedId(null);
                    }}
                    className="flex-1 gap-1.5 text-fg-error hover:bg-bg-error-subtle"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-bg-card border-border-default">
              <CardContent className="p-8 text-center">
                <Info className="h-8 w-8 text-fg-muted mx-auto mb-3" />
                <p className="text-caption text-fg-secondary">
                  Selecciona una notificación para ver sus detalles
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
