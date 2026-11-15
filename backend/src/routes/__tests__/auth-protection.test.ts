import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../index.js';
import { signJWT, AuthUser } from '../../lib/jwt.js';
import WebSocket from 'ws';
import { FastifyInstance } from 'fastify';

describe('PASO 1 — Protección de Autenticación JWT en Backend y WebSocket', () => {
  let app: FastifyInstance;
  let serverAddress: string;
  let port: number;

  const testUser: AuthUser = {
    id: 'user-sec-01',
    email: 'sec-tester@nexora.dev',
    name: 'Security Auditor',
    role: 'admin',
    organizationId: 'org-test',
  };

  const validToken = signJWT(testUser);

  beforeAll(async () => {
    app = await buildApp({ logger: false });
    serverAddress = await app.listen({ port: 0, host: '127.0.0.1' });
    const addr = app.server.address() as any;
    port = addr.port;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Control de Acceso en Rutas HTTP', () => {
    it('rechaza GET /v1/providers sin token con 401 y formato JSON consistente', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/providers',
      });

      expect(res.statusCode).toBe(401);
      const json = res.json();
      expect(json.code).toBe('UNAUTHORIZED');
      expect(json.message).toContain('Authorization');
    });

    it('rechaza POST /v1/providers/openai/connect sin token con 401', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/providers/openai/connect',
        payload: { apiKey: 'sk-test-falsa-123' },
      });

      expect(res.statusCode).toBe(401);
      const json = res.json();
      expect(json.code).toBe('UNAUTHORIZED');
    });

    it('rechaza DELETE /v1/providers/openai/connect sin token con 401', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: '/v1/providers/openai/connect',
      });

      expect(res.statusCode).toBe(401);
      const json = res.json();
      expect(json.code).toBe('UNAUTHORIZED');
    });

    it('rechaza DELETE /v1/providers/openai/credentials sin token con 401', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: '/v1/providers/openai/credentials',
      });

      expect(res.statusCode).toBe(401);
      const json = res.json();
      expect(json.code).toBe('UNAUTHORIZED');
    });

    it('rechaza rutas registradas en la raíz (/providers) sin token con 401', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/providers',
      });

      expect(res.statusCode).toBe(401);
      const json = res.json();
      expect(json.code).toBe('UNAUTHORIZED');
    });

    it('rechaza peticiones con token mal formado o firma inválida con 401', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/providers',
        headers: {
          authorization: 'Bearer token-falso-invalido.123.456',
        },
      });

      expect(res.statusCode).toBe(401);
      const json = res.json();
      expect(json.code).toBe('UNAUTHORIZED');
      expect(json.message).toContain('inválido');
    });

    it('rechaza peticiones con token expirado con 401', async () => {
      // Token expirado hace 1 hora
      const expiredToken = signJWT(testUser, -3600);

      const res = await app.inject({
        method: 'GET',
        url: '/v1/providers',
        headers: {
          authorization: `Bearer ${expiredToken}`,
        },
      });

      expect(res.statusCode).toBe(401);
      const json = res.json();
      expect(json.code).toBe('UNAUTHORIZED');
    });

    it('permite acceso sin token a la lista blanca pública (GET /health)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.status).toBe('healthy');
    });

    it('permite acceso sin token a la lista blanca pública (POST /auth/login)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email: 'bad@test.com', password: 'password123' },
      });

      // Debe llegar al controlador de auth (retorna INVALID_CREDENTIALS, no error de bearer token)
      expect(res.statusCode).toBe(401);
      const json = res.json();
      expect(json.code).toBe('INVALID_CREDENTIALS');
    });

    it('permite acceso con token válido a GET /v1/providers y retorna 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/providers',
        headers: {
          authorization: `Bearer ${validToken}`,
        },
      });

      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(Array.isArray(json)).toBe(true);
      expect(json.length).toBeGreaterThan(0);
    });

    it('permite acceso con token válido a /auth/me y entrega datos del usuario decodificado', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/auth/me',
        headers: {
          authorization: `Bearer ${validToken}`,
        },
      });

      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.user.id).toBe(testUser.id);
      expect(json.user.email).toBe(testUser.email);
      expect(json.user.role).toBe(testUser.role);
    });
  });

  describe('Protección del Canal WebSocket (/ws)', () => {
    it('cierra la conexión WebSocket si se conecta sin token ni autenticación', async () => {
      const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`);

      const closePromise = new Promise<{ code: number; reason: string }>((resolve) => {
        ws.on('close', (code, reason) => {
          resolve({ code, reason: reason.toString() });
        });
      });

      const { code } = await closePromise;
      expect(code).toBe(1008); // Policy Violation
    });

    it('cierra la conexión WebSocket inmediatamente si el token en query es inválido', async () => {
      const ws = new WebSocket(`ws://127.0.0.1:${port}/ws?token=token-falso-invalido`);

      const closePromise = new Promise<{ code: number; reason: string }>((resolve) => {
        ws.on('close', (code, reason) => {
          resolve({ code, reason: reason.toString() });
        });
      });

      const { code } = await closePromise;
      expect(code).toBe(1008);
    });

    it('acepta la conexión WebSocket con token válido en query (?token=...) y recibe evento de bienvenida', async () => {
      const ws = new WebSocket(`ws://127.0.0.1:${port}/ws?token=${validToken}`);

      const messagePromise = new Promise<any>((resolve) => {
        ws.on('message', (data) => {
          resolve(JSON.parse(data.toString()));
        });
      });

      const event = await messagePromise;
      expect(event.type).toBe('agent.message');
      expect(event.payload.senderName).toBe('NEXORA Gateway');

      ws.close();
    });

    it('acepta la conexión WebSocket si se autentica mediante el primer mensaje ({ type: "auth", token })', async () => {
      const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`);

      const messagePromise = new Promise<any>((resolve) => {
        ws.on('open', () => {
          // Enviar primer mensaje de autenticación
          ws.send(JSON.stringify({ type: 'auth', token: validToken }));
        });

        ws.on('message', (data) => {
          resolve(JSON.parse(data.toString()));
        });
      });

      const event = await messagePromise;
      expect(event.type).toBe('agent.message');
      expect(event.payload.senderName).toBe('NEXORA Gateway');

      ws.close();
    });
  });
});
