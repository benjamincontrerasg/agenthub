import { db } from '../db/connection.js';
import * as schema from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { NotFoundError } from '../lib/errors.js';
import { decrypt } from '../lib/crypto.js';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface AgentMemory {
  id: string;
  agentId: string;
  content: string;
  metadata?: Record<string, any>;
  embedding: number[];
  createdAt: string;
}

export interface MemorySearchResult extends AgentMemory {
  similarity: number;
}

/**
 * Computes cosine similarity between two float vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Deterministically generates a normalized 1536-dimensional mock embedding
 * for testing and offline/local development.
 */
export function generateMockEmbedding(text: string, dimensions = 1536): number[] {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  const vector: number[] = new Array(dimensions);
  let norm = 0;

  for (let i = 0; i < dimensions; i++) {
    const val = Math.sin(hash + i * 1.61803398875);
    vector[i] = val;
    norm += val * val;
  }

  const sqrtNorm = Math.sqrt(norm) || 1;
  return vector.map((v) => v / sqrtNorm);
}

/**
 * Genera embeddings vectoriales utilizando la API de OpenAI (text-embedding-3-small)
 * o Google Gemini (text-embedding-004) si sus credenciales están disponibles.
 * En ausencia de credenciales o en modo desconectado, recurre automáticamente
 * al generador local determinista.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // 1. Probar proveedor OpenAI
  try {
    const openaiProvider = db.select().from(schema.providers).where(eq(schema.providers.id, 'openai')).get();
    let openaiKey = openaiProvider?.encryptedApiKey ? decrypt(openaiProvider.encryptedApiKey) : undefined;
    if (!openaiKey) openaiKey = process.env.OPENAI_API_KEY;

    if (openaiKey) {
      const client = new OpenAI({ apiKey: openaiKey });
      const resp = await client.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });
      if (resp.data?.[0]?.embedding) {
        return resp.data[0].embedding;
      }
    }
  } catch (err) {
    console.warn('[Memory Service] Advertencia con OpenAI embeddings, recurriendo a fallback:', err);
  }

  // 2. Probar proveedor Google Gemini
  try {
    const geminiProvider = db.select().from(schema.providers).where(eq(schema.providers.id, 'gemini')).get();
    let geminiKey = geminiProvider?.encryptedApiKey ? decrypt(geminiProvider.encryptedApiKey) : undefined;
    if (!geminiKey) geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (geminiKey) {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
      const result = await model.embedContent(text);
      if (result.embedding?.values) {
        return result.embedding.values;
      }
    }
  } catch (err) {
    console.warn('[Memory Service] Advertencia con Gemini embeddings, recurriendo a fallback:', err);
  }

  // 3. Fallback determinista local
  return generateMockEmbedding(text);
}

export const memoryService = {
  async addMemory(data: {
    agentId: string;
    content: string;
    metadata?: Record<string, any>;
    embedding?: number[];
  }): Promise<AgentMemory> {
    const agent = db.select().from(schema.agents).where(eq(schema.agents.id, data.agentId)).get();
    if (!agent) {
      throw new NotFoundError('Agente', data.agentId);
    }

    const id = `mem-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();
    const embedding = data.embedding || (await generateEmbedding(data.content));

    db.insert(schema.agentMemories).values({
      id,
      agentId: data.agentId,
      content: data.content,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      embedding: JSON.stringify(embedding),
      createdAt: now,
    }).run();

    return {
      id,
      agentId: data.agentId,
      content: data.content,
      metadata: data.metadata,
      embedding,
      createdAt: now,
    };
  },

  async getMemories(agentId: string): Promise<AgentMemory[]> {
    const rows = db.select().from(schema.agentMemories).where(eq(schema.agentMemories.agentId, agentId)).all();

    return rows.map((r) => {
      let metadata: Record<string, any> | undefined;
      let embedding: number[] = [];
      try {
        if (r.metadata) metadata = JSON.parse(r.metadata);
        embedding = JSON.parse(r.embedding);
      } catch {}

      return {
        id: r.id,
        agentId: r.agentId,
        content: r.content,
        metadata,
        embedding,
        createdAt: r.createdAt,
      };
    });
  },

  async searchMemories(
    agentId: string,
    query: string,
    limit = 5,
    queryEmbedding?: number[]
  ): Promise<MemorySearchResult[]> {
    const memories = await this.getMemories(agentId);
    if (memories.length === 0) return [];

    const targetVector = queryEmbedding || (await generateEmbedding(query));

    const scored: MemorySearchResult[] = memories.map((mem) => {
      const similarity = cosineSimilarity(targetVector, mem.embedding);
      return {
        ...mem,
        similarity,
      };
    });

    // Sort descending by cosine similarity
    scored.sort((a, b) => b.similarity - a.similarity);

    return scored.slice(0, limit);
  },

  async deleteMemory(id: string): Promise<{ success: boolean }> {
    const existing = db.select().from(schema.agentMemories).where(eq(schema.agentMemories.id, id)).get();
    if (!existing) {
      throw new NotFoundError('Memoria', id);
    }

    db.delete(schema.agentMemories).where(eq(schema.agentMemories.id, id)).run();
    return { success: true };
  },
};
