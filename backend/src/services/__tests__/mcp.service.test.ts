import { describe, it, expect } from 'vitest';
import { mcpService } from '../mcp.service.js';

describe('MCP Service (Zero-Trust Lifecycle)', () => {
  it('registers new servers with pending_validation and deactivated status', async () => {
    const server = await mcpService.registerServer({
      name: 'Kubernetes Cluster MCP',
      description: 'Gestión de pods y deployments K8s',
      transport: 'streamable-http',
      commandOrEndpoint: 'https://k8s-mcp.internal/mcp',
      allowedDirectories: ['/etc/kubernetes'],
    });

    expect(server.id).toBeDefined();
    expect(server.status).toBe('pending_validation');
    expect(server.isActivated).toBe(false);
  });

  it('validates and activates an MCP server', async () => {
    const server = await mcpService.registerServer({
      name: 'Redis Cache MCP',
      description: 'Operaciones en memoria Redis',
      transport: 'stdio',
      commandOrEndpoint: 'redis-mcp',
    });

    const validation = await mcpService.validateServer(server.id);
    expect(validation.success).toBe(true);

    const all = await mcpService.getAll();
    const updated = all.find((s) => s.id === server.id);
    expect(updated?.status).toBe('connected');
    expect(updated?.isActivated).toBe(true);
    expect(updated?.tools.length).toBeGreaterThan(0);
  });

  it('allows toggling activation on and off', async () => {
    const all = await mcpService.getAll();
    const target = all[0];

    const deactRes = await mcpService.toggleActivation(target.id, false);
    expect(deactRes.success).toBe(true);

    const actRes = await mcpService.toggleActivation(target.id, true);
    expect(actRes.success).toBe(true);
  });
});
