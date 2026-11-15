import { db } from '../db/connection.js';
import * as schema from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { Agent, Message } from '../types.js';
import { decrypt } from '../lib/crypto.js';
import { createProvider, LLMProvider, ChatMessage } from '../providers/index.js';
import { analyticsService } from './analytics.service.js';

export interface AIExecutionResult {
  content: string;
  thoughtTrace?: string;
  tokensUsed: number;
  costUsd: number;
  isRealExecution: boolean;
  modelUsed: string;
}

export class AIEngine {
  /**
   * Genera respuesta de agente utilizando la capa unificada LLMProvider sin depender de SDKs específicos.
   */
  public async generateAgentResponse(
    agent: Agent,
    history: Message[],
    userPrompt: string,
    onChunk?: (chunk: string) => void,
    signal?: AbortSignal
  ): Promise<AIExecutionResult> {
    const providerRecord = db.select().from(schema.providers).where(eq(schema.providers.id, agent.providerId)).get();

    // 1. Resolver API Key desde base de datos cifrada o variable de entorno
    let apiKey: string | undefined;

    if (providerRecord?.encryptedApiKey) {
      try {
        apiKey = decrypt(providerRecord.encryptedApiKey);
      } catch (e) {
        console.warn(`[AI Engine] No se pudo descifrar la clave para ${agent.providerId}`);
      }
    }

    // Fallback a variables de entorno del sistema
    if (!apiKey) {
      if (agent.providerId === 'gemini') {
        apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      } else if (agent.providerId === 'openai') {
        apiKey = process.env.OPENAI_API_KEY;
      } else if (agent.providerId === 'anthropic') {
        apiKey = process.env.ANTHROPIC_API_KEY;
      }
    }

    const isLocalProvider = agent.providerId === 'ollama' || agent.providerId === 'lmstudio' || providerRecord?.kind === 'ollama';

    // 2. Ejecutar llamada real si hay API Key o proveedor local
    if (apiKey || isLocalProvider) {
      try {
        const provider: LLMProvider = createProvider({
          id: agent.providerId,
          kind: providerRecord?.kind,
          baseUrl: (providerRecord?.baseUrl || providerRecord?.apiEndpoint) ?? undefined,
          apiKey,
        });

        const messages: ChatMessage[] = [
          { role: 'system', content: agent.systemPrompt },
          ...history.slice(-6).map((m) => ({
            role: (m.senderType === 'user' ? 'user' : 'assistant') as any,
            content: m.content,
          })),
          { role: 'user', content: userPrompt },
        ];

        let fullText = '';
        let tokensUsed = 0;

        if (onChunk) {
          for await (const event of provider.stream({
            model: agent.modelId,
            messages,
            temperature: agent.temperature,
            signal,
          })) {
            if (event.type === 'text_delta') {
              fullText += event.text;
              onChunk(event.text);
            } else if (event.type === 'done') {
              tokensUsed = (event.usage?.inputTokens || 0) + (event.usage?.outputTokens || 0);
            }
          }
        } else {
          const res = await provider.chat({
            model: agent.modelId,
            messages,
            temperature: agent.temperature,
            signal,
          });
          fullText = res.content;
          tokensUsed = (res.usage?.inputTokens || 0) + (res.usage?.outputTokens || 0);
        }

        const calculatedCost = analyticsService.calculateCost(agent.providerId, agent.modelId, tokensUsed);
        const costUsd = calculatedCost !== null ? calculatedCost : 0;

        return {
          content: fullText,
          thoughtTrace: `Procesado mediante capa unificada '${provider.kind}' (${agent.modelId}) con rol ${agent.role}.`,
          tokensUsed,
          costUsd,
          isRealExecution: true,
          modelUsed: agent.modelId,
        };
      } catch (err: any) {
        console.error(`[AI Engine Error with ${agent.providerId}]`, err.message);
        return {
          content: `⚠️ Error al consultar el modelo (${agent.modelId}): ${err.message}. Verifica tu configuración en "AI Providers".`,
          thoughtTrace: `Fallo de comunicación con ${agent.providerId}: ${err.message}`,
          tokensUsed: 0,
          costUsd: 0,
          isRealExecution: false,
          modelUsed: agent.modelId,
        };
      }
    }

    // 3. Modo Simulación si aún no hay clave configurada
    const fallbackText = `[Modo Simulación] Para ejecutar este agente con un modelo de IA real, ve a la pestaña "AI Providers", haz clic en "Configurar" en ${agent.providerId.toUpperCase()} e introduce tu API Key (o define la variable ${agent.providerId.toUpperCase()}_API_KEY).\n\nComo ${agent.name} (${agent.role}), aquí tienes mi análisis simulado para tu requerimiento: "${userPrompt}". El sistema multi-agente está listo para orquestar la tarea tan pronto como actives tu proveedor.`;

    if (onChunk) {
      const words = fallbackText.split(' ');
      for (const word of words) {
        onChunk(word + ' ');
        await new Promise((r) => setTimeout(r, 25));
      }
    }

    return {
      content: fallbackText,
      thoughtTrace: `No se detectó API Key para ${agent.providerId}. Operando en modo demostración.`,
      tokensUsed: 350,
      costUsd: 0.001,
      isRealExecution: false,
      modelUsed: agent.modelId,
    };
  }
}

export const aiEngine = new AIEngine();
