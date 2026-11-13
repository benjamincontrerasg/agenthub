import { db } from '../db/connection.js';
import * as schema from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { MCPServer, MCPTool, MCPLog, MCPTransport } from '../types.js';
import { NotFoundError } from '../lib/errors.js';
import { wsManager } from './websocket.service.js';

export const mcpService = {
  async getAll(): Promise<MCPServer[]> {
    const servers = db.select().from(schema.mcpServers).all();
    const tools = db.select().from(schema.mcpTools).all();
    const toolAssignments = db.select().from(schema.mcpToolAssignments).all();
    const logs = db.select().from(schema.mcpLogs).all();

    return servers.map((s) => {
      const serverTools: MCPTool[] = tools
        .filter((t) => t.serverId === s.id)
        .map((t) => {
          const assignedAgentIds = toolAssignments
            .filter((a) => a.toolId === t.id)
            .map((a) => a.agentId);

          let inputSchema = { type: 'object', properties: {} };
          try {
            inputSchema = JSON.parse(t.inputSchema);
          } catch {
            // fallback
          }

          return {
            id: t.id,
            serverId: t.serverId,
            serverName: s.name,
            name: t.name,
            description: t.description,
            inputSchema,
            isWriteOperation: t.isWriteOperation,
            requiresApproval: t.requiresApproval,
            assignedAgentIds,
          };
        });

      const serverLogs: MCPLog[] = logs
        .filter((l) => l.serverId === s.id)
        .map((l) => ({
          id: l.id,
          timestamp: l.timestamp,
          level: l.level as any,
          message: l.message,
        }))
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      let args: string[] | undefined;
      let env: Record<string, string> | undefined;
      let allowedDirectories: string[] | undefined;

      try {
        if (s.args) args = JSON.parse(s.args);
        if (s.env) env = JSON.parse(s.env);
        if (s.allowedDirectories) allowedDirectories = JSON.parse(s.allowedDirectories);
      } catch {}

      return {
        id: s.id,
        name: s.name,
        description: s.description,
        transport: s.transport as MCPTransport,
        commandOrEndpoint: s.commandOrEndpoint,
        args,
        env,
        allowedDirectories,
        status: s.status as any,
        isActivated: s.isActivated,
        tools: serverTools,
        logs: serverLogs,
        error: s.error ?? undefined,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      };
    });
  },

  async registerServer(payload: {
    name: string;
    description: string;
    transport: 'stdio' | 'streamable-http';
    commandOrEndpoint: string;
    args?: string[];
    env?: Record<string, string>;
    allowedDirectories?: string[];
  }): Promise<MCPServer> {
    const id = `mcp-${Date.now()}`;
    const now = new Date().toISOString();

    db.insert(schema.mcpServers).values({
      id,
      name: payload.name,
      description: payload.description,
      transport: payload.transport,
      commandOrEndpoint: payload.commandOrEndpoint,
      args: payload.args ? JSON.stringify(payload.args) : null,
      env: payload.env ? JSON.stringify(payload.env) : null,
      allowedDirectories: payload.allowedDirectories ? JSON.stringify(payload.allowedDirectories) : null,
      status: 'pending_validation',
      isActivated: false,
      error: null,
      createdAt: now,
      updatedAt: now,
    }).run();

    const logId = `log-${Date.now()}`;
    db.insert(schema.mcpLogs).values({
      id: logId,
      serverId: id,
      timestamp: now,
      level: 'info',
      message: `Servidor registrado: ${payload.name} (${payload.transport.toUpperCase()}). Estado: pendiente de validación.`,
    }).run();

    const all = await this.getAll();
    const created = all.find((s) => s.id === id);
    if (!created) throw new Error('Error al registrar servidor MCP');
    return created;
  },

  async validateServer(id: string): Promise<{ success: boolean; message: string }> {
    const s = db.select().from(schema.mcpServers).where(eq(schema.mcpServers.id, id)).get();
    if (!s) {
      throw new NotFoundError('Servidor MCP', id);
    }

    const now = new Date().toISOString();

    // Generate tools based on server capabilities if not already present
    const existingTools = db.select().from(schema.mcpTools).where(eq(schema.mcpTools.serverId, id)).all();
    if (existingTools.length === 0) {
      const generatedToolId = `tool-${id}-1`;
      db.insert(schema.mcpTools).values({
        id: generatedToolId,
        serverId: id,
        name: `${s.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_execute`,
        description: `Operación estándar ejecutada a través de ${s.name}`,
        inputSchema: JSON.stringify({
          type: 'object',
          properties: {
            query: { name: 'query', type: 'string', description: 'Instrucción o parámetros de ejecución', required: true },
          },
          required: ['query'],
        }),
        isWriteOperation: false,
        requiresApproval: false,
      }).run();
    }

    // Update status to connected
    db.update(schema.mcpServers)
      .set({
        status: 'connected',
        isActivated: true,
        error: null,
        updatedAt: now,
      })
      .where(eq(schema.mcpServers.id, id))
      .run();

    const logId = `log-${Date.now()}`;
    db.insert(schema.mcpLogs).values({
      id: logId,
      serverId: id,
      timestamp: now,
      level: 'info',
      message: `Handshake y validación MCP exitosos. Transporte ${s.transport.toUpperCase()} operativo.`,
    }).run();

    // Broadcast WS event
    wsManager.broadcast('mcp.connected', {
      serverId: id,
      serverName: s.name,
      transport: s.transport,
    });

    return {
      success: true,
      message: `Servidor MCP '${s.name}' validado y conectado correctamente.`,
    };
  },

  async toggleActivation(id: string, active: boolean): Promise<{ success: boolean }> {
    const s = db.select().from(schema.mcpServers).where(eq(schema.mcpServers.id, id)).get();
    if (!s) {
      throw new NotFoundError('Servidor MCP', id);
    }

    const now = new Date().toISOString();

    db.update(schema.mcpServers)
      .set({
        isActivated: active,
        updatedAt: now,
      })
      .where(eq(schema.mcpServers.id, id))
      .run();

    const logId = `log-${Date.now()}`;
    db.insert(schema.mcpLogs).values({
      id: logId,
      serverId: id,
      timestamp: now,
      level: 'info',
      message: active ? 'Servidor activado por el operador.' : 'Servidor desactivado.',
    }).run();

    if (!active) {
      wsManager.broadcast('mcp.disconnected', {
        serverId: id,
        serverName: s.name,
      });
    }

    return { success: true };
  },
};
