import { db } from '../db/connection.js';
import * as schema from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { Agent, AgentRole, ProviderId } from '../types.js';
import { NotFoundError } from '../lib/errors.js';
import { v4 as uuidv4 } from 'uuid';

export const agentService = {
  async getAll(): Promise<Agent[]> {
    const allAgents = db.select().from(schema.agents).all();
    const allAllowedTools = db.select().from(schema.agentAllowedTools).all();
    const allCommunications = db.select().from(schema.agentCommunications).all();
    const allCredentials = db.select().from(schema.apiCredentials).all();

    return allAgents.map((a) => {
      const allowedToolIds = allAllowedTools
        .filter((t) => t.agentId === a.id)
        .map((t) => t.toolId);
      const allowedAgentCommunicationIds = allCommunications
        .filter((c) => c.agentId === a.id)
        .map((c) => c.targetAgentId);
      const cred = a.credentialId ? allCredentials.find((c) => c.id === a.credentialId) : undefined;

      return {
        id: a.id,
        name: a.name,
        description: a.description,
        role: a.role as AgentRole,
        providerId: a.providerId as ProviderId,
        credentialId: a.credentialId ?? undefined,
        credentialName: cred?.name,
        modelId: a.modelId,
        systemPrompt: a.systemPrompt,
        temperature: a.temperature,
        maxIterations: a.maxIterations,
        allowedToolIds,
        allowedAgentCommunicationIds,
        status: a.status as any,
        avatarUrl: a.avatarUrl ?? undefined,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        stats: {
          totalRuns: a.totalRuns,
          avgDurationSec: a.avgDurationSec,
          totalTokens: a.totalTokens,
          successRate: a.successRate,
        },
      };
    });
  },

  async getById(id: string): Promise<Agent> {
    const a = db.select().from(schema.agents).where(eq(schema.agents.id, id)).get();
    if (!a) {
      throw new NotFoundError('Agente', id);
    }

    const allowedToolIds = db
      .select()
      .from(schema.agentAllowedTools)
      .where(eq(schema.agentAllowedTools.agentId, id))
      .all()
      .map((t) => t.toolId);

    const allowedAgentCommunicationIds = db
      .select()
      .from(schema.agentCommunications)
      .where(eq(schema.agentCommunications.agentId, id))
      .all()
      .map((c) => c.targetAgentId);

    let credentialName: string | undefined;
    if (a.credentialId) {
      const cred = db.select().from(schema.apiCredentials).where(eq(schema.apiCredentials.id, a.credentialId)).get();
      credentialName = cred?.name;
    }

    return {
      id: a.id,
      name: a.name,
      description: a.description,
      role: a.role as AgentRole,
      providerId: a.providerId as ProviderId,
      credentialId: a.credentialId ?? undefined,
      credentialName,
      modelId: a.modelId,
      systemPrompt: a.systemPrompt,
      temperature: a.temperature,
      maxIterations: a.maxIterations,
      allowedToolIds,
      allowedAgentCommunicationIds,
      status: a.status as any,
      avatarUrl: a.avatarUrl ?? undefined,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      stats: {
        totalRuns: a.totalRuns,
        avgDurationSec: a.avgDurationSec,
        totalTokens: a.totalTokens,
        successRate: a.successRate,
      },
    };
  },

  async create(data: {
    name: string;
    description: string;
    role: string;
    providerId: string;
    credentialId?: string | null;
    modelId: string;
    systemPrompt: string;
    temperature?: number;
    maxIterations?: number;
    allowedToolIds?: string[];
    allowedAgentCommunicationIds?: string[];
    status?: string;
    avatarUrl?: string;
  }): Promise<Agent> {
    const id = `agent-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    db.insert(schema.agents).values({
      id,
      name: data.name,
      description: data.description,
      role: data.role,
      providerId: data.providerId,
      credentialId: data.credentialId ?? null,
      modelId: data.modelId,
      systemPrompt: data.systemPrompt,
      temperature: data.temperature ?? 0.7,
      maxIterations: data.maxIterations ?? 10,
      status: (data.status as any) ?? 'idle',
      avatarUrl: data.avatarUrl ?? null,
      totalRuns: 0,
      avgDurationSec: 0,
      totalTokens: 0,
      successRate: 100,
      createdAt: now,
      updatedAt: now,
    }).run();

    if (data.allowedToolIds && data.allowedToolIds.length > 0) {
      for (const toolId of data.allowedToolIds) {
        db.insert(schema.agentAllowedTools).values({
          agentId: id,
          toolId,
        }).run();
      }
    }

    if (data.allowedAgentCommunicationIds && data.allowedAgentCommunicationIds.length > 0) {
      for (const targetAgentId of data.allowedAgentCommunicationIds) {
        db.insert(schema.agentCommunications).values({
          agentId: id,
          targetAgentId,
        }).run();
      }
    }

    return this.getById(id);
  },

  async update(id: string, updates: Partial<Agent>): Promise<Agent> {
    const existing = db.select().from(schema.agents).where(eq(schema.agents.id, id)).get();
    if (!existing) {
      throw new NotFoundError('Agente', id);
    }

    const now = new Date().toISOString();

    db.update(schema.agents)
      .set({
        name: updates.name ?? existing.name,
        description: updates.description ?? existing.description,
        role: updates.role ?? existing.role,
        providerId: updates.providerId ?? existing.providerId,
        credentialId: updates.credentialId !== undefined ? updates.credentialId : existing.credentialId,
        modelId: updates.modelId ?? existing.modelId,
        systemPrompt: updates.systemPrompt ?? existing.systemPrompt,
        temperature: updates.temperature ?? existing.temperature,
        maxIterations: updates.maxIterations ?? existing.maxIterations,
        status: (updates.status as any) ?? existing.status,
        avatarUrl: updates.avatarUrl ?? existing.avatarUrl,
        updatedAt: now,
      })
      .where(eq(schema.agents.id, id))
      .run();

    if (updates.allowedToolIds !== undefined) {
      db.delete(schema.agentAllowedTools).where(eq(schema.agentAllowedTools.agentId, id)).run();
      for (const toolId of updates.allowedToolIds) {
        db.insert(schema.agentAllowedTools).values({ agentId: id, toolId }).run();
      }
    }

    if (updates.allowedAgentCommunicationIds !== undefined) {
      db.delete(schema.agentCommunications).where(eq(schema.agentCommunications.agentId, id)).run();
      for (const targetAgentId of updates.allowedAgentCommunicationIds) {
        db.insert(schema.agentCommunications).values({ agentId: id, targetAgentId }).run();
      }
    }

    return this.getById(id);
  },

  async delete(id: string): Promise<{ success: boolean }> {
    const existing = db.select().from(schema.agents).where(eq(schema.agents.id, id)).get();
    if (!existing) {
      throw new NotFoundError('Agente', id);
    }

    db.delete(schema.agents).where(eq(schema.agents.id, id)).run();
    return { success: true };
  },
};
