import Fastify from 'fastify';
import cors from '@fastify/cors';
import { SecuritySandbox } from './sandbox.js';
import { MCPProcessManager } from './process-manager.js';
import { BridgeConfig, SpawnRequest, JSONRPCRequest } from './types.js';

export function createBridgeServer(config: BridgeConfig) {
  const fastify = Fastify({ logger: false });
  const sandbox = new SecuritySandbox(config.authorizedDirectories);
  const processManager = new MCPProcessManager(sandbox);

  // Setup CORS to allow NEXORA frontend & backend requests
  fastify.register(cors, {
    origin: (origin, cb) => {
      // Reject unauthorized origins and DNS rebinding
      if (!origin) {
        return cb(null, true);
      }
      try {
        const parsed = new URL(origin);
        const allowedHosts = ['localhost', '127.0.0.1'];
        if (allowedHosts.includes(parsed.hostname)) {
          return cb(null, true);
        }
      } catch {}
      return cb(new Error('Origin no autorizado por política Zero-Trust'), false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // Zero-Trust Shared Token Authentication for Local Bridge (Obligatorio)
  const authToken = config.token || process.env.BRIDGE_TOKEN;
  if (!authToken && process.env.NODE_ENV === 'production') {
    throw new Error('BRIDGE_TOKEN es obligatorio en entornos productivos para prevenir accesos no autorizados.');
  }

  fastify.addHook('preHandler', async (req, reply) => {
    // Validar cabecera Host para prevenir ataques de DNS Rebinding
    const host = req.headers.host;
    if (host) {
      const hostname = host.split(':')[0];
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return reply.status(403).send({
          error: 'Host no autorizado. Solo conexiones directas a localhost o 127.0.0.1 están permitidas.',
        });
      }
    }

    if (req.url === '/health') return;

    if (authToken) {
      const authHeader = req.headers.authorization;
      if (!authHeader || authHeader !== `Bearer ${authToken}`) {
        return reply.status(401).send({
          error: 'No autorizado. Se requiere token Bearer válido para acceder al Local Bridge.',
        });
      }
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
    authorizedDirectories: sandbox.getAuthorizedDirectories(),
    activeProcessesCount: processManager.listProcesses().filter((p) => p.status === 'running').length,
    activeProcesses: processManager.listProcesses(),
  }));

  // List Processes
  fastify.get('/mcp/processes', async () => {
    return processManager.listProcesses();
  });

  // Spawn MCP Server
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
