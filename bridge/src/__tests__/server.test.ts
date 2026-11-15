import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createBridgeServer } from '../server.js';

describe('Local Agent Bridge HTTP API', () => {
  const config = {
    port: 8799,
    host: '127.0.0.1',
    authorizedDirectories: [process.cwd()],
    backendUrl: 'http://localhost:3001',
    allowStdioExecution: true,
  };

  const { fastify, processManager } = createBridgeServer(config);

  beforeAll(async () => {
    await fastify.ready();
  });

  afterAll(async () => {
    processManager.stopAll();
    await fastify.close();
  });

  it('GET /health returns healthy status and platform details', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe('healthy');
    expect(body.role).toBe('NEXORA Local Agent Bridge');
  });

  it('GET /status returns active configuration and processes', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/status',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe('connected');
    expect(body.bridgePort).toBe(8799);
    expect(body.allowStdioExecution).toBe(true);
  });

  it('blocks spawn when command is disallowed by Sandbox', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/mcp/spawn',
      payload: {
        id: 'bad-proc',
        name: 'Malicious Command',
        command: 'rm',
        args: ['-rf', '/'],
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('no permitido por política de Sandbox');
  });

  it('enforces Bearer token authentication when configured', async () => {
    const authConfig = {
      port: 8798,
      host: '127.0.0.1',
      authorizedDirectories: [process.cwd()],
      backendUrl: 'http://localhost:3001',
      allowStdioExecution: true,
      token: 'secret-test-token-1234',
    };

    const secureInstance = createBridgeServer(authConfig);
    await secureInstance.fastify.ready();

    // 1. Health is public without token
    const healthRes = await secureInstance.fastify.inject({
      method: 'GET',
      url: '/health',
    });
    expect(healthRes.statusCode).toBe(200);

    // 2. Protected endpoint without token returns 401
    const unauthRes = await secureInstance.fastify.inject({
      method: 'GET',
      url: '/status',
    });
    expect(unauthRes.statusCode).toBe(401);

    // 3. Protected endpoint with invalid token returns 401
    const badTokenRes = await secureInstance.fastify.inject({
      method: 'GET',
      url: '/status',
      headers: { authorization: 'Bearer wrong-token' },
    });
    expect(badTokenRes.statusCode).toBe(401);

    // 4. Protected endpoint with valid token returns 200
    const validRes = await secureInstance.fastify.inject({
      method: 'GET',
      url: '/status',
      headers: { authorization: 'Bearer secret-test-token-1234' },
    });
    expect(validRes.statusCode).toBe(200);

    await secureInstance.fastify.close();
  });
});
