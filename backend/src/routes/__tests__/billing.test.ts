import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../../index';
import { signJWT } from '../../lib/jwt';

describe('SaaS Billing & Subscriptions API (/v1/billing)', () => {
  let app: FastifyInstance;
  let validToken: string;

  beforeAll(async () => {
    app = await buildApp({ logger: false });
    validToken = signJWT({
      id: 'usr_test_billing',
      email: 'founder@nexora.dev',
      name: 'Founder Nexora',
      role: 'admin',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /v1/billing/plans es público y retorna los 3 planes de suscripción (Starter, Pro, Enterprise)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/billing/plans',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.plans).toHaveLength(3);

    const planIds = body.plans.map((p: any) => p.id);
    expect(planIds).toContain('starter');
    expect(planIds).toContain('pro');
    expect(planIds).toContain('enterprise');

    const starter = body.plans.find((p: any) => p.id === 'starter');
    expect(starter.limits.maxAgents).toBe(3);
    expect(starter.limits.localOllamaAllowed).toBe(true);
  });

  it('GET /v1/billing/subscription exige autenticación JWT (401 si no hay token)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/billing/subscription',
    });

    expect(res.statusCode).toBe(401);
  });

  it('GET /v1/billing/subscription retorna la suscripción activa con token válido', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/billing/subscription',
      headers: {
        authorization: `Bearer ${validToken}`,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.subscription.status).toBe('active');
    expect(body.subscription.plan.id).toBeDefined();
  });

  it('POST /v1/billing/create-checkout-session genera sesión de pago y URL de redirección', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/billing/create-checkout-session',
      headers: {
        authorization: `Bearer ${validToken}`,
      },
      payload: {
        planId: 'pro',
        billingCycle: 'yearly',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.sessionId).toBeDefined();
    expect(body.url).toContain('/settings?tab=billing');
  });

  it('POST /v1/billing/webhook procesa eventos de Stripe de forma segura', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/billing/webhook',
      headers: {
        'stripe-signature': 't=12345,v1=fake_signature',
      },
      payload: {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            customer: 'cus_test_abc',
          },
        },
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.received).toBe(true);
  });
});
