import { describe, it, expect, beforeEach } from 'vitest';
import {
  memoryService,
  cosineSimilarity,
  generateMockEmbedding,
} from '../memory.service.js';
import { agentService } from '../agent.service.js';
import { seedDatabase } from '../../db/seed.js';
import { db } from '../../db/connection.js';
import * as schema from '../../db/schema.js';

describe('Semantic Memory & RAG Service (pgvector vector search)', () => {
  let testAgentId: string;

  beforeEach(async () => {
    await seedDatabase();
    db.delete(schema.agentMemories).run();
    const agents = await agentService.getAll();
    testAgentId = agents[0].id;
  });

  it('calculates cosine similarity accurately', () => {
    // Identical vectors should have similarity = 1
    const vecA = [1, 0, 0];
    const vecB = [1, 0, 0];
    expect(cosineSimilarity(vecA, vecB)).toBeCloseTo(1.0, 5);

    // Orthogonal vectors should have similarity = 0
    const vecC = [0, 1, 0];
    expect(cosineSimilarity(vecA, vecC)).toBeCloseTo(0.0, 5);

    // Opposite vectors should have similarity = -1
    const vecD = [-1, 0, 0];
    expect(cosineSimilarity(vecA, vecD)).toBeCloseTo(-1.0, 5);
  });

  it('generates normalized 1536-dim embeddings', () => {
    const emb = generateMockEmbedding('Arquitectura limpia y patrones de orquestación');
    expect(emb.length).toBe(1536);

    // Verify norm is 1
    let sumSq = 0;
    for (const v of emb) sumSq += v * v;
    expect(Math.sqrt(sumSq)).toBeCloseTo(1.0, 4);
  });

  it('stores and retrieves agent semantic memories', async () => {
    const mem = await memoryService.addMemory({
      agentId: testAgentId,
      content: 'El usuario prefiere respuestas en español y código TypeScript con tipado estricto.',
      metadata: { category: 'user_preferences', confidence: 0.95 },
    });

    expect(mem.id).toBeDefined();
    expect(mem.agentId).toBe(testAgentId);
    expect(mem.embedding.length).toBe(1536);

    const list = await memoryService.getMemories(testAgentId);
    expect(list.some((m) => m.id === mem.id)).toBe(true);
  });

  it('searches memories using cosine similarity ranking', async () => {
    const mem1 = await memoryService.addMemory({
      agentId: testAgentId,
      content: 'Configuración de base de datos SQLite y Postgres pgvector.',
      metadata: { topic: 'database' },
    });

    const mem2 = await memoryService.addMemory({
      agentId: testAgentId,
      content: 'Diseño de interfaz de usuario con Tailwind CSS y componentes accesibles.',
      metadata: { topic: 'frontend' },
    });

    // Querying with mem1's exact embedding should rank mem1 at the top with similarity ~ 1.0
    const searchResults = await memoryService.searchMemories(
      testAgentId,
      'base de datos SQLite Postgres',
      2,
      mem1.embedding
    );

    expect(searchResults.length).toBeGreaterThanOrEqual(1);
    expect(searchResults[0].id).toBe(mem1.id);
    expect(searchResults[0].similarity).toBeCloseTo(1.0, 4);

    // Highest ranked result should have higher or equal similarity to the second
    if (searchResults.length > 1) {
      expect(searchResults[0].similarity).toBeGreaterThanOrEqual(searchResults[1].similarity);
    }
  });

  it('deletes a memory item', async () => {
    const mem = await memoryService.addMemory({
      agentId: testAgentId,
      content: 'Memoria temporal para eliminación.',
    });

    const delRes = await memoryService.deleteMemory(mem.id);
    expect(delRes.success).toBe(true);

    const list = await memoryService.getMemories(testAgentId);
    expect(list.some((m) => m.id === mem.id)).toBe(false);
  });
});
