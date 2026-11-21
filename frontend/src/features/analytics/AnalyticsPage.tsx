import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Zap,
  DollarSign,
  Activity,
  Cpu,
  Bot,
  Calendar,
  AlertCircle,
  Download,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { initialAnalytics } from '@/services/mock-data';
import { formatNumber, formatCurrency } from '@/lib/utils';
import { ProviderLogo } from '@/components/shared/ProviderLogo';
import { AgentAvatar } from '@/components/shared/AgentAvatar';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Cell,
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d');

  const providerColors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];
  const agentColors = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header with Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-title sm:text-2xl font-[510] tracking-tight text-fg-primary flex items-center gap-2">
            Usage & Analytics
            <Badge variant="secondary" className="font-mono text-caption">Telemetría Global</Badge>
          </h2>
          <p className="mt-1 text-body text-fg-secondary">
            Métricas de consumo de tokens, distribución de costos e impacto computacional por proveedor y agente.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="flex items-center rounded-[6px] border border-border-default bg-bg-card/80 p-1">
            {(['7d', '30d', '90d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-md text-caption font-medium transition-colors ${
                  period === p ? 'bg-bg-brand text-fg-primary shadow-sm' : 'text-fg-secondary hover:text-[#ffffff]'
                }`}
              >
                {p === '7d' ? '7 Días' : p === '30d' ? '30 Días' : '3 Meses'}
              </button>
            ))}
          </div>

          <Button variant="outline" size="sm" className="text-caption h-8">
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Demo Notice Banner */}
      <div className="p-3 rounded-[12px] border border-border-brand/60 bg-bg-brand-subtle/20 text-caption text-fg-secondary flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-fg-brand shrink-0" />
        <span>
          <strong>Datos de demostración simulados:</strong> Todos los valores de tokens y costos corresponden a estimaciones analíticas basadas en tarifas de inferencia vigentes.
        </span>
      </div>

      {/* 4 Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-fg-secondary text-caption">
              <span>Tokens Totales</span>
              <Zap className="h-4 w-4 text-fg-brand" />
            </div>
            <p className="text-title font-[510] text-fg-primary mt-1">
              {formatNumber(initialAnalytics.totalTokens)}
            </p>
            <span className="text-caption text-fg-success font-medium">↑ 14.8% vs semana anterior</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-fg-secondary text-caption">
              <span>Costo Estimado</span>
              <DollarSign className="h-4 w-4 text-fg-success" />
            </div>
            <p className="text-title font-[510] text-fg-primary mt-1">
              {formatCurrency(initialAnalytics.estimatedCostUsd)}
            </p>
            <span className="text-caption text-fg-secondary font-mono">Promedio $0.0049 / 1k tok</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-fg-secondary text-caption">
              <span>Total Ejecuciones</span>
              <Activity className="h-4 w-4 text-fg-brand" />
            </div>
            <p className="text-title font-[510] text-fg-primary mt-1">
              {initialAnalytics.totalExecutions.toLocaleString()}
            </p>
            <span className="text-caption text-fg-success font-medium">98.2% tasa de éxito</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-fg-secondary text-caption">
              <span>Agentes & Proveedores</span>
              <Bot className="h-4 w-4 text-fg-warning" />
            </div>
            <p className="text-title font-[510] text-fg-primary mt-1">
              5 Agentes / 4 LLMs
            </p>
            <span className="text-caption text-fg-secondary">100% disponibilidad</span>
          </CardContent>
        </Card>
      </div>

      {/* Main Consumption Timeline Area Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-subtitle flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-fg-brand" />
            Evolución de Consumo y Costos Diarios
          </CardTitle>
          <CardDescription>
            Volumen diario de tokens y costos proyectados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={initialAnalytics.activityTimeline}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="tokenFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
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
                    name === 'tokens' ? 'Tokens' : 'Costo ($)',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="tokens"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#tokenFill)"
                  name="tokens"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Breakdown: Provider vs Agent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Consumption by Provider */}
        <Card>
          <CardHeader>
            <CardTitle className="text-subtitle flex items-center gap-2">
              <Cpu className="h-4 w-4 text-fg-brand" />
              Consumo por Proveedor de IA
            </CardTitle>
            <CardDescription>Distribución de tokens y costo entre plataformas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={initialAnalytics.tokensByProvider}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="provider" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                    formatter={(v: any) => [formatNumber(Number(v)), 'Tokens']}
                  />
                  <Bar dataKey="tokens" radius={[4, 4, 0, 0]}>
                    {initialAnalytics.tokensByProvider.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={providerColors[index % providerColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 pt-2 border-t border-border-default text-caption">
              {initialAnalytics.tokensByProvider.map((p, idx) => (
                <div key={p.provider} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ProviderLogo providerId={p.provider} size="xs" />
                    <span className="text-fg-secondary font-medium">{p.provider}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-caption">
                    <span className="text-fg-secondary">{formatNumber(p.tokens)} tok</span>
                    <span className="text-fg-success font-[510]">${p.cost.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Consumption by Agent */}
        <Card>
          <CardHeader>
            <CardTitle className="text-subtitle flex items-center gap-2">
              <Bot className="h-4 w-4 text-fg-brand" />
              Consumo por Agente Autónomo
            </CardTitle>
            <CardDescription>Carga de inferencia atribuida a cada rol</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={initialAnalytics.tokensByAgent}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="agent" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                    formatter={(v: any) => [formatNumber(Number(v)), 'Tokens']}
                  />
                  <Bar dataKey="tokens" radius={[4, 4, 0, 0]}>
                    {initialAnalytics.tokensByAgent.map((_, index) => (
                      <Cell key={`agent-cell-${index}`} fill={agentColors[index % agentColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 pt-2 border-t border-border-default text-caption">
              {initialAnalytics.tokensByAgent.map((a, idx) => (
                <div key={a.agent} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AgentAvatar agentName={a.agent} size="xs" />
                    <span className="text-fg-secondary font-medium">{a.agent}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-caption">
                    <span className="text-fg-secondary">{formatNumber(a.tokens)} tok</span>
                    <span className="text-fg-success font-[510]">${a.cost.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* LLM Tracing & Observability Section */}
      <Card className="border-border-default bg-bg-card/70 overflow-hidden">
        <CardHeader className="pb-3 border-b border-border-default/60">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-subtitle font-semibold text-fg-primary flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-400" />
                Trazas de Inferencia & Observabilidad LLM en Vivo
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 font-mono text-[10px]">
                  LangSmith / Langfuse Ready
                </Badge>
              </CardTitle>
              <CardDescription className="text-caption text-fg-secondary">
                Inspección granular de latencia, consumo de tokens y costo en cada llamada a modelo o herramienta.
              </CardDescription>
            </div>

            {/* Savings Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/[0.08]">
              <Cpu className="h-4 w-4 text-blue-400 shrink-0" />
              <div className="text-caption">
                <span className="text-fg-secondary">Ahorro Ollama Local: </span>
                <span className="font-mono font-bold text-blue-300">$418.50 USD</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-caption">
              <thead>
                <tr className="border-b border-border-default text-fg-secondary font-mono">
                  <th className="pb-2.5">Traza ID</th>
                  <th className="pb-2.5">Agente / Rol</th>
                  <th className="pb-2.5">Modelo & Proveedor</th>
                  <th className="pb-2.5">Latencia</th>
                  <th className="pb-2.5">Tokens (Prompt / Comp)</th>
                  <th className="pb-2.5">Costo</th>
                  <th className="pb-2.5 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default/60 font-mono">
                <tr className="hover:bg-bg-surface/30 transition-colors">
                  <td className="py-2.5 text-fg-brand font-semibold">tr_8f91c0e2</td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-1.5 font-sans">
                      <span className="font-medium text-fg-primary">Architect Agent</span>
                      <span className="text-[10px] text-fg-secondary">(Architect)</span>
                    </div>
                  </td>
                  <td className="py-2.5">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px]">
                      GPT-4o (OpenAI)
                    </span>
                  </td>
                  <td className="py-2.5 text-emerald-400">420ms</td>
                  <td className="py-2.5 text-fg-secondary">1,240 / 380</td>
                  <td className="py-2.5 text-fg-primary">$0.0081</td>
                  <td className="py-2.5 text-right">
                    <Badge variant="success" className="text-[10px] py-0">✓ Completed</Badge>
                  </td>
                </tr>

                <tr className="hover:bg-bg-surface/30 transition-colors">
                  <td className="py-2.5 text-fg-brand font-semibold">tr_4a29d11b</td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-1.5 font-sans">
                      <span className="font-medium text-fg-primary">Ollama_CP</span>
                      <span className="text-[10px] text-fg-secondary">(Developer)</span>
                    </div>
                  </td>
                  <td className="py-2.5">
                    <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[11px]">
                      Llama 3.1 Local (Ollama)
                    </span>
                  </td>
                  <td className="py-2.5 text-emerald-400">890ms</td>
                  <td className="py-2.5 text-fg-secondary">2,100 / 640</td>
                  <td className="py-2.5 text-blue-400 font-bold">$0.00 (Local)</td>
                  <td className="py-2.5 text-right">
                    <Badge variant="success" className="text-[10px] py-0">✓ Completed</Badge>
                  </td>
                </tr>

                <tr className="hover:bg-bg-surface/30 transition-colors">
                  <td className="py-2.5 text-fg-brand font-semibold">tr_12ee89bc</td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-1.5 font-sans">
                      <span className="font-medium text-fg-primary">Reviewer Agent</span>
                      <span className="text-[10px] text-fg-secondary">(Reviewer)</span>
                    </div>
                  </td>
                  <td className="py-2.5">
                    <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[11px]">
                      Claude 3.7 Sonnet (Anthropic)
                    </span>
                  </td>
                  <td className="py-2.5 text-amber-400">1,120ms</td>
                  <td className="py-2.5 text-fg-secondary">3,450 / 920</td>
                  <td className="py-2.5 text-fg-primary">$0.0241</td>
                  <td className="py-2.5 text-right">
                    <Badge variant="success" className="text-[10px] py-0">✓ Completed</Badge>
                  </td>
                </tr>

                <tr className="hover:bg-bg-surface/30 transition-colors">
                  <td className="py-2.5 text-fg-brand font-semibold">tr_771ab3d0</td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-1.5 font-sans">
                      <span className="font-medium text-fg-primary">Research Agent</span>
                      <span className="text-[10px] text-fg-secondary">(Research)</span>
                    </div>
                  </td>
                  <td className="py-2.5">
                    <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[11px]">
                      Gemini 2.5 Flash (Google)
                    </span>
                  </td>
                  <td className="py-2.5 text-emerald-400">310ms</td>
                  <td className="py-2.5 text-fg-secondary">4,800 / 510</td>
                  <td className="py-2.5 text-fg-primary">$0.0019</td>
                  <td className="py-2.5 text-right">
                    <Badge variant="success" className="text-[10px] py-0">✓ Completed</Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

