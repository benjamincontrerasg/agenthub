import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  Cpu,
  Server,
  Activity,
  Zap,
  TrendingUp,
  ShieldAlert,
  ShieldCheck,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Check,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAgents } from '@/features/agents/hooks';
import { useProviders } from '@/features/providers/hooks';
import { useMCPStore } from '@/stores/mcp.store';
import { useExecutionsStore } from '@/stores/executions.store';
import { useChatStore } from '@/stores/chat.store';
import { initialAnalytics } from '@/services/mock-data';
import { formatNumber, formatCurrency, formatDuration, formatDate } from '@/lib/utils';
import { ProviderLogo } from '@/components/shared/ProviderLogo';
import { AgentAvatar } from '@/components/shared/AgentAvatar';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: agents = [] } = useAgents();
  const { data: providers = [] } = useProviders();
  const { servers } = useMCPStore();
  const { executions } = useExecutionsStore();
  const { conversations, respondToApproval } = useChatStore();

  const [dismissOnboarding, setDismissOnboarding] = useState(false);

  // Recopilar aprobaciones pendientes reales en conversaciones
  const pendingApprovals = conversations.flatMap((c) =>
    c.messages
      .filter((m) => m.approvalRequest && m.approvalRequest.status === 'pending')
      .map((m) => ({
        ...m.approvalRequest!,
        conversationId: c.id,
        conversationTitle: c.title,
      }))
  );

  // Recopilar ejecuciones fallidas recientes
  const failedExecutions = executions.filter((e) => e.status === 'failed');

  const connectedProvidersCount = providers.filter((p) => p.status === 'connected').length;
  const activeAgentsCount = agents.filter((a) => a.status === 'active').length;
  const recentExecutions = executions.slice(0, 5);

  // 3 Pasos del Onboarding inicial
  const onboardingSteps = [
    {
      id: 1,
      title: 'Conectar un Proveedor de IA',
      description: 'Configura tu clave de Anthropic Claude, OpenAI, Gemini u Ollama.',
      completed: connectedProvidersCount > 0,
      badgeText: `${connectedProvidersCount} conectado${connectedProvidersCount > 1 ? 's' : ''}`,
      actionText: 'Gestionar Proveedores',
      actionPath: '/providers',
    },
    {
      id: 2,
      title: 'Crear o Configurar tu Primer Agente',
      description: 'Define su rol, instrucciones del sistema y herramientas permitidas.',
      completed: agents.length > 0,
      badgeText: `${agents.length} configurado${agents.length > 1 ? 's' : ''}`,
      actionText: 'Ver Catálogo',
      actionPath: '/agents',
    },
    {
      id: 3,
      title: 'Iniciar un Chat o Flujo de Trabajo',
      description: 'Pon a colaborar a tus agentes con validación Zero-Trust de escrituras.',
      completed: executions.length > 0 || conversations.length > 0,
      badgeText: 'Listo para ejecutar',
      actionText: 'Abrir Chat Multi-Agente',
      actionPath: '/chat',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── GUÍA DE PRIMEROS PASOS (Checklist de 3 pasos) ── */}
      {!dismissOnboarding && (
        <Card className="border-border-brand/40 bg-gradient-to-r from-bg-card via-bg-surface/50 to-bg-card shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-border-default">
              <div>
                <span className="text-caption font-semibold uppercase tracking-wider text-fg-brand">
                  Guía de Primeros Pasos
                </span>
                <h3 className="text-subtitle sm:text-title font-bold text-fg-primary mt-0.5">
                  Comienza a orquestar en 3 pasos sencillos
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDismissOnboarding(true)}
                className="text-caption text-fg-muted hover:text-fg-primary self-start sm:self-auto"
              >
                Ocultar guía
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              {onboardingSteps.map((step) => (
                <div
                  key={step.id}
                  onClick={() => navigate(step.actionPath)}
                  className="rounded-lg border border-border-default hover:border-border-hover bg-bg-card/80 p-4 transition-all cursor-pointer group hover:bg-bg-surface/60 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-bg-surface text-caption font-bold text-fg-brand border border-border-brand/40">
                        {step.completed ? <Check className="h-3.5 w-3.5 text-fg-success" /> : step.id}
                      </span>
                      <Badge
                        variant={step.completed ? 'success' : 'secondary'}
                        className="text-caption"
                      >
                        {step.badgeText}
                      </Badge>
                    </div>
                    <h4 className="text-body font-semibold text-fg-primary group-hover:text-fg-brand transition-colors">
                      {step.title}
                    </h4>
                    <p className="mt-1 text-caption text-fg-secondary">
                      {step.description}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-border-default/60 flex items-center justify-between text-caption text-fg-brand font-medium">
                    <span>{step.actionText}</span>
                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── 4 KPIS ESENCIALES ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Aprobaciones Pendientes (Atención Urgente) */}
        <Card
          onClick={() => navigate('/chat')}
          className={`cursor-pointer transition-all hover:translate-y-[-2px] border ${
            pendingApprovals.length > 0
              ? 'border-fg-warning/60 bg-bg-warning/15'
              : 'border-border-default bg-bg-card'
          }`}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-caption font-medium text-fg-secondary">
                Aprobaciones Pendientes
              </span>
              <div className="p-2 rounded-lg bg-bg-surface border border-border-default">
                <ShieldAlert
                  className={`h-4 w-4 ${
                    pendingApprovals.length > 0 ? 'text-fg-warning animate-pulse' : 'text-fg-muted'
                  }`}
                />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span
                className={`text-title font-bold tracking-tight ${
                  pendingApprovals.length > 0 ? 'text-fg-warning' : 'text-fg-primary'
                }`}
              >
                {pendingApprovals.length}
              </span>
              {pendingApprovals.length > 0 && (
                <Badge variant="warning" className="text-caption">
                  Requiere Acción
                </Badge>
              )}
            </div>
            <p className="mt-1 text-caption text-fg-secondary truncate">
              {pendingApprovals.length > 0
                ? 'Operaciones sensibles en espera'
                : 'Cero bloqueos de seguridad'}
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Tasa de Éxito de Ejecuciones */}
        <Card
          onClick={() => navigate('/executions')}
          className="cursor-pointer hover:border-border-hover transition-all hover:translate-y-[-2px]"
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-caption font-medium text-fg-secondary">
                Tasa de Éxito Global
              </span>
              <div className="p-2 rounded-lg bg-bg-surface border border-border-default">
                <Activity className="h-4 w-4 text-fg-success" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-title font-bold tracking-tight text-fg-primary">
                {initialAnalytics.successRate}%
              </span>
              <Badge variant="success" className="text-caption">
                Estable
              </Badge>
            </div>
            <p className="mt-1 text-caption text-fg-secondary truncate">
              {failedExecutions.length} fallida(s) de {executions.length} recientes
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Agentes & Proveedores Listos */}
        <Card
          onClick={() => navigate('/agents')}
          className="cursor-pointer hover:border-border-hover transition-all hover:translate-y-[-2px]"
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-caption font-medium text-fg-secondary">
                Agentes en Servicio
              </span>
              <div className="p-2 rounded-lg bg-bg-surface border border-border-default">
                <Bot className="h-4 w-4 text-fg-brand" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-title font-bold tracking-tight text-fg-primary">
                {activeAgentsCount} / {agents.length}
              </span>
              <div className="flex items-center gap-1">
                <ProviderLogo providerId="anthropic" size="xs" />
                <ProviderLogo providerId="openai" size="xs" />
                <ProviderLogo providerId="gemini" size="xs" />
              </div>
            </div>
            <p className="mt-1 text-caption text-fg-secondary truncate">
              {connectedProvidersCount} proveedores conectados
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Consumo & Costo Proyectado */}
        <Card
          onClick={() => navigate('/analytics')}
          className="cursor-pointer hover:border-border-hover transition-all hover:translate-y-[-2px]"
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-caption font-medium text-fg-secondary">
                Consumo y Costo
              </span>
              <div className="p-2 rounded-lg bg-bg-surface border border-border-default">
                <Zap className="h-4 w-4 text-fg-brand" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-title font-bold tracking-tight text-fg-primary">
                {formatNumber(initialAnalytics.totalTokens)}
              </span>
              <span className="font-mono text-body font-semibold text-fg-success">
                {formatCurrency(initialAnalytics.estimatedCostUsd)}
              </span>
            </div>
            <p className="mt-1 text-caption text-fg-secondary truncate">
              Promedio $0.0049 por 1k tokens
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── SECCIÓN CENTRAL: GRÁFICO + "¿QUÉ NECESITA MI ATENCIÓN?" ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Actividad (2 columnas) */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-subtitle flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-fg-brand" />
                Consumo Diario de Inferencia
              </CardTitle>
              <CardDescription>
                Volumen de tokens y actividad autónoma de los últimos 7 días
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/analytics')}
              className="text-caption h-8"
            >
              Ver métricas completas →
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={initialAnalytics.activityTimeline}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="tokenGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f1629',
                      borderColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#f1f5f9',
                      fontSize: '12px',
                    }}
                    formatter={(value: any, name: any) => [
                      name === 'tokens' ? formatNumber(Number(value)) : `$${value}`,
                      name === 'tokens' ? 'Tokens' : 'Costo',
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="tokens"
                    stroke="#a78bfa"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#tokenGradient)"
                    name="tokens"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* ── PANEL DE ATENCIÓN PRIORITARIA: "¿Qué necesita mi atención?" ── */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="text-subtitle flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-fg-warning" />
                ¿Qué necesita tu atención?
              </span>
              <span className="text-caption font-mono px-2 py-0.5 rounded bg-bg-surface text-fg-secondary">
                {pendingApprovals.length + failedExecutions.length} alertas
              </span>
            </CardTitle>
            <CardDescription>
              Aprobaciones de seguridad pendientes y ejecuciones fallidas
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 flex-1 overflow-y-auto max-h-[300px]">
            {/* Lista de Aprobaciones Pendientes */}
            {pendingApprovals.map((appr) => (
              <div
                key={appr.id}
                className="p-3 rounded-lg border border-fg-warning/40 bg-bg-warning/20 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-fg-warning animate-ping" />
                    <span className="text-caption font-bold text-fg-warning uppercase tracking-wider">
                      Aprobación Requerida
                    </span>
                  </div>
                  <span className="text-caption font-mono text-fg-muted">{appr.id}</span>
                </div>

                <div>
                  <p className="text-body font-semibold text-fg-primary">
                    {appr.agentName}
                  </p>
                  <p className="text-caption text-fg-secondary mt-0.5 line-clamp-2">
                    {appr.actionDescription}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-caption font-mono text-fg-muted">
                    Herramienta: <strong className="text-fg-primary">{appr.toolName}</strong>
                  </span>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => navigate('/chat')}
                    className="h-7 text-caption bg-fg-warning text-slate-950 font-bold hover:bg-amber-300"
                  >
                    Revisar en Chat →
                  </Button>
                </div>
              </div>
            ))}

            {/* Lista de Ejecuciones Fallidas */}
            {failedExecutions.map((failed) => (
              <div
                key={failed.id}
                className="p-3 rounded-lg border border-fg-error/40 bg-bg-error/20 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-3.5 w-3.5 text-fg-error" />
                    <span className="text-caption font-bold text-fg-error uppercase tracking-wider">
                      Ejecución Fallida
                    </span>
                  </div>
                  <span className="text-caption font-mono text-fg-muted">{failed.id}</span>
                </div>

                <div>
                  <p className="text-body font-semibold text-fg-primary">
                    {failed.workflowName}
                  </p>
                  <p className="text-caption text-fg-secondary mt-0.5">
                    Falló en paso de validación ({failed.responsibleAgentName || 'Agent'})
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-caption text-fg-muted">
                    {formatDate(failed.startedAt)}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate('/executions')}
                    className="h-7 text-caption border-fg-error/40 text-fg-error hover:bg-fg-error/20"
                  >
                    Ver Logs de Error →
                  </Button>
                </div>
              </div>
            ))}

            {/* Estado Limpio: Sin alertas */}
            {pendingApprovals.length === 0 && failedExecutions.length === 0 && (
              <div className="text-center py-8 px-4 rounded-lg border border-dashed border-border-default bg-bg-card/40">
                <CheckCircle2 className="h-8 w-8 text-fg-success mx-auto mb-2" />
                <p className="text-body font-semibold text-fg-primary">
                  Todo en orden
                </p>
                <p className="text-caption text-fg-secondary mt-1 max-w-xs mx-auto">
                  No hay aprobaciones de seguridad pendientes ni fallos reportados en las últimas ejecuciones.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── TABLA DE EJECUCIONES RECIENTES ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-subtitle flex items-center gap-2">
              <Activity className="h-4 w-4 text-fg-brand" />
              Historial de Ejecuciones Recientes
            </CardTitle>
            <CardDescription>
              Últimas tareas y flujos completados o en progreso
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-caption text-fg-brand hover:text-violet-300"
            onClick={() => navigate('/executions')}
          >
            Ver todas ({executions.length}) →
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-caption">
              <thead className="border-b border-border-default text-fg-secondary font-medium">
                <tr>
                  <th className="pb-3 pl-2">ID</th>
                  <th className="pb-3">Workflow / Tarea</th>
                  <th className="pb-3">Agente Responsable</th>
                  <th className="pb-3">Estado</th>
                  <th className="pb-3">Tokens</th>
                  <th className="pb-3">Duración</th>
                  <th className="pb-3">Iniciado</th>
                  <th className="pb-3 text-right pr-2">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default/60">
                {recentExecutions.map((exec) => (
                  <tr
                    key={exec.id}
                    className="hover:bg-bg-surface/50 transition-colors cursor-pointer group"
                    onClick={() => navigate('/executions')}
                  >
                    <td className="py-3 pl-2 font-mono text-fg-brand font-medium">
                      {exec.id}
                    </td>
                    <td className="py-3 font-medium text-fg-primary max-w-[240px] truncate">
                      {exec.workflowName}
                    </td>
                    <td className="py-3 text-fg-secondary">
                      <div className="flex items-center gap-2">
                        <AgentAvatar agentName={exec.responsibleAgentName || 'Coordinator'} size="xs" />
                        <span>{exec.responsibleAgentName || 'Coordinator'}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      {exec.status === 'completed' && (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Completado
                        </Badge>
                      )}
                      {exec.status === 'running' && (
                        <Badge variant="default" className="gap-1 animate-pulse">
                          <Zap className="h-3 w-3" /> Ejecutando
                        </Badge>
                      )}
                      {exec.status === 'failed' && (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="h-3 w-3" /> Fallido
                        </Badge>
                      )}
                      {exec.status === 'waiting_approval' && (
                        <Badge variant="warning" className="gap-1">
                          <AlertTriangle className="h-3 w-3" /> Aprobación Pendiente
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 font-mono text-fg-secondary">
                      {formatNumber(exec.totalTokens)}
                    </td>
                    <td className="py-3 text-fg-secondary">
                      {formatDuration(exec.durationMs || 0)}
                    </td>
                    <td className="py-3 text-fg-secondary">
                      {formatDate(exec.startedAt)}
                    </td>
                    <td className="py-3 text-right pr-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-caption text-fg-secondary group-hover:text-fg-primary"
                      >
                        Ver Detalle →
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
