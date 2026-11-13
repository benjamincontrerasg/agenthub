import { describe, it, expect } from 'vitest';
import { useMCPStore } from '../mcp.store';

describe('MCP Hub Store', () => {
  it('loads initial registered MCP servers', () => {
    const servers = useMCPStore.getState().servers;
    expect(servers.length).toBeGreaterThanOrEqual(3);

    const filesystem = servers.find((s) => s.id === 'mcp-filesystem');
    expect(filesystem).toBeDefined();
    expect(filesystem?.transport).toBe('stdio');
  });

  it('registers a new MCP server with pending_validation state (Zero-Trust)', () => {
    const newServer = useMCPStore.getState().addServer({
      name: 'Redis MCP Cache',
      description: 'Acceso a llaves Redis en memoria',
      transport: 'stdio',
      commandOrEndpoint: 'npx -y @modelcontextprotocol/server-redis redis://localhost:6379',
    });

    expect(newServer.status).toBe('pending_validation');
    expect(newServer.isActivated).toBe(false);
  });

  it('validates and activates a server', async () => {
    const server = useMCPStore.getState().servers[0];
    const res = await useMCPStore.getState().validateServer(server.id);

    expect(res.success).toBe(true);
    const updated = useMCPStore.getState().servers.find((s) => s.id === server.id);
    expect(updated?.status).toBe('connected');
    expect(updated?.isActivated).toBe(true);
  });
});

