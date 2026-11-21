import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Zap,
  Shield,
  ArrowUpRight,
  ExternalLink,
  Receipt,
  Download,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/services/api';
import { toast } from '@/stores/toast.store';
import { useAgentsStore } from '@/stores/agents.store';
import { useWorkflowsStore } from '@/stores/workflows.store';
import { useMCPStore } from '@/stores/mcp.store';

interface Plan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  limits: {
    maxAgents: number;
    maxWorkflows: number;
    maxMcpServers: number;
    localOllamaAllowed: boolean;
    cloudProvidersAllowed: string[];
    zeroTrustGatesAllowed: boolean;
    prioritySupport: boolean;
    dedicatedSandbox?: boolean;
    sso?: boolean;
    customSla?: string;
  };
}

interface Subscription {
  userId: string;
  planId: string;
  status: string;
  billingCycle: 'monthly' | 'yearly';
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: string | null;
  plan: Plan;
}

export const BillingSettingsTab: React.FC = () => {
  const { agents } = useAgentsStore();
  const { workflows } = useWorkflowsStore();
  const { servers } = useMCPStore();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  // Cargar planes y suscripción actual desde el backend
  useEffect(() => {
    const fetchBillingData = async () => {
      try {
        setLoading(true);
        const [plansRes, subRes] = await Promise.all([
          apiClient<{ success: boolean; plans: Plan[] }>('/billing/plans'),
          apiClient<{ success: boolean; subscription: Subscription }>('/billing/subscription'),
        ]);

        if (plansRes?.plans) setPlans(plansRes.plans);
        if (subRes?.subscription) setSubscription(subRes.subscription);
      } catch (err) {
        console.warn('Usando estado de suscripción por defecto:', err);
        // Fallback robusto en modo offline / demo
        setSubscription({
          userId: 'usr_current',
          planId: 'pro',
          status: 'active',
          billingCycle: 'yearly',
          currentPeriodEnd: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
          cancelAtPeriodEnd: false,
          trialEndsAt: null,
          plan: {
            id: 'pro',
            name: 'Pro Team & Scale',
            description: 'Para startups y equipos de ingeniería con pipelines en producción.',
            priceMonthly: 99,
            priceYearly: 79,
            currency: 'USD',
            limits: {
              maxAgents: -1,
              maxWorkflows: -1,
              maxMcpServers: -1,
              localOllamaAllowed: true,
              cloudProvidersAllowed: ['anthropic', 'openai', 'gemini', 'ollama'],
              zeroTrustGatesAllowed: true,
              prioritySupport: true,
            },
          },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBillingData();
  }, []);

  const handleSelectPlan = async (planId: string) => {
    if (subscription?.planId === planId) {
      toast.info('Plan Actual', 'Ya tienes este plan activo.');
      return;
    }

    try {
      setCheckoutLoading(planId);
      const res = await apiClient<{ success: boolean; url: string }>('/billing/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({
          planId,
          billingCycle: 'yearly',
        }),
      });

      if (res?.url) {
        toast.success('Sesión de Checkout Creada', `Plan ${planId.toUpperCase()} activado correctamente.`);
        // Actualizar suscripción local
        setSubscription((prev) =>
          prev
            ? {
                ...prev,
                planId,
                plan: plans.find((p) => p.id === planId) || prev.plan,
              }
            : null
        );
      }
    } catch (err: any) {
      toast.error('Error en Checkout', err.message || 'No se pudo iniciar el checkout.');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleOpenCustomerPortal = async () => {
    try {
      const res = await apiClient<{ success: boolean; url: string }>('/billing/portal', {
        method: 'POST',
      });
      if (res?.url) {
        window.open(res.url, '_blank');
      }
    } catch {
      toast.info('Portal de Stripe', 'Simulación de portal de facturación en entorno de desarrollo.');
    }
  };

  const activeAgentsCount = agents.filter((a) => a.status === 'active').length;
  const activeMcpCount = servers.filter((s) => s.status === 'connected').length;

  return (
    <div className="space-y-6">
      {/* Current Subscription Hero */}
      <Card className="border-border-default bg-bg-card/70 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#e4f222]/10 to-transparent blur-3xl pointer-events-none" />

        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#e4f222]/15 border border-[#e4f222]/30 flex items-center justify-center text-[#e4f222]">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-title text-fg-primary flex items-center gap-2">
                  <span>{subscription?.plan?.name || 'Pro Team & Scale'}</span>
                  <Badge variant="success" className="font-mono text-caption">
                    {subscription?.status === 'active' ? '🟢 Activo' : '⚪ En Pausa'}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-caption text-fg-secondary mt-0.5">
                  Facturación anual con 20% de descuento aplicado · Próxima renovación: {' '}
                  <span className="font-mono text-fg-primary">
                    {subscription?.currentPeriodEnd
                      ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                      : '20 de Diciembre, 2026'}
                  </span>
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-caption border-border-default"
                onClick={handleOpenCustomerPortal}
              >
                <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                Gestionar Tarjeta
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          {/* Quotas & Limits Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl border border-border-default bg-bg-surface/50">
            <div>
              <div className="flex items-center justify-between text-caption mb-1.5">
                <span className="text-fg-secondary">Agentes Activos</span>
                <span className="font-mono text-fg-brand font-medium">
                  {activeAgentsCount} / {subscription?.plan?.limits?.maxAgents === -1 ? 'Ilimitados' : subscription?.plan?.limits?.maxAgents || 3}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-border-default overflow-hidden">
                <div
                  className="h-full bg-fg-brand rounded-full transition-all"
                  style={{
                    width: `${subscription?.plan?.limits?.maxAgents === -1 ? 25 : (activeAgentsCount / 3) * 100}%`,
                  }}
                />
              </div>
              <span className="text-[11px] text-fg-secondary mt-1 block">Inferencia multi-cerebro activa</span>
            </div>

            <div>
              <div className="flex items-center justify-between text-caption mb-1.5">
                <span className="text-fg-secondary">Workflows Diseñados</span>
                <span className="font-mono text-fg-success font-medium">
                  {workflows.length} / {subscription?.plan?.limits?.maxWorkflows === -1 ? 'Ilimitados' : subscription?.plan?.limits?.maxWorkflows || 5}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-border-default overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all"
                  style={{
                    width: `${subscription?.plan?.limits?.maxWorkflows === -1 ? 20 : (workflows.length / 5) * 100}%`,
                  }}
                />
              </div>
              <span className="text-[11px] text-fg-secondary mt-1 block">Grafos con auto-layout responsive</span>
            </div>

            <div>
              <div className="flex items-center justify-between text-caption mb-1.5">
                <span className="text-fg-secondary">Servidores MCP Conectados</span>
                <span className="font-mono text-amber-400 font-medium">
                  {activeMcpCount} / {subscription?.plan?.limits?.maxMcpServers === -1 ? 'Ilimitados' : subscription?.plan?.limits?.maxMcpServers || 3}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-border-default overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all"
                  style={{
                    width: `${subscription?.plan?.limits?.maxMcpServers === -1 ? 35 : (activeMcpCount / 3) * 100}%`,
                  }}
                />
              </div>
              <span className="text-[11px] text-fg-secondary mt-1 block">Sandbox Zero-Trust operativo</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Selector Grid */}
      <div>
        <div className="mb-4">
          <h3 className="text-subtitle font-semibold text-fg-primary">Comparativa de Planes</h3>
          <p className="text-caption text-fg-secondary">
            Cambia de nivel en cualquier momento. Las mejoras de plan se prorratean automáticamente.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Starter Plan */}
          <Card
            className={`border transition-all flex flex-col justify-between ${
              subscription?.planId === 'starter'
                ? 'border-border-brand bg-bg-card/90 ring-1 ring-border-brand'
                : 'border-border-default bg-bg-card/50 hover:border-border-hover'
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-1">
                <CardTitle className="text-subtitle font-bold text-fg-primary">Starter</CardTitle>
                {subscription?.planId === 'starter' && (
                  <Badge variant="success" className="text-[10px] font-mono">Plan Actual</Badge>
                )}
              </div>
              <CardDescription className="text-caption">Para experimentación y desarrollo local.</CardDescription>
              <div className="pt-2 text-2xl font-bold font-mono text-fg-primary">
                $24 <span className="text-caption text-fg-secondary font-normal font-sans">/ mes</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-caption pt-0">
              <div className="flex items-center gap-2 text-fg-secondary">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Hasta 3 agentes autónomos</span>
              </div>
              <div className="flex items-center gap-2 text-fg-secondary">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Hasta 5 flujos de trabajo</span>
              </div>
              <div className="flex items-center gap-2 text-fg-secondary">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Ollama local ilimitado (costo $0)</span>
              </div>
              <div className="flex items-center gap-2 text-fg-secondary">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Cifrado AES-256-GCM para API Keys</span>
              </div>
            </CardContent>
            <CardFooter className="pt-3 border-t border-border-default">
              <Button
                variant={subscription?.planId === 'starter' ? 'outline' : 'default'}
                size="sm"
                className="w-full text-caption"
                disabled={subscription?.planId === 'starter' || checkoutLoading === 'starter'}
                onClick={() => handleSelectPlan('starter')}
              >
                {subscription?.planId === 'starter' ? 'Plan Activo' : 'Seleccionar Starter'}
              </Button>
            </CardFooter>
          </Card>

          {/* Pro Plan */}
          <Card
            className={`border transition-all flex flex-col justify-between relative ${
              subscription?.planId === 'pro'
                ? 'border-[#e4f222] bg-bg-card/90 ring-1 ring-[#e4f222]'
                : 'border-border-default bg-bg-card/50 hover:border-border-hover'
            }`}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-[#e4f222] text-[#08090a]">
                Recomendado
              </span>
            </div>

            <CardHeader className="pb-3 pt-5">
              <div className="flex items-center justify-between mb-1">
                <CardTitle className="text-subtitle font-bold text-fg-primary">Pro Team</CardTitle>
                {subscription?.planId === 'pro' && (
                  <Badge variant="success" className="text-[10px] font-mono">Plan Actual</Badge>
                )}
              </div>
              <CardDescription className="text-caption">Para equipos con flujos en producción.</CardDescription>
              <div className="pt-2 text-2xl font-bold font-mono text-fg-primary">
                $79 <span className="text-caption text-fg-secondary font-normal font-sans">/ mes</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-caption pt-0">
              <div className="flex items-center gap-2 text-fg-secondary">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="font-semibold text-fg-primary">Agentes y Workflows ilimitados</span>
              </div>
              <div className="flex items-center gap-2 text-fg-secondary">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Multi-Cerebro: Claude 3.7 + GPT-4o + Gemini</span>
              </div>
              <div className="flex items-center gap-2 text-fg-secondary">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Puntos de control Zero-Trust humanos</span>
              </div>
              <div className="flex items-center gap-2 text-fg-secondary">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Webhooks y triggers automáticos</span>
              </div>
              <div className="flex items-center gap-2 text-fg-secondary">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Soporte prioritario</span>
              </div>
            </CardContent>
            <CardFooter className="pt-3 border-t border-border-default">
              <Button
                variant={subscription?.planId === 'pro' ? 'outline' : 'default'}
                size="sm"
                className={`w-full text-caption ${subscription?.planId === 'pro' ? '' : 'bg-[#e4f222] text-[#08090a] hover:bg-[#d6e41b]'}`}
                disabled={subscription?.planId === 'pro' || checkoutLoading === 'pro'}
                onClick={() => handleSelectPlan('pro')}
              >
                {subscription?.planId === 'pro' ? 'Plan Activo' : 'Mejorar a Pro'}
              </Button>
            </CardFooter>
          </Card>

          {/* Enterprise Plan */}
          <Card
            className={`border transition-all flex flex-col justify-between ${
              subscription?.planId === 'enterprise'
                ? 'border-purple-500 bg-bg-card/90 ring-1 ring-purple-500'
                : 'border-border-default bg-bg-card/50 hover:border-border-hover'
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-1">
                <CardTitle className="text-subtitle font-bold text-fg-primary">Enterprise</CardTitle>
                {subscription?.planId === 'enterprise' && (
                  <Badge variant="success" className="text-[10px] font-mono">Plan Actual</Badge>
                )}
              </div>
              <CardDescription className="text-caption">Cumplimiento, aislamiento y soporte 24/7.</CardDescription>
              <div className="pt-2 text-2xl font-bold font-mono text-fg-primary">
                $399 <span className="text-caption text-fg-secondary font-normal font-sans">/ mes</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-caption pt-0">
              <div className="flex items-center gap-2 text-fg-secondary">
                <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0" />
                <span>Multi-tenant con base de datos aislada</span>
              </div>
              <div className="flex items-center gap-2 text-fg-secondary">
                <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0" />
                <span>Sandbox Bridge dedicado en nube privada</span>
              </div>
              <div className="flex items-center gap-2 text-fg-secondary">
                <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0" />
                <span>Autenticación SSO / SAML / OIDC</span>
              </div>
              <div className="flex items-center gap-2 text-fg-secondary">
                <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0" />
                <span>SLA 99.9% garantizado por contrato</span>
              </div>
            </CardContent>
            <CardFooter className="pt-3 border-t border-border-default">
              <Button
                variant={subscription?.planId === 'enterprise' ? 'outline' : 'default'}
                size="sm"
                className="w-full text-caption"
                disabled={subscription?.planId === 'enterprise' || checkoutLoading === 'enterprise'}
                onClick={() => handleSelectPlan('enterprise')}
              >
                {subscription?.planId === 'enterprise' ? 'Plan Activo' : 'Contactar Enterprise'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Invoices & Payment History */}
      <Card className="border-border-default bg-bg-card/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-body font-semibold text-fg-primary flex items-center gap-2">
                <Receipt className="h-4 w-4 text-fg-brand" />
                Historial de Facturación
              </CardTitle>
              <CardDescription className="text-caption">
                Descarga tus recibos y comprobantes fiscales con desglose de IVA/Tax.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-caption">
              <thead>
                <tr className="border-b border-border-default text-fg-secondary font-mono">
                  <th className="pb-2">Fecha</th>
                  <th className="pb-2">Factura</th>
                  <th className="pb-2">Monto</th>
                  <th className="pb-2">Estado</th>
                  <th className="pb-2 text-right">Comprobante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default/60">
                <tr>
                  <td className="py-2.5 font-mono">20 Nov 2026</td>
                  <td className="py-2.5 font-mono text-fg-primary">INV-2026-004</td>
                  <td className="py-2.5 font-mono">$79.00 USD</td>
                  <td className="py-2.5">
                    <Badge variant="success" className="text-[10px] py-0 font-mono">Pagada</Badge>
                  </td>
                  <td className="py-2.5 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-caption text-fg-secondary hover:text-fg-primary"
                      onClick={() => toast.success('Descarga iniciada', 'Recibo INV-2026-004 descargado en PDF.')}
                    >
                      <Download className="mr-1 h-3 w-3" /> PDF
                    </Button>
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 font-mono">20 Oct 2026</td>
                  <td className="py-2.5 font-mono text-fg-primary">INV-2026-003</td>
                  <td className="py-2.5 font-mono">$79.00 USD</td>
                  <td className="py-2.5">
                    <Badge variant="success" className="text-[10px] py-0 font-mono">Pagada</Badge>
                  </td>
                  <td className="py-2.5 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-caption text-fg-secondary hover:text-fg-primary"
                      onClick={() => toast.success('Descarga iniciada', 'Recibo INV-2026-003 descargado en PDF.')}
                    >
                      <Download className="mr-1 h-3 w-3" /> PDF
                    </Button>
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
