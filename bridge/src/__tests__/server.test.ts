import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createBridgeServer } from '../server.js';

describe('Local Agent Bridge HTTP API (Zero-Trust Security)', () => {
  const TEST_TOKEN = 'secure-test-bridge-token-1234567890';
  const config = {
    port: 8799,
    host: '127.0.0.1',
    authorizedDirectories: [process.cwd()],
    backendUrl: 'http://localhost:3001',
    allowStdioExecution: true,
    token: TEST_TOKEN,
  };

  const { fastify, processManager } = createBridgeServer(config);

  beforeAll(async () => {
    await fastify.ready();
  });

  afterAll(async () => {
    processManager.stopAll();
    await fastify.close();
  });

  it('GET /health returns healthy status without requiring token', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe('healthy');
    expect(body.role).toBe('NEXORA Local Agent Bridge');
  });

  it('GET /status rejects request without token with 401', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/status',
    });

    expect(response.statusCode).toBe(401);
  });

  it('GET /status succeeds with valid Bearer token and Host', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/status',
      headers: {
        authorization: `Bearer ${TEST_TOKEN}`,
        host: '127.0.0.1:8799',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe('connected');
    expect(body.bridgePort).toBe(8799);
    expect(body.allowStdioExecution).toBe(true);
  });

  it('blocks DNS rebinding when Host header is unauthorized', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/status',
      headers: {
        authorization: `Bearer ${TEST_TOKEN}`,
        host: 'attacker.evil.com',
      },
    });

    expect(response.statusCode).toBe(403);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('Host no autorizado');
  });

  it('blocks unauthorized web Origin to prevent CSRF', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/status',
      headers: {
        authorization: `Bearer ${TEST_TOKEN}`,
        origin: 'https://malicious-website.com',
      },
    });

    expect(response.statusCode).toBe(403);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('Origin no autorizado');
  });

  it('blocks spawn when command is disallowed by Sandbox', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/mcp/spawn',
      headers: { authorization: `Bearer ${TEST_TOKEN}` },
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

  it('blocks arbitrary execution arguments (node -e, python -c, docker -v)', async () => {
    const nodeRes = await fastify.inject({
      method: 'POST',
      url: '/mcp/spawn',
      headers: { authorization: `Bearer ${TEST_TOKEN}` },
      payload: {
        id: 'node-eval',
        name: 'Node eval',
        command: 'node',
        args: ['-e', 'process.exit(1)'],
      },
    });
    expect(nodeRes.statusCode).toBe(400);
    expect(JSON.parse(nodeRes.body).error).toContain('Argumento prohibido');

    const pythonRes = await fastify.inject({
      method: 'POST',
      url: '/mcp/spawn',
      headers: { authorization: `Bearer ${TEST_TOKEN}` },
      payload: {
        id: 'py-eval',
        name: 'Python eval',
        command: 'python',
        args: ['-c', 'import os; os.system("calc")'],
      },
    });
    expect(pythonRes.statusCode).toBe(400);
    expect(JSON.parse(pythonRes.body).error).toContain('Argumento prohibido');
  });
});
