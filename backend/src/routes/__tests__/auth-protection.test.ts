import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildApp } from '../../index.js';
import { signJWT, AuthUser } from '../../lib/jwt.js';
import { USERS, getDemoUsers, resetUsers } from '../auth.routes.js';
import WebSocket from 'ws';
import { FastifyInstance } from 'fastify';

describe('PASO 1 & 2 — Seguridad, Autenticación y Cuentas en Backend', () => {
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

  beforeEach(() => {
    resetUsers();
  });

  describe('PASO 1 — Control de Acceso en Rutas HTTP', () => {
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

  describe('PASO 1 — Protección del Canal WebSocket (/ws)', () => {
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

  describe('PASO 2 — Registro, Login y Hashing Seguro de Contraseñas', () => {
    it('login con admin@nexora.dev / admin123 en desarrollo devuelve token JWT y usuario admin', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'admin@nexora.dev',
          password: 'admin123',
        },
      });

      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.success).toBe(true);
      expect(json.token).toBeDefined();
      expect(json.user.email).toBe('admin@nexora.dev');
      expect(json.user.role).toBe('admin');
      expect(json.user.password).toBeUndefined();
      expect(json.user.passwordHash).toBeUndefined();
    });

    it('login normaliza emails en minúsculas (ADMIN@NEXORA.DEV funciona igual)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'ADMIN@NEXORA.DEV',
          password: 'admin123',
        },
      });

      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.success).toBe(true);
      expect(json.user.email).toBe('admin@nexora.dev');
    });

    it('login con dev@nexora.dev / dev123 devuelve token y rol developer', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'dev@nexora.dev',
          password: 'dev123',
        },
      });

      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.success).toBe(true);
      expect(json.user.role).toBe('developer');
    });

    it('registro con role:"owner" o "admin" NO otorga privilegios y asigna "viewer"', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'hacker@attacker.dev',
          password: 'password123',
          name: 'Privilege Escalation Attempt',
          role: 'owner', // Intento de escalamiento de privilegios
        },
      });

      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.success).toBe(true);
      expect(json.user.role).toBe('viewer'); // Servidor impone menor privilegio
      expect(json.user.role).not.toBe('owner');

      // Verificar en almacenamiento que se guardó como viewer y no tiene password en texto plano
      const saved = USERS['hacker@attacker.dev'];
      expect(saved.role).toBe('viewer');
      expect((saved as any).password).toBeUndefined();
      expect(saved.passwordHash).toBeDefined();
      expect(saved.passwordHash).toContain(':'); // Formato salt:derivedKey de scrypt
      expect(saved.passwordHash).not.toBe('password123');
    });

    it('el usuario registrado puede iniciar sesión inmediatamente con su contraseña', async () => {
      await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'newuser@nexora.dev',
          password: 'safePassword456',
          name: 'Nuevo Usuario',
        },
      });

      const loginRes = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'NEWUSER@NEXORA.DEV', // Probando insensibilidad a mayúsculas
          password: 'safePassword456',
        },
      });

      expect(loginRes.statusCode).toBe(200);
      const json = loginRes.json();
      expect(json.user.email).toBe('newuser@nexora.dev');
      expect(json.user.role).toBe('viewer');
    });

    it('devuelve exactamente el mismo error 401 para "usuario no existe" y "contraseña incorrecta" (anti-enumeración)', async () => {
      // Caso 1: Usuario inexistente
      const resNotExist = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'noexiste@nexora.dev',
          password: 'badPassword999',
        },
      });

      // Caso 2: Usuario existente con contraseña errónea
      const resWrongPass = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'admin@nexora.dev',
          password: 'incorrectPassword',
        },
      });

      expect(resNotExist.statusCode).toBe(401);
      expect(resWrongPass.statusCode).toBe(401);

      const jsonNotExist = resNotExist.json();
      const jsonWrongPass = resWrongPass.json();

      // Mismo código y mensaje para prevenir enumeración de usuarios
      expect(jsonNotExist.code).toBe('INVALID_CREDENTIALS');
      expect(jsonWrongPass.code).toBe('INVALID_CREDENTIALS');
      expect(jsonNotExist.message).toBe('Credenciales inválidas');
      expect(jsonWrongPass.message).toBe('Credenciales inválidas');
    });

    it('en entorno de producción (NODE_ENV=production) los usuarios demo no existen', () => {
      const origEnv = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = 'production';
        const prodUsers = getDemoUsers();
        expect(Object.keys(prodUsers).length).toBe(0);
        expect(prodUsers['admin@nexora.dev']).toBeUndefined();
      } finally {
        process.env.NODE_ENV = origEnv;
      }
    });
  });
});
