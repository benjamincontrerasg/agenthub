import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../../index';
import { signJWT } from '../../lib/jwt';
import { workflowService } from '../../services/workflow.service';

describe('SaaS Webhook Trigger API for CI/CD (/v1/workflows/:id/trigger)', () => {
  let app: FastifyInstance;
  let testWorkflowId: string;
  let validToken: string;

  beforeAll(async () => {
    app = await buildApp({ logger: false });
    validToken = signJWT({
      id: 'usr_test_ci',
      email: 'ci@nexora.dev',
      name: 'CI Bot',
      role: 'developer',
    });

    const allWfs = await workflowService.getAll();
    if (allWfs.length > 0) {
      testWorkflowId = allWfs[0].id;
    } else {
      const created = await workflowService.save({
        name: 'CI/CD Automation Pipeline',
        description: 'Testing webhook triggers',
        version: '1.0.0',
        status: 'active',
        nodes: [],
        edges: [],
      } as any);
      testWorkflowId = created.id;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('rechaza con 401 Unauthorized si se llama sin Authorization ni cabecera X-Workflow-Key', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/v1/workflows/${testWorkflowId}/trigger`,
      payload: { ref: 'main' },
    });

    expect(res.statusCode).toBe(401);
  });

  it('permite disparo externo inmediato usando cabecera X-Workflow-Key (sin Bearer)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/v1/workflows/${testWorkflowId}/trigger`,
      headers: {
        'x-workflow-key': 'whsec_prod_live_abc123456789',
      },
      payload: {
        commitSha: 'a1b2c3d4',
        environment: 'staging',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.executionId).toBeDefined();
    expect(body.status).toBe('running');
  });

  it('permite disparo usando token JWT estándar de usuario', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/v1/workflows/${testWorkflowId}/trigger`,
      headers: {
        authorization: `Bearer ${validToken}`,
      },
      payload: {
        triggeredBy: 'manual-cli',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
  });

  it('devuelve 404 si el workflow no existe', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/workflows/wf-non-existent-999/trigger',
      headers: {
        'x-workflow-key': 'whsec_valid_key_123',
      },
    });

    expect(res.statusCode).toBe(404);
  });
});
