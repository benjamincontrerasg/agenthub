import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  Zap,
  Shield,
  Layers,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Code2,
  Terminal,
  Cpu,
  Sparkles,
  Lock,
  Globe,
  Sliders,
  DollarSign,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const plans = [
    {
      id: 'starter',
      name: 'Starter Developer',
      description: 'Ideal para desarrolladores individuales y proyectos experimentales con LLMs locales.',
      priceMonthly: 29,
      priceYearly: 24,
      badge: null,
      features: [
        'Hasta 3 agentes autónomos simultáneos',
        'Hasta 5 workflows interactivos',
        'Conexión local a Ollama ilimitada (cero costo)',
        'Hasta 3 servidores MCP locales (STDIO)',
        'Cifrado AES-256-GCM para API Keys',
        'Soporte comunitario en Discord y GitHub',
      ],
      ctaText: 'Comenzar con Starter',
      ctaVariant: 'outline' as const,
      popular: false,
    },
    {
      id: 'pro',
      name: 'Pro Team & Scale',
      description: 'Para startups y equipos de ingeniería que construyen pipelines de producción.',
      priceMonthly: 99,
      priceYearly: 79,
      badge: 'Más Popular',
      features: [
        'Agentes autónomos ilimitados',
        'Workflows y grafos ilimitados',
        'Soporte Multi-Cerebro: Claude 3.7, GPT-4o, Gemini 2.5, Ollama',
        'Servidores MCP ilimitados (STDIO + HTTP)',
        'Puntos de control Zero-Trust con aprobación humana',
        'Webhooks de ejecución y triggers automáticos',
        'Auditoría criptográfica completa y métricas de tokens',
        'Soporte prioritario por correo y canal dedicado',
      ],
      ctaText: 'Prueba Gratis de 14 Días',
      ctaVariant: 'default' as const,
      popular: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise Dedicated',
      description: 'Aislamiento estricto, SLAs garantizados y cumplimiento de seguridad para grandes organizaciones.',
      priceMonthly: 499,
      priceYearly: 399,
      badge: 'Zero-Trust Total',
      features: [
        'Todo lo incluido en Pro sin límites de volumen',
        'Multi-tenancy aislado con base de datos dedicada',
        'Sandbox bridge dedicado on-premise o en nube privada (AWS/GCP)',
        'Autenticación empresarial SSO / SAML / OIDC',
        'Garantía de SLA 99.9% de disponibilidad',
        'Auditorías SOC2 / HIPAA compliance blueprint',
        'Soporte técnico 24/7 con Solutions Architect asignado',
      ],
      ctaText: 'Contactar a Ventas',
      ctaVariant: 'outline' as const,
      popular: false,
    },
  ];

  const faqs = [
    {
      q: '¿Puedo utilizar mis propios modelos locales con Ollama sin costo de tokens?',
      a: 'Absolutamente. NEXORA cuenta con un adaptador nativo de Ollama de latencia ultra-baja. Puedes ejecutar Llama 3, DeepSeek, CodeLlama o cualquier modelo local directamente en tu hardware sin enviar un solo byte a la nube y con costo $0 en tokens.',
    },
    {
      q: '¿Cómo se protegen mis API Keys sensibles de OpenAI, Anthropic y Gemini?',
      a: 'Aplicamos criptografía de nivel militar: derivación de claves scrypt con salt aleatorio de 16 bytes y cifrado AES-256-GCM en reposo. Las credenciales nunca se transmiten al navegador cliente ni se registran en los logs del servidor.',
    },
    {
      q: '¿Qué es el Model Context Protocol (MCP) y por qué es fundamental?',
      a: 'MCP es el estándar abierto impulsado por Anthropic para que los agentes interactúen con herramientas del mundo real (sistemas de archivos, terminales, bases de datos y APIs) de forma homogénea y segura mediante un sandbox controlado.',
    },
    {
      q: '¿Qué significa la arquitectura Zero-Trust en los workflows?',
      a: 'Cualquier acción potencialmente destructiva (como escribir en disco, modificar código de producción o disparar despliegues) puede configurarse para requerir una puerta de Aprobación Humana explícita antes de que el pipeline proceda.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#08090a] text-[#f7f8f8] selection:bg-[#e4f222] selection:text-[#08090a]">
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-violet-950/60 via-purple-900/40 to-slate-900/60 border-b border-purple-500/20 px-4 py-2 text-center text-xs text-purple-200 flex items-center justify-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-[#e4f222]" />
        <span>NEXORA 2.0 ya disponible con soporte completo de Claude 3.7, Ollama local y MCP Zero-Trust.</span>
        <button
          onClick={() => navigate('/login')}
          className="underline font-semibold hover:text-white transition-colors cursor-pointer ml-1"
        >
          Probar ahora &rarr;
        </button>
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#08090a]/80 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#e4f222] to-amber-500 p-0.5 flex items-center justify-center shadow-lg shadow-[#e4f222]/20">
              <div className="w-full h-full bg-[#08090a] rounded-[6px] flex items-center justify-center">
                <Bot className="h-4 w-4 text-[#e4f222]" />
              </div>
            </div>
            <span className="font-mono text-lg font-bold tracking-tight text-white">NEXORA</span>
            <Badge variant="outline" className="border-[#e4f222]/30 text-[#e4f222] text-[10px] font-mono py-0">
              SaaS v2.0
            </Badge>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#8a8f98]">
            <a href="#features" className="hover:text-white transition-colors">Características</a>
            <a href="#architecture" className="hover:text-white transition-colors">Arquitectura</a>
            <a href="#pricing" className="hover:text-white transition-colors">Precios</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/login')}
              className="text-[#d0d6e0] hover:text-white hover:bg-white/[0.05]"
            >
              Iniciar Sesión
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate('/login')}
              className="bg-[#e4f222] text-[#08090a] hover:bg-[#d6e41b] font-medium shadow-lg shadow-[#e4f222]/15"
            >
              Comenzar Gratis
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-purple-600/15 via-[#e4f222]/10 to-indigo-600/15 blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-600/10 blur-[100px] pointer-events-none rounded-full" />

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.1] bg-white/[0.03] backdrop-blur-md mb-8">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono text-[#d0d6e0]">Sistema Operativo para Equipos de Agentes Autónomos</span>
            <ChevronRight className="h-3.5 w-3.5 text-[#8a8f98]" />
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] mb-6">
            Orquesta Agentes de IA.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e4f222] via-amber-300 to-yellow-500">
              Conectados. Seguros.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-[#8a8f98] max-w-3xl mx-auto leading-relaxed mb-10">
            Conecta <span className="text-[#d0d6e0]">Claude, OpenAI, Gemini y Ollama local</span> en una sola plataforma. Diseña flujos colaborativos complejos con herramientas MCP bajo una arquitectura Zero-Trust estricta.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button
              size="lg"
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto bg-[#e4f222] text-[#08090a] hover:bg-[#d6e41b] font-semibold text-base px-8 h-12 shadow-xl shadow-[#e4f222]/20 gap-2"
            >
              Empezar Prueba Gratuita
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                const el = document.getElementById('architecture');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto border-white/[0.12] bg-white/[0.02] hover:bg-white/[0.06] text-white text-base h-12 px-6"
            >
              Explorar Arquitectura
            </Button>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-mono text-[#62666d] border-t border-white/[0.06] pt-8">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-emerald-400" />
              <span>Cifrado AES-256-GCM en reposo</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#e4f222]" />
              <span>Zero-Trust Human Approvals</span>
            </div>
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-indigo-400" />
              <span>Ollama Local con costo $0</span>
            </div>
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-purple-400" />
              <span>100% TypeScript + Model Context Protocol</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Workflow Visual Showcase */}
      <section id="architecture" className="py-20 border-t border-white/[0.06] bg-[#0c0d0e]/60 relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <Badge variant="outline" className="border-purple-500/30 text-purple-300 font-mono text-xs mb-3">
              Flujos Colaborativos en Tiempo Real
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
              De la Idea al Código de Producción en un Grafo Visual
            </h2>
            <p className="text-base text-[#8a8f98] max-w-2xl mx-auto">
              Cada agente cumple un rol específico en el pipeline. Las herramientas MCP ejecutan acciones en sandbox y la puerta de aprobación humana garantiza control absoluto.
            </p>
          </div>

          {/* Workflow Canvas Mockup */}
          <div className="relative rounded-2xl border border-white/[0.1] bg-[#08090a] p-6 sm:p-10 shadow-2xl overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              {/* Step 1: Start & Architect */}
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.04] space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="success" className="text-[10px] font-mono">Paso 1 · Trigger</Badge>
                  <Cpu className="h-4 w-4 text-emerald-400" />
                </div>
                <h4 className="font-semibold text-white text-sm">Architect Agent</h4>
                <p className="text-xs text-[#8a8f98]">Diseña arquitectura de solución y especificación técnica de la API.</p>
                <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 pt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Inferencia OpenAI / Claude
                </div>
              </div>

              {/* Step 2: Developer */}
              <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/[0.04] space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="info" className="text-[10px] font-mono">Paso 2 · Code</Badge>
                  <Code2 className="h-4 w-4 text-blue-400" />
                </div>
                <h4 className="font-semibold text-white text-sm">Developer Agent</h4>
                <p className="text-xs text-[#8a8f98]">Genera la implementación modular con TypeScript y tests unitarios.</p>
                <div className="text-[10px] font-mono text-blue-400 flex items-center gap-1 pt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Ollama Local (Llama 3)
                </div>
              </div>

              {/* Step 3: MCP Security Tool */}
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/[0.04] space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="warning" className="text-[10px] font-mono">Paso 3 · MCP Sandbox</Badge>
                  <Terminal className="h-4 w-4 text-amber-400" />
                </div>
                <h4 className="font-semibold text-white text-sm">MCP FS & Run Tests</h4>
                <p className="text-xs text-[#8a8f98]">Ejecuta Vitest en el sandbox aislado y audita vulnerabilidades.</p>
                <div className="text-[10px] font-mono text-amber-400 flex items-center gap-1 pt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Timeout 10s · Binario node
                </div>
              </div>

              {/* Step 4: Human Gate */}
              <div className="p-4 rounded-xl border border-[#e4f222]/40 bg-[#e4f222]/[0.05] space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="default" className="text-[10px] font-mono bg-[#e4f222] text-[#08090a]">Paso 4 · Zero-Trust</Badge>
                  <Shield className="h-4 w-4 text-[#e4f222]" />
                </div>
                <h4 className="font-semibold text-white text-sm">Aprobación Humana</h4>
                <p className="text-xs text-[#8a8f98]">El operador confirma la escritura en producción antes de continuar.</p>
                <div className="text-[10px] font-mono text-[#e4f222] flex items-center gap-1 pt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e4f222]" /> Esperando confirmación
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <Badge variant="outline" className="border-[#e4f222]/30 text-[#e4f222] font-mono text-xs mb-3">
            Plataforma Integral
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            Todo lo que necesitas para escalar tu flota de agentes
          </h2>
          <p className="text-base sm:text-lg text-[#8a8f98] max-w-2xl mx-auto">
            Diseñado desde cero para ingenieros de software, analistas de ciberseguridad y equipos de operaciones de IA.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-[#0c0d0e] border-white/[0.08] p-6 hover:border-white/[0.16] transition-all">
            <CardContent className="p-0 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Bot className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">Multi-Proveedor Unificado</h3>
              <p className="text-sm text-[#8a8f98] leading-relaxed">
                Combina la potencia de Claude 3.7 con la velocidad de Gemini 2.5 y la privacidad de Ollama en el mismo pipeline de trabajo.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#0c0d0e] border-white/[0.08] p-6 hover:border-white/[0.16] transition-all">
            <CardContent className="p-0 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#e4f222]/10 border border-[#e4f222]/20 flex items-center justify-center text-[#e4f222]">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">Seguridad Zero-Trust & Sandbox</h3>
              <p className="text-sm text-[#8a8f98] leading-relaxed">
                Aislamiento estricto de binarios STDIO mediante el Local Agent Bridge. Cero comandos no autorizados o rutas arbitrarias.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#0c0d0e] border-white/[0.08] p-6 hover:border-white/[0.16] transition-all">
            <CardContent className="p-0 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">Editor React Flow Adaptable</h3>
              <p className="text-sm text-[#8a8f98] leading-relaxed">
                Lienzo de grafos con auto-layout de cuadrícula responsive, auto-zoom adaptativo y conexiones inteligentes entre agentes.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#0c0d0e] border-white/[0.08] p-6 hover:border-white/[0.16] transition-all">
            <CardContent className="p-0 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">Bóveda Criptográfica en Reposo</h3>
              <p className="text-sm text-[#8a8f98] leading-relaxed">
                Tus claves privadas nunca viajan de regreso al cliente. Cifrado AES-256-GCM con rotación de claves en caliente sin downtime.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#0c0d0e] border-white/[0.08] p-6 hover:border-white/[0.16] transition-all">
            <CardContent className="p-0 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <DollarSign className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">Control de Tokens & Costos</h3>
              <p className="text-sm text-[#8a8f98] leading-relaxed">
                Gráficas en tiempo real de consumo por modelo y proveedor. Evita sorpresas en tu factura de APIs de inteligencia artificial.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#0c0d0e] border-white/[0.08] p-6 hover:border-white/[0.16] transition-all">
            <CardContent className="p-0 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">WebSocket Gateway Reactivo</h3>
              <p className="text-sm text-[#8a8f98] leading-relaxed">
                Canal bidireccional autenticado con JWT para streaming de respuestas, telemetría y ejecución en tiempo real de flujos.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Matrix */}
      <section id="pricing" className="py-24 border-t border-white/[0.06] bg-[#0c0d0e]/40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-300 font-mono text-xs mb-3">
              Planes Transparentes
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
              Comienza gratis, escala a producción
            </h2>
            <p className="text-base sm:text-lg text-[#8a8f98] max-w-xl mx-auto mb-8">
              Paga solo por lo que necesitas. Sin tarifas ocultas y con garantía de reembolso de 14 días.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-3 p-1 rounded-full border border-white/[0.08] bg-[#08090a]">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white/[0.1] text-white shadow-sm'
                    : 'text-[#8a8f98] hover:text-white'
                }`}
              >
                Facturación Mensual
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                  billingCycle === 'yearly'
                    ? 'bg-[#e4f222] text-[#08090a] font-semibold shadow-sm'
                    : 'text-[#8a8f98] hover:text-white'
                }`}
              >
                <span>Facturación Anual</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-bold">20% OFF</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {plans.map((plan) => {
              const price = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl border p-8 flex flex-col justify-between transition-all relative ${
                    plan.popular
                      ? 'border-[#e4f222] bg-[#08090a] shadow-2xl shadow-[#e4f222]/10 ring-1 ring-[#e4f222]/50'
                      : 'border-white/[0.08] bg-[#08090a]/80 hover:border-white/[0.16]'
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-[#e4f222] text-[#08090a] shadow-md">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                    <p className="text-sm text-[#8a8f98] min-h-[40px] leading-relaxed mb-6">
                      {plan.description}
                    </p>

                    <div className="flex items-baseline gap-1 mb-8 pb-6 border-b border-white/[0.06]">
                      <span className="text-4xl sm:text-5xl font-extrabold text-white font-mono">${price}</span>
                      <span className="text-sm text-[#8a8f98] font-mono">/ mes</span>
                      {billingCycle === 'yearly' && (
                        <span className="text-xs text-emerald-400 font-mono ml-2">facturado anualmente</span>
                      )}
                    </div>

                    <div className="space-y-3 mb-8">
                      <p className="text-xs font-semibold text-[#d0d6e0] uppercase tracking-wider font-mono">
                        Qué incluye:
                      </p>
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-sm text-[#8a8f98]">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="text-[#d0d6e0]">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant={plan.ctaVariant}
                    size="lg"
                    onClick={() => navigate(`/login?plan=${plan.id}`)}
                    className={`w-full font-semibold ${
                      plan.popular
                        ? 'bg-[#e4f222] text-[#08090a] hover:bg-[#d6e41b]'
                        : 'border-white/[0.12] hover:bg-white/[0.06] text-white'
                    }`}
                  >
                    {plan.ctaText}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section id="faq" className="py-24 max-w-4xl mx-auto px-6">
        <div className="text-center mb-14">
          <Badge variant="outline" className="border-white/[0.1] text-[#d0d6e0] font-mono text-xs mb-3">
            Preguntas Frecuentes
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
            Todo lo que necesitas saber
          </h2>
          <p className="text-sm sm:text-base text-[#8a8f98]">
            ¿Tienes dudas adicionales? Escríbenos a soporte@nexora.dev
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border border-white/[0.08] bg-[#0c0d0e] overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between text-sm sm:text-base font-semibold text-white hover:text-[#e4f222] transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-[#8a8f98] transition-transform duration-200 shrink-0 ml-4 ${
                      isOpen ? 'rotate-180 text-[#e4f222]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-sm text-[#8a8f98] leading-relaxed border-t border-white/[0.04] pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-20 border-t border-white/[0.06] relative overflow-hidden bg-gradient-to-b from-[#08090a] to-[#0f1012]">
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-6">
            Empieza a orquestar tus agentes de IA hoy mismo
          </h2>
          <p className="text-base sm:text-lg text-[#8a8f98] max-w-2xl mx-auto mb-8">
            Únete a cientos de desarrolladores y equipos que construyen flujos autónomos seguros con NEXORA.
          </p>
          <Button
            size="lg"
            onClick={() => navigate('/login')}
            className="bg-[#e4f222] text-[#08090a] hover:bg-[#d6e41b] font-semibold text-base px-10 h-12 shadow-xl shadow-[#e4f222]/20"
          >
            Crear Cuenta Gratuita
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] bg-[#08090a] py-12 text-xs text-[#62666d]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold text-white">NEXORA</span>
            <span>— Plataforma SaaS Multi-Agente & Orquestador Zero-Trust</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="https://github.com/benjamincontrerasg/nexora" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              GitHub
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              Precios
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
            <span>Licencia MIT</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
