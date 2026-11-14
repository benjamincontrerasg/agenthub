import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  Cpu,
  Server,
  Activity,
  Zap,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Plus,
  Play,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAgentsStore } from '@/stores/agents.store';
import { useProvidersStore } from '@/stores/providers.store';
import { useMCPStore } from '@/stores/mcp.store';
import { useExecutionsStore } from '@/stores/executions.store';
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
  const { agents } = useAgentsStore();
  const { providers } = useProvidersStore();
  const { servers } = useMCPStore();
  const { executions } = useExecutionsStore();

  const activeAgentsCount = agents.filter((a) => a.status === 'active').length;
  const connectedProvidersCount = providers.filter((p) => p.status === 'connected').length;
  const connectedMCPCount = servers.filter((s) => s.status === 'connected' && s.isActivated).length;
  const recentExecutions = executions.slice(0, 5);

  const statsCards = [
    {
      title: 'Total de Agentes',
      value: agents.length,
      subValue: `${activeAgentsCount} activos ahora`,
      icon: Bot,
      color: 'text-fg-brand',
      bgColor: 'bg-bg-brand-subtle/40',
      borderColor: 'border-border-brand/40',
      path: '/agents',
    },
    {
      title: 'Proveedores IA',
      value: `${connectedProvidersCount} / ${providers.length}`,
      subValue: 'Anthropic, OpenAI, Gemini, Ollama',
      icon: Cpu,
      color: 'text-fg-brand',
      bgColor: 'bg-bg-brand-subtle/40',
      borderColor: 'border-border-brand/40',
      path: '/providers',
    },
    {
      title: 'Servidores MCP',
      value: `${connectedMCPCount} activos`,
      subValue: `${servers.flatMap((s) => s.tools).length} herramientas registradas`,
      icon: Server,
      color: 'text-fg-success',
      bgColor: 'bg-bg-success/40',
      borderColor: 'border-fg-success/40',
      path: '/mcp',
    },
    {
      title: 'Consumo de Tokens',
      value: formatNumber(initialAnalytics.totalTokens),
      subValue: `Costo estimado: ${formatCurrency(initialAnalytics.estimatedCostUsd)}`,
      icon: Zap,
      color: 'text-fg-warning',
      bgColor: 'bg-bg-warning/40',
      borderColor: 'border-fg-warning/40',
      path: '/analytics',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-border-default/80 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950 p-6 shadow-md">
        <div>
          <h2 className="text-title sm:text-2xl font-bold tracking-tight text-fg-primary flex items-center gap-2">
            Plataforma Multiagente AgentHub
            <Badge variant="default" className="text-caption">Empresarial</Badge>
          </h2>
          <p className="mt-1 text-body text-fg-secondary">
            Orquesta flujos de trabajo autónomos conectando Claude, GPT-4o, Gemini y servidores MCP.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate('/chat')}
            className="shadow-md shadow-violet-600/20"
          >
            <Play className="mr-1.5 h-3.5 w-3.5" />
            Iniciar Colaboración
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/workflows')}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Crear Workflow
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/agents')}
          >
            <Bot className="mr-1.5 h-3.5 w-3.5" />
            Nuevo Agente
          </Button>
        </div>
      </div>

      {/* 4 Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              onClick={() => navigate(stat.path)}
              className="cursor-pointer hover:border-slate-700 transition-all hover:translate-y-[-2px] group"
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-caption font-medium text-fg-secondary">{stat.title}</span>
                  <div className={`p-2 rounded-lg ${stat.bgColor} border ${stat.borderColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-title font-bold tracking-tight text-fg-primary">{stat.value}</span>
                  <ArrowUpRight className="h-4 w-4 text-fg-muted group-hover:text-violet-400 transition-colors" />
                </div>
                {stat.title === 'Proveedores IA' ? (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <ProviderLogo providerId="anthropic" size="xs" />
                    <ProviderLogo providerId="openai" size="xs" />
                    <ProviderLogo providerId="gemini" size="xs" />
                    <ProviderLogo providerId="ollama" size="xs" />
                    <span className="text-caption text-fg-secondary ml-1">4 Modelos</span>
                  </div>
                ) : (
                  <p className="mt-1 text-caption text-fg-secondary truncate">{stat.subValue}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Activity Chart & System Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Recharts Chart (2 columns) */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-subtitle flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-fg-brand" />
                Actividad y Consumo de Tokens (Últimos 7 días)
              </CardTitle>
              <CardDescription>
                Tokens procesados y número de ejecuciones autónomas por día
              </CardDescription>
            </div>
            <Badge variant="secondary" className="font-mono text-caption">
              {formatNumber(initialAnalytics.totalTokens)} total
            </Badge>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={initialAnalytics.activityTimeline}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="tokenGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
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
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
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
                    stroke="#8b5cf6"
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

        {/* System Health & Sandbox Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-subtitle flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-fg-success" />
              Estado General del Sistema
            </CardTitle>
            <CardDescription>
              Telemetría y gobernanza de ejecución de agentes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-bg-card/70 border border-border-default">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-fg-success animate-pulse" />
                  <div>
                    <p className="text-caption font-semibold text-fg-primary">Local Bridge & STDIO</p>
                    <p className="text-caption text-fg-secondary">Sandbox aislado con permisos</p>
                  </div>
                </div>
                <Badge variant="success">Operativo</Badge>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-bg-card/70 border border-border-default">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-fg-success" />
                  <div>
                    <p className="text-caption font-semibold text-fg-primary">Aprobación Humana</p>
                    <p className="text-caption text-fg-secondary">Escritura en disco & PRs</p>
                  </div>
                </div>
                <Badge variant="info">Zero-Trust</Badge>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-bg-card/70 border border-border-default">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-fg-success" />
                  <div>
                    <p className="text-caption font-semibold text-fg-primary">Orquestador Multiagente</p>
                    <p className="text-caption text-fg-secondary">Latencia media 48ms</p>
                  </div>
                </div>
                <Badge variant="success">99.8% SLA</Badge>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-bg-card/70 border border-border-default">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-bg-brand" />
                  <div>
                    <p className="text-caption font-semibold text-fg-primary">Backend Mock Adapter</p>
                    <p className="text-caption text-fg-secondary">Persistencia local en sesión</p>
                  </div>
                </div>
                <Badge variant="secondary">Simulación</Badge>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full text-caption"
              onClick={() => navigate('/settings')}
            >
              Configurar Gobernanza y Seguridad
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Executions Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-subtitle flex items-center gap-2">
              <Activity className="h-4 w-4 text-fg-brand" />
              Historial de Ejecuciones Recientes
            </CardTitle>
            <CardDescription>
              Últimas ejecuciones de pipelines y tareas colaborativas
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-caption text-fg-brand hover:text-violet-300"
            onClick={() => navigate('/executions')}
          >
            Ver todas las ejecuciones ({executions.length}) →
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-caption">
              <thead className="border-b border-border-default text-fg-secondary font-medium">
                <tr>
                  <th className="pb-3 pl-2">ID Ejecución</th>
                  <th className="pb-3">Workflow / Tarea</th>
                  <th className="pb-3">Agente Responsable</th>
                  <th className="pb-3">Estado</th>
                  <th className="pb-3">Tokens</th>
                  <th className="pb-3">Duración</th>
                  <th className="pb-3">Iniciado</th>
                  <th className="pb-3 text-right pr-2">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentExecutions.map((exec) => (
                  <tr
                    key={exec.id}
                    className="hover:bg-slate-900/50 transition-colors cursor-pointer group"
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
                          <AlertCircle className="h-3 w-3" /> Requiere Aprobación
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
                        className="h-7 px-2 text-caption text-fg-secondary group-hover:text-white"
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

