import { apiClient } from './api';

export interface AuditLogItem {
  id: string;
  userId?: string;
  userEmail?: string;
  action: string;
  resource: string;
  ip?: string;
  status: 'success' | 'failure' | 'pending';
  details?: Record<string, any>;
  timestamp: string;
}

const mockAuditLogs: AuditLogItem[] = [
  {
    id: 'audit-demo-1',
    userId: 'usr-admin-01',
    userEmail: 'admin@agenthub.dev',
    action: 'security_gate.approved',
    resource: 'mcp:tool:write_file',
    ip: '127.0.0.1',
    status: 'success',
    details: { toolName: 'write_file', target: 'src/index.ts', approver: 'Administrador SecOps' },
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: 'audit-demo-2',
    userId: 'usr-admin-01',
    userEmail: 'admin@agenthub.dev',
    action: 'auth.login',
    resource: 'system:auth',
    ip: '127.0.0.1',
    status: 'success',
    details: { role: 'admin' },
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: 'audit-demo-3',
    userEmail: 'attacker@unknown.net',
    action: 'auth.login',
    resource: 'system:auth',
    ip: '198.51.100.23',
    status: 'failure',
    details: { reason: 'Credenciales inválidas / Bloqueado por Rate Limiting' },
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 'audit-demo-4',
    userId: 'usr-dev-01',
    userEmail: 'dev@agenthub.dev',
    action: 'mcp.server_register',
    resource: 'mcp:server:docker_engine',
    ip: '127.0.0.1',
    status: 'success',
    details: { transport: 'stdio' },
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
  },
];

export const auditService = {
  async getLogs(options: { limit?: number; action?: string } = {}): Promise<AuditLogItem[]> {
    if (import.meta.env.VITE_USE_MOCK !== 'false') {
      let filtered = [...mockAuditLogs];
      if (options.action) {
        filtered = filtered.filter((l) => l.action === options.action);
      }
      return filtered.slice(0, options.limit || 50);
    }

    const params: Record<string, any> = {};
    if (options.limit) params.limit = options.limit;
    if (options.action) params.action = options.action;

    return apiClient<AuditLogItem[]>('/audit/logs', { params });
  },
};
