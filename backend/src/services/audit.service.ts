import { db } from '../db/connection.js';
import * as schema from '../db/schema.js';
import { desc, eq } from 'drizzle-orm';

export interface AuditLogEntry {
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

export const auditService = {
  async log(data: {
    userId?: string;
    userEmail?: string;
    action: string;
    resource: string;
    ip?: string;
    status?: 'success' | 'failure' | 'pending';
    details?: Record<string, any>;
  }): Promise<AuditLogEntry> {
    const id = `audit-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const timestamp = new Date().toISOString();
    const status = data.status || 'success';

    db.insert(schema.auditLogs).values({
      id,
      userId: data.userId ?? null,
      userEmail: data.userEmail ?? null,
      action: data.action,
      resource: data.resource,
      ip: data.ip ?? null,
      status,
      details: data.details ? JSON.stringify(data.details) : null,
      timestamp,
    }).run();

    return {
      id,
      userId: data.userId,
      userEmail: data.userEmail,
      action: data.action,
      resource: data.resource,
      ip: data.ip,
      status,
      details: data.details,
      timestamp,
    };
  },

  async getLogs(options: { limit?: number; action?: string; userId?: string } = {}): Promise<AuditLogEntry[]> {
    const limit = options.limit || 50;

    let rows;
    if (options.action) {
      rows = db.select()
        .from(schema.auditLogs)
        .where(eq(schema.auditLogs.action, options.action))
        .orderBy(desc(schema.auditLogs.timestamp))
        .limit(limit)
        .all();
    } else {
      rows = db.select()
        .from(schema.auditLogs)
        .orderBy(desc(schema.auditLogs.timestamp))
        .limit(limit)
        .all();
    }

    return rows.map((r) => {
      let details: Record<string, any> | undefined;
      try {
        if (r.details) details = JSON.parse(r.details);
      } catch {}

      return {
        id: r.id,
        userId: r.userId ?? undefined,
        userEmail: r.userEmail ?? undefined,
        action: r.action,
        resource: r.resource,
        ip: r.ip ?? undefined,
        status: r.status as any,
        details,
        timestamp: r.timestamp,
      };
    });
  },
};
