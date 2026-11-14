import { describe, it, expect, beforeEach } from 'vitest';
import {
  mcpService,
  setMockMode,
  resetMockServers,
} from '../mcp.service';

describe('MCP Service (Mock Mode & Operations)', () => {
  beforeEach(() => {
    setMockMode(true);
    resetMockServers();
  });

  it('retrieves all mock MCP servers', async () => {
    const list = await mcpService.getServers();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThanOrEqual(1);

    const fs = list.find((s) => s.transport === 'stdio');
    expect(fs).toBeDefined();
  });

  it('registers a new MCP server with pending_validation state', async () => {
    const server = await mcpService.registerServer({
      name: 'Docker MCP Server',
      description: 'Gestor seguro de contenedores Docker',
      transport: 'stdio',
      commandOrEndpoint: 'docker run -i --rm mcp/docker',
    });

    expect(server.id).toBeDefined();
    expect(server.status).toBe('pending_validation');
    expect(server.isActivated).toBe(false);

    const list = await mcpService.getServers();
    expect(list.some((s) => s.id === server.id)).toBe(true);
  });

  it('validates an MCP server and marks it connected', async () => {
    const list = await mcpService.getServers();
    const first = list[0];

    const res = await mcpService.validateServer(first.id);
    expect(res.success).toBe(true);

    const updatedList = await mcpService.getServers();
    const target = updatedList.find((s) => s.id === first.id);
    expect(target?.status).toBe('connected');
    expect(target?.isActivated).toBe(true);
  });

  it('toggles server activation', async () => {
    const list = await mcpService.getServers();
    const first = list[0];

    await mcpService.toggleActivation(first.id, false);
    let updated = await mcpService.getServers();
    expect(updated.find((s) => s.id === first.id)?.isActivated).toBe(false);

    await mcpService.toggleActivation(first.id, true);
    updated = await mcpService.getServers();
    expect(updated.find((s) => s.id === first.id)?.isActivated).toBe(true);
  });

  it('deletes an MCP server', async () => {
    const listBefore = await mcpService.getServers();
    const toDelete = listBefore[0];

    const res = await mcpService.deleteServer(toDelete.id);
    expect(res.success).toBe(true);

    const listAfter = await mcpService.getServers();
    expect(listAfter.some((s) => s.id === toDelete.id)).toBe(false);
  });
});
