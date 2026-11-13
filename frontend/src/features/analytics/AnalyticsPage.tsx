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
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Usage & Analytics
            <Badge variant="secondary" className="font-mono text-xs">Telemetría Global</Badge>
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Métricas de consumo de tokens, distribución de costos e impacto computacional por proveedor y agente.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900/80 p-1">
            {(['7d', '30d', '90d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  period === p ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {p === '7d' ? '7 Días' : p === '30d' ? '30 Días' : '3 Meses'}
              </button>
            ))}
          </div>

          <Button variant="outline" size="sm" className="text-xs h-8">
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Demo Notice Banner */}
      <div className="p-3 rounded-xl border border-violet-900/60 bg-violet-950/20 text-xs text-slate-300 flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-violet-400 shrink-0" />
        <span>
          <strong>Datos de demostración simulados:</strong> Todos los valores de tokens y costos corresponden a estimaciones analíticas basadas en tarifas de inferencia vigentes.
        </span>
      </div>

      {/* 4 Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Tokens Totales</span>
              <Zap className="h-4 w-4 text-violet-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-1">
              {formatNumber(initialAnalytics.totalTokens)}
            </p>
            <span className="text-[11px] text-emerald-400 font-medium">↑ 14.8% vs semana anterior</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Costo Estimado</span>
              <DollarSign className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-1">
              {formatCurrency(initialAnalytics.estimatedCostUsd)}
            </p>
            <span className="text-[11px] text-slate-400 font-mono">Promedio $0.0049 / 1k tok</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Total Ejecuciones</span>
              <Activity className="h-4 w-4 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-1">
              {initialAnalytics.totalExecutions.toLocaleString()}
            </p>
            <span className="text-[11px] text-emerald-400 font-medium">98.2% tasa de éxito</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Agentes & Proveedores</span>
              <Bot className="h-4 w-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-1">
              5 Agentes / 4 LLMs
            </p>
            <span className="text-[11px] text-slate-400">100% disponibilidad</span>
          </CardContent>
        </Card>
      </div>

      {/* Main Consumption Timeline Area Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-violet-400" />
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
            <CardTitle className="text-base flex items-center gap-2">
              <Cpu className="h-4 w-4 text-blue-400" />
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

            <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
              {initialAnalytics.tokensByProvider.map((p, idx) => (
                <div key={p.provider} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: providerColors[idx % providerColors.length] }}
                    />
                    <span className="text-slate-300 font-medium">{p.provider}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="text-slate-400">{formatNumber(p.tokens)} tok</span>
                    <span className="text-emerald-400 font-semibold">${p.cost.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Consumption by Agent */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="h-4 w-4 text-violet-400" />
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

            <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
              {initialAnalytics.tokensByAgent.map((a, idx) => (
                <div key={a.agent} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: agentColors[idx % agentColors.length] }}
                    />
                    <span className="text-slate-300 font-medium">{a.agent}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="text-slate-400">{formatNumber(a.tokens)} tok</span>
                    <span className="text-emerald-400 font-semibold">${a.cost.toFixed(2)}</span>
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

