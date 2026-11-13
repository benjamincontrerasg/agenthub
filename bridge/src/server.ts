import Fastify from 'fastify';
import cors from '@fastify/cors';
import { SecuritySandbox } from './sandbox.js';
import { MCPProcessManager } from './process-manager.js';
import { BridgeConfig, SpawnRequest, JSONRPCRequest } from './types.js';

export function createBridgeServer(config: BridgeConfig) {
  const fastify = Fastify({ logger: false });
  const sandbox = new SecuritySandbox(config.authorizedDirectories);
  const processManager = new MCPProcessManager(sandbox);

  // Setup CORS to allow AgentHub frontend & backend requests
  fastify.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // Health / Status Ping
  fastify.get('/health', async () => ({
    status: 'healthy',
    role: 'AgentHub Local Agent Bridge',
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
  fastify.post<{ Body: { processId: string; request: JSONRPCRequest } }>('/mcp/call', async (req, reply) => {
    try {
      const { processId, request } = req.body;
      const response = await processManager.sendJSONRPC(processId, request);
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
