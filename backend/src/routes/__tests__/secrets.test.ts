import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../../index.js';
import { signJWT } from '../../lib/jwt.js';

describe('SaaS Secrets & Environment Variables API (/v1/secrets)', () => {
  let app: FastifyInstance;
  let adminToken: string;

  beforeAll(async () => {
    app = await buildApp({ logger: false });
    await app.ready();
    adminToken = signJWT({
      id: 'usr-admin-1',
      email: 'admin@nexora.dev',
      role: 'admin',
      name: 'Admin Test',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /v1/secrets requiere token de autenticación JWT', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/secrets',
    });

    expect(res.statusCode).toBe(401);
  });

  it('GET /v1/secrets devuelve la lista de secretos ofuscados con token válido', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/secrets',
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(1);
    expect(body[0]).toHaveProperty('name');
    expect(body[0]).toHaveProperty('maskedValue');
  });

  it('POST /v1/secrets crea o actualiza un secreto cifrado', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/secrets',
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
      payload: {
        name: 'GITHUB_ACCESS_TOKEN',
        value: 'ghp_1234567890abcdef1234567890abcdef',
        description: 'Token de acceso para repositorios GitHub',
        category: 'auth',
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.name).toBe('GITHUB_ACCESS_TOKEN');
    expect(body.category).toBe('auth');
    expect(body.maskedValue).toContain('••••');
  });

  it('POST /v1/secrets/:name/reveal descifra y revela el valor en texto plano', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/secrets/GITHUB_ACCESS_TOKEN/reveal',
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.name).toBe('GITHUB_ACCESS_TOKEN');
    expect(body.value).toBe('ghp_1234567890abcdef1234567890abcdef');
  });

  it('DELETE /v1/secrets/:name elimina el secreto de forma segura', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/v1/secrets/GITHUB_ACCESS_TOKEN',
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
  });
});
