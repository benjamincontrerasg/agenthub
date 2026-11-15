import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import crypto from 'crypto';
import { BridgeConfig, JSONRPCRequest, SpawnRequest } from './types.js';
import { MCPProcessManager } from './process-manager.js';
import { SecuritySandbox } from './sandbox.js';

export function createBridgeServer(config: BridgeConfig) {
  const fastify = Fastify({ logger: false });
  const sandbox = new SecuritySandbox(config.authorizedDirectories);
  const processManager = new MCPProcessManager(sandbox);

  // Setup CORS to allow NEXORA frontend & backend requests
  fastify.register(cors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      try {
        const u = new URL(origin);
        const host = u.hostname.toLowerCase();
        if (host === 'localhost' || host === '127.0.0.1') {
          return cb(null, true);
        }
      } catch {}
      return cb(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // Zero-Trust Shared Token Authentication for Local Bridge (Obligatorio)
  let authToken = config.token || process.env.BRIDGE_TOKEN;
  if (!authToken) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('BRIDGE_TOKEN es obligatorio en entornos productivos para prevenir accesos no autorizados.');
    }
    authToken = crypto.randomBytes(32).toString('hex');
    console.warn(`[Bridge Security] BRIDGE_TOKEN generado automáticamente para esta sesión: ${authToken}`);
  }

  fastify.addHook('preHandler', async (req, reply) => {
    // 1. Validar cabecera Host para prevenir ataques de DNS Rebinding
    const host = req.headers.host;
    if (host) {
      const hostname = host.split(':')[0].toLowerCase();
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return reply.status(403).send({
          error: 'Host no autorizado. Solo conexiones directas a localhost o 127.0.0.1 están permitidas.',
        });
      }
    }

    // 2. Validar cabecera Origin
    const origin = req.headers.origin;
    if (origin) {
      try {
        const u = new URL(origin);
        const oHost = u.hostname.toLowerCase();
        if (oHost !== 'localhost' && oHost !== '127.0.0.1') {
          return reply.status(403).send({
            error: 'Origin no autorizado por política Zero-Trust.',
          });
        }
      } catch {
        return reply.status(403).send({ error: 'Origin inválido.' });
      }
    }

    if (req.url === '/health') return;

    // 3. Comparación en tiempo constante con timingSafeEqual
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        error: 'No autorizado. Se requiere token Bearer válido para acceder al Local Bridge.',
      });
    }

    const provided = Buffer.from(authHeader.slice(7));
    const expected = Buffer.from(authToken);
    if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
      return reply.status(401).send({
        error: 'Token Bearer no válido o incorrecto.',
      });
    }
  });

  // Health / Status Ping
  fastify.get('/health', async () => ({
    status: 'healthy',
    role: 'NEXORA Local Agent Bridge',
    version: '0.1.0',
    platform: process.platform,
    arch: process.arch,
    pid: process.pid,
    timestamp: new Date().toISOString(),
  }));

  fastify.get('/status', async () => ({
    status: 'connected',
    bridgePort: config.port,
    platform: process.platform,
    allowStdioExecution: config.allowStdioExecution,
    activeProcesses: processManager.listProcesses(),
    authorizedDirectories: sandbox.getAuthorizedDirectories(),
  }));

  // List all running MCP processes
  fastify.get('/mcp/processes', async () => {
    return processManager.listProcesses();
  });

  // Spawn new local MCP process under sandbox confinement
  fastify.post<{ Body: SpawnRequest }>('/mcp/spawn', async (req, reply) => {
    if (!config.allowStdioExecution) {
      return reply.status(403).send({
        error: 'Ejecución STDIO deshabilitada en la configuración del Local Agent.',
      });
    }

    try {
      const info = processManager.spawnProcess(req.body);
      return { success: true, process: info };
    } catch (err: any) {
      return reply.status(400).send({
        error: err.message || 'Fallo al iniciar proceso MCP',
      });
    }
  });

  // Send JSON-RPC call to running MCP process
  fastify.post<{ Body: { processId: string; request: JSONRPCRequest; timeoutMs?: number } }>('/mcp/call', async (req, reply) => {
    try {
      const { processId, request, timeoutMs } = req.body;
      const response = await processManager.sendJSONRPC(processId, request, timeoutMs);
      return response;
    } catch (err: any) {
      return reply.status(500).send({
        error: err.message || 'Error en comunicación con proceso MCP',
      });
    }
  });

  // Stop MCP Process
  fastify.post<{ Body: { id: string } }>('/mcp/stop', async (req) => {
    const success = processManager.stopProcess(req.body.id);
    return { success };
  });

  // Update Authorized Sandbox Directories
  fastify.put<{ Body: { directories: string[] } }>('/sandbox/directories', async (req) => {
    sandbox.setAuthorizedDirectories(req.body.directories || []);
    return {
      success: true,
      authorizedDirectories: sandbox.getAuthorizedDirectories(),
    };
  });

  return { fastify, processManager, sandbox };
}
