import { db } from '../db/connection.js';
import * as schema from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { APICredential } from '../types.js';
import { NotFoundError } from '../lib/errors.js';
import { encrypt, decrypt } from '../lib/crypto.js';
import { v4 as uuidv4 } from 'uuid';

export function maskApiKey(apiKey: string): string {
  if (!apiKey) return '';
  const trimmed = apiKey.trim();
  if (trimmed.length <= 8) {
    return '••••••••';
  }
  const prefix = trimmed.startsWith('sk-') ? 'sk-' : trimmed.slice(0, 3);
  const suffix = trimmed.slice(-4);
  return `${prefix}••••${suffix}`;
}

export const credentialsService = {
  async getAll(): Promise<APICredential[]> {
    const list = db.select().from(schema.apiCredentials).all();
    return list.map((c) => ({
      id: c.id,
      name: c.name,
      providerId: c.providerId,
      maskedKey: c.maskedKey,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  },

  async getById(id: string): Promise<APICredential> {
    const c = db.select().from(schema.apiCredentials).where(eq(schema.apiCredentials.id, id)).get();
    if (!c) {
      throw new NotFoundError('Credencial API', id);
    }
    return {
      id: c.id,
      name: c.name,
      providerId: c.providerId,
      maskedKey: c.maskedKey,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  },

  async create(data: { name: string; providerId: string; apiKey: string }): Promise<APICredential> {
    const id = `cred-${Date.now()}-${uuidv4().slice(0, 8)}`;
    const now = new Date().toISOString();
    const encryptedKey = encrypt(data.apiKey.trim());
    const maskedKey = maskApiKey(data.apiKey);

    db.insert(schema.apiCredentials).values({
      id,
      name: data.name.trim(),
      providerId: data.providerId.trim(),
      encryptedKey,
      maskedKey,
      createdAt: now,
      updatedAt: now,
    }).run();

    return {
      id,
      name: data.name.trim(),
      providerId: data.providerId.trim(),
      maskedKey,
      createdAt: now,
      updatedAt: now,
    };
  },

  async delete(id: string): Promise<{ success: boolean }> {
    const existing = db.select().from(schema.apiCredentials).where(eq(schema.apiCredentials.id, id)).get();
    if (!existing) {
      throw new NotFoundError('Credencial API', id);
    }

    // Desvincular agentes que usen esta credencial para evitar referencias huérfanas
    db.update(schema.agents)
      .set({ credentialId: null })
      .where(eq(schema.agents.credentialId, id))
      .run();

    db.delete(schema.apiCredentials).where(eq(schema.apiCredentials.id, id)).run();
    return { success: true };
  },

  getDecryptedKey(id: string): string {
    const c = db.select().from(schema.apiCredentials).where(eq(schema.apiCredentials.id, id)).get();
    if (!c) {
      throw new NotFoundError('Credencial API', id);
    }
    return decrypt(c.encryptedKey);
  },
};
