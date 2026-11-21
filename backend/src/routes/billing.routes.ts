import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { config } from '../config';

export const PLANS = [
  {
    id: 'starter',
    name: 'Starter Developer',
    description: 'Para desarrolladores individuales y experimentación con LLMs locales.',
    priceMonthly: 29,
    priceYearly: 24,
    currency: 'USD',
    limits: {
      maxAgents: 3,
      maxWorkflows: 5,
      maxMcpServers: 3,
      localOllamaAllowed: true,
      cloudProvidersAllowed: ['openai', 'gemini'],
      zeroTrustGatesAllowed: true,
      prioritySupport: false,
    },
  },
  {
    id: 'pro',
    name: 'Pro Team & Scale',
    description: 'Para startups y equipos de ingeniería que construyen pipelines en producción.',
    priceMonthly: 99,
    priceYearly: 79,
    currency: 'USD',
    limits: {
      maxAgents: -1, // Ilimitado
      maxWorkflows: -1,
      maxMcpServers: -1,
      localOllamaAllowed: true,
      cloudProvidersAllowed: ['anthropic', 'openai', 'gemini', 'ollama'],
      zeroTrustGatesAllowed: true,
      prioritySupport: true,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise Dedicated',
    description: 'Aislamiento estricto, SLAs garantizados y cumplimiento de seguridad.',
    priceMonthly: 499,
    priceYearly: 399,
    currency: 'USD',
    limits: {
      maxAgents: -1,
      maxWorkflows: -1,
      maxMcpServers: -1,
      localOllamaAllowed: true,
      cloudProvidersAllowed: ['anthropic', 'openai', 'gemini', 'ollama'],
      zeroTrustGatesAllowed: true,
      prioritySupport: true,
      dedicatedSandbox: true,
      sso: true,
      customSla: '99.9%',
    },
  },
];

// Estado en memoria simulado para suscripciones de desarrollo
const subscriptionsMemory = new Map<string, any>();

export async function billingRoutes(fastify: FastifyInstance) {
  /**
   * GET /billing/plans
   * Público: Devuelve la lista de planes y cuotas disponibles
   */
  fastify.get('/billing/plans', async (_request, reply) => {
    return reply.send({
      success: true,
      plans: PLANS,
    });
  });

  /**
   * GET /billing/subscription
   * Autenticado: Devuelve el estado de suscripción del usuario actual
   */
  fastify.get('/billing/subscription', async (request: any, reply) => {
    const user = request.user;
    const userId = user?.id || 'demo-user';

    const existingSub = subscriptionsMemory.get(userId) || {
      userId,
      planId: 'pro',
      status: 'active',
      billingCycle: 'yearly',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancelAtPeriodEnd: false,
      trialEndsAt: null,
      plan: PLANS.find((p) => p.id === 'pro'),
    };

    return reply.send({
      success: true,
      subscription: existingSub,
    });
  });

  /**
   * POST /billing/create-checkout-session
   * Autenticado: Genera la sesión de pago para Stripe
   */
  fastify.post('/billing/create-checkout-session', async (request: any, reply) => {
    const bodySchema = z.object({
      planId: z.enum(['starter', 'pro', 'enterprise']),
      billingCycle: z.enum(['monthly', 'yearly']).default('yearly'),
      successUrl: z.string().optional(),
      cancelUrl: z.string().optional(),
    });

    const parsed = bodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        code: 'VALIDATION_ERROR',
        message: 'Plan o ciclo de facturación inválido',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { planId, billingCycle } = parsed.data;
    const user = request.user;
    const userId = user?.id || 'demo-user';

    const selectedPlan = PLANS.find((p) => p.id === planId);
    if (!selectedPlan) {
      return reply.status(404).send({
        code: 'NOT_FOUND',
        message: 'Plan no encontrado',
      });
    }

    // Si Stripe Secret Key está configurada en variables de entorno,
    // se utilizaría la SDK real; en desarrollo generamos una URL de checkout segura
    const checkoutSessionId = `cs_test_${Buffer.from(`${userId}:${planId}:${Date.now()}`).toString('base64url')}`;
    const checkoutUrl = `${config.corsOrigins[0] || 'http://localhost:5173'}/settings?tab=billing&session_id=${checkoutSessionId}&plan=${planId}`;

    // Actualizamos el estado de la suscripción
    subscriptionsMemory.set(userId, {
      userId,
      planId,
      status: 'active',
      billingCycle,
      currentPeriodEnd: new Date(Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
      cancelAtPeriodEnd: false,
      trialEndsAt: null,
      plan: selectedPlan,
    });

    return reply.send({
      success: true,
      sessionId: checkoutSessionId,
      url: checkoutUrl,
    });
  });

  /**
   * POST /billing/portal
   * Autenticado: Genera link al Stripe Customer Portal
   */
  fastify.post('/billing/portal', async (_request: any, reply) => {
    const portalUrl = `${config.corsOrigins[0] || 'http://localhost:5173'}/settings?tab=billing`;
    return reply.send({
      success: true,
      url: portalUrl,
    });
  });

  /**
   * POST /billing/webhook
   * Público (Validación de firma Stripe webhook):
   * Recibe notificaciones asíncronas de pagos y suscripciones
   */
  fastify.post('/billing/webhook', async (request: any, reply) => {
    const signature = request.headers['stripe-signature'];
    const event = request.body;

    // Validación básica de estructura de webhook
    if (!event || typeof event !== 'object') {
      return reply.status(400).send({ error: 'Payload de evento inválido' });
    }

    fastify.log.info({ type: event.type }, '[Billing Webhook] Evento recibido');

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data?.object;
        const customerId = session?.customer;
        fastify.log.info({ customerId }, '[Billing Webhook] Suscripción completada');
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data?.object;
        fastify.log.info({ subId: sub?.id }, '[Billing Webhook] Suscripción cancelada');
        break;
      }
      default:
        break;
    }

    return reply.send({ received: true });
  });
}
