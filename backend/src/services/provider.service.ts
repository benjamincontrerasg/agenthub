import { db } from '../db/connection.js';
import * as schema from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { AIProvider, ProviderId } from '../types.js';
import { encrypt, decrypt } from '../lib/crypto.js';
import { NotFoundError, ValidationError } from '../lib/errors.js';
import { createProvider, LLMProvider } from '../providers/index.js';
import { validateSafeUrl } from '../lib/ssrf.js';

export const providerService = {
  async getAll(): Promise<AIProvider[]> {
    const allProviders = db.select().from(schema.providers).all();
    const allModels = db.select().from(schema.models).all();

    return allProviders.map((p) => {
      const providerModels = allModels.filter((m) => m.providerId === p.id);
      return {
        id: p.id as ProviderId,
        name: p.name,
        description: p.description,
        logo: p.logo,
        badge: p.badge,
        kind: p.kind,
        baseUrl: p.baseUrl ?? undefined,
        status: p.status as any,
        defaultModelId: p.defaultModelId,
        hasApiKey: p.hasApiKey,
        apiEndpoint: p.apiEndpoint ?? undefined,
        latencyMs: p.latencyMs ?? undefined,
        lastTested: p.lastTested ?? undefined,
        rateLimits: p.rateLimitRequestsPerMin && p.rateLimitTokensPerMin ? {
          requestsPerMin: p.rateLimitRequestsPerMin,
          tokensPerMin: p.rateLimitTokensPerMin,
        } : undefined,
        models: providerModels.map((m) => ({
          id: m.id,
          name: m.name,
          providerId: m.providerId as ProviderId,
          contextWindow: m.contextWindow,
          maxOutputTokens: m.maxOutputTokens,
          inputPricePerMillion: m.inputPricePerMillion,
          outputPricePerMillion: m.outputPricePerMillion,
          supportsStreaming: m.supportsStreaming,
          supportsToolCalling: m.supportsToolCalling,
          isDefault: m.isDefault,
        })),
      };
    });
  },

  async getById(id: ProviderId): Promise<AIProvider> {
    const p = db.select().from(schema.providers).where(eq(schema.providers.id, id)).get();
    if (!p) {
      throw new NotFoundError('Proveedor', id);
    }

    const providerModels = db.select().from(schema.models).where(eq(schema.models.providerId, id)).all();

    return {
      id: p.id as ProviderId,
      name: p.name,
      description: p.description,
      logo: p.logo,
      badge: p.badge,
      kind: p.kind,
      baseUrl: p.baseUrl ?? undefined,
      status: p.status as any,
      defaultModelId: p.defaultModelId,
      hasApiKey: p.hasApiKey,
      apiEndpoint: p.apiEndpoint ?? undefined,
      latencyMs: p.latencyMs ?? undefined,
      lastTested: p.lastTested ?? undefined,
      rateLimits: p.rateLimitRequestsPerMin && p.rateLimitTokensPerMin ? {
        requestsPerMin: p.rateLimitRequestsPerMin,
        tokensPerMin: p.rateLimitTokensPerMin,
      } : undefined,
      models: providerModels.map((m) => ({
        id: m.id,
        name: m.name,
        providerId: m.providerId as ProviderId,
        contextWindow: m.contextWindow,
        maxOutputTokens: m.maxOutputTokens,
        inputPricePerMillion: m.inputPricePerMillion,
        outputPricePerMillion: m.outputPricePerMillion,
        supportsStreaming: m.supportsStreaming,
        supportsToolCalling: m.supportsToolCalling,
        isDefault: m.isDefault,
      })),
    };
  },

  async connect(
    id: ProviderId,
    apiKey: string,
    defaultModelId?: string,
    baseUrl?: string,
    kind?: string
  ): Promise<{ success: boolean; message: string }> {
    const p = db.select().from(schema.providers).where(eq(schema.providers.id, id)).get();
    if (!p) {
      throw new NotFoundError('Proveedor', id);
    }

    if (baseUrl) {
      const allowLocal = id === 'ollama' || id === 'lmstudio' || kind === 'ollama' || kind === 'lmstudio';
      await validateSafeUrl(baseUrl, { allowLocalhost: allowLocal });
    }

    // Encrypt sensitive API key at rest
    const encryptedKey = encrypt(apiKey);

    db.update(schema.providers)
      .set({
        encryptedApiKey: encryptedKey,
        hasApiKey: true,
        status: 'connected',
        defaultModelId: defaultModelId || p.defaultModelId,
        baseUrl: baseUrl ?? p.baseUrl,
        kind: kind ?? p.kind,
        lastTested: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.providers.id, id))
      .run();

    if (defaultModelId) {
      db.update(schema.models)
        .set({ isDefault: false })
        .where(eq(schema.models.providerId, id))
        .run();
      db.update(schema.models)
        .set({ isDefault: true })
        .where(eq(schema.models.id, defaultModelId))
        .run();
    }

    return {
      success: true,
      message: `Proveedor ${p.name} conectado y credencial cifrada con éxito.`,
    };
  },

  async disconnect(id: ProviderId): Promise<{ success: boolean; message: string }> {
    const p = db.select().from(schema.providers).where(eq(schema.providers.id, id)).get();
    if (!p) {
      throw new NotFoundError('Proveedor', id);
    }

    db.update(schema.providers)
      .set({
        encryptedApiKey: null,
        hasApiKey: false,
        status: 'disconnected',
        latencyMs: null,
        lastTested: null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.providers.id, id))
      .run();

    return {
      success: true,
      message: `Proveedor ${p.name} desconectado y credenciales eliminadas.`,
    };
  },

  async updateDefaultModel(
    id: ProviderId,
    defaultModelId?: string,
    baseUrl?: string,
    kind?: string
  ): Promise<{ success: boolean; message: string }> {
    const p = db.select().from(schema.providers).where(eq(schema.providers.id, id)).get();
    if (!p) {
      throw new NotFoundError('Proveedor', id);
    }

    if (baseUrl) {
      const allowLocal = id === 'ollama' || id === 'lmstudio' || kind === 'ollama' || kind === 'lmstudio';
      await validateSafeUrl(baseUrl, { allowLocalhost: allowLocal });
    }

    if (defaultModelId) {
      const model = db.select().from(schema.models).where(eq(schema.models.id, defaultModelId)).get();
      if (!model || model.providerId !== id) {
        throw new ValidationError(`El modelo '${defaultModelId}' no pertenece al proveedor '${id}'`);
      }

      db.update(schema.providers)
        .set({
          defaultModelId,
          baseUrl: baseUrl ?? p.baseUrl,
          kind: kind ?? p.kind,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.providers.id, id))
        .run();

      db.update(schema.models)
        .set({ isDefault: false })
        .where(eq(schema.models.providerId, id))
        .run();

      db.update(schema.models)
        .set({ isDefault: true })
        .where(eq(schema.models.id, defaultModelId))
        .run();

      return {
        success: true,
        message: `Configuración de ${p.name} actualizada.`,
      };
    }

    db.update(schema.providers)
      .set({
        baseUrl: baseUrl ?? p.baseUrl,
        kind: kind ?? p.kind,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.providers.id, id))
      .run();

    return {
      success: true,
      message: `Configuración de ${p.name} actualizada.`,
    };
  },

  async testConnection(id: ProviderId): Promise<{ success: boolean; latencyMs: number; message: string }> {
    const p = db.select().from(schema.providers).where(eq(schema.providers.id, id)).get();
    if (!p) {
      throw new NotFoundError('Proveedor', id);
    }

    let plainKey: string | undefined;
    if (p.encryptedApiKey) {
      try {
        plainKey = decrypt(p.encryptedApiKey);
      } catch (err: any) {
        console.warn(`[Provider] Error al descifrar clave de ${p.name}:`, err.message);
      }
    }

    const provider: LLMProvider = createProvider({
      id: p.id,
      kind: p.kind || undefined,
      baseUrl: p.baseUrl || p.apiEndpoint || undefined,
      apiKey: plainKey,
    });

    const testRes = await provider.test();
    const isConnected = testRes.ok;
    const latencyMs = testRes.latencyMs;
    const message = testRes.ok
      ? `Conexión con ${p.name} validada con éxito (${latencyMs}ms).`
      : `Diagnóstico de conexión: ${testRes.error || 'Error al conectar'}`;

    db.update(schema.providers)
      .set({
        latencyMs,
        lastTested: new Date().toISOString(),
        status: isConnected ? 'connected' : 'error',
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.providers.id, id))
      .run();

    return {
      success: isConnected,
      latencyMs,
      message,
    };
  },
};
