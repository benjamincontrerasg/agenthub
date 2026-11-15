import { describe, it, expect, beforeEach } from 'vitest';
import { auditService } from '../audit.service.js';
import { seedDatabase } from '../../db/seed.js';

describe('Zero-Trust Audit Log Service', () => {
  beforeEach(async () => {
    await seedDatabase();
  });

  it('records audit events accurately with timestamp and details', async () => {
    const entry = await auditService.log({
      userId: 'user-sec-01',
      userEmail: 'sec@agenthub.dev',
      action: 'security_gate.approved',
      resource: 'mcp:tool:docker_build',
      status: 'success',
      details: { environment: 'production', approvedBy: 'SecOps Officer' },
    });

    expect(entry.id).toBeDefined();
    expect(entry.action).toBe('security_gate.approved');
    expect(entry.status).toBe('success');
    expect(entry.details?.environment).toBe('production');

    const logs = await auditService.getLogs({ limit: 10 });
    expect(logs.length).toBeGreaterThanOrEqual(1);
    expect(logs.some((l) => l.id === entry.id)).toBe(true);
  });

  it('filters audit logs by action', async () => {
    await auditService.log({
      action: 'auth.login',
      resource: 'system:auth',
      status: 'success',
    });

    const authLogs = await auditService.getLogs({ action: 'auth.login' });
    expect(authLogs.length).toBeGreaterThan(0);
    expect(authLogs.every((l) => l.action === 'auth.login')).toBe(true);
  });
});
