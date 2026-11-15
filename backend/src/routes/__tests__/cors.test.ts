import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../index.js';
import { FastifyInstance } from 'fastify';

describe('PASO 4 — Política Estricta de CORS (Cross-Origin Resource Sharing)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp({ logger: false });
  });

  afterAll(async () => {
    await app.close();
  });

  it('permite origen autorizado (http://localhost:5173) y responde con Access-Control-Allow-Origin', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health',
      headers: {
        origin: 'http://localhost:5173',
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('permite preflight OPTIONS desde origen autorizado (http://localhost:5173)', async () => {
    const res = await app.inject({
      method: 'OPTIONS',
      url: '/health',
      headers: {
        origin: 'http://localhost:5173',
        'access-control-request-method': 'GET',
      },
    });

    expect(res.statusCode).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('bloquea origen no autorizado (https://evil.example) y NO devuelve Access-Control-Allow-Origin', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health',
      headers: {
        origin: 'https://evil.example',
      },
    });

    expect(res.statusCode).toBe(200); // La petición puede llegar al servidor, pero el navegador bloquea la lectura
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
    expect(res.headers['access-control-allow-credentials']).toBeUndefined();
  });

  it('bloquea preflight OPTIONS desde origen no autorizado (https://evil.example)', async () => {
    const res = await app.inject({
      method: 'OPTIONS',
      url: '/health',
      headers: {
        origin: 'https://evil.example',
        'access-control-request-method': 'GET',
      },
    });

    // En preflight no autorizado, Fastify CORS no emite el header de permiso
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
    expect(res.headers['access-control-allow-credentials']).toBeUndefined();
  });
});
