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
          <h2 className="text-title sm:text-2xl font-bold tracking-tight text-fg-primary flex items-center gap-2">
            Usage & Analytics
            <Badge variant="secondary" className="font-mono text-caption">Telemetría Global</Badge>
          </h2>
          <p className="mt-1 text-body text-fg-secondary">
            Métricas de consumo de tokens, distribución de costos e impacto computacional por proveedor y agente.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="flex items-center rounded-lg border border-border-default bg-bg-card/80 p-1">
            {(['7d', '30d', '90d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-md text-caption font-medium transition-colors ${
                  period === p ? 'bg-bg-brand text-fg-primary shadow-sm' : 'text-fg-secondary hover:text-white'
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
      <div className="p-3 rounded-xl border border-border-brand/60 bg-bg-brand-subtle/20 text-caption text-fg-secondary flex items-center gap-2">
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
            <p className="text-title font-bold text-fg-primary mt-1">
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
            <p className="text-title font-bold text-fg-primary mt-1">
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
            <p className="text-title font-bold text-fg-primary mt-1">
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
            <p className="text-title font-bold text-fg-primary mt-1">
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
                    <span className="text-fg-success font-semibold">${p.cost.toFixed(2)}</span>
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
                    <span className="text-fg-success font-semibold">${a.cost.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

