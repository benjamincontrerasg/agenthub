import { db } from '../db/connection.js';
import * as schema from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { Agent, Message } from '../types.js';
import { decrypt } from '../lib/crypto.js';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
   * Generates a real response from the AI model assigned to the agent, with optional streaming tokens.
   */
  public async generateAgentResponse(
    agent: Agent,
    history: Message[],
    userPrompt: string,
    onChunk?: (chunk: string) => void
  ): Promise<AIExecutionResult> {
    const provider = db.select().from(schema.providers).where(eq(schema.providers.id, agent.providerId)).get();

    // 1. Resolve API key: either stored in database (encrypted) or environment variable
    let apiKey: string | undefined;

    if (provider?.encryptedApiKey) {
      try {
        apiKey = decrypt(provider.encryptedApiKey);
      } catch (e) {
        console.warn(`[AI Engine] No se pudo descifrar la clave para ${agent.providerId}`);
      }
    }

    // Fallback to process.env
    if (!apiKey) {
      if (agent.providerId === 'gemini') {
        apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      } else if (agent.providerId === 'openai') {
        apiKey = process.env.OPENAI_API_KEY;
      } else if (agent.providerId === 'anthropic') {
        apiKey = process.env.ANTHROPIC_API_KEY;
      }
    }

    // 2. Execute Real AI call if API Key or Ollama is present
    if (apiKey) {
      try {
        if (agent.providerId === 'gemini') {
          return await this.callGemini(apiKey, agent, history, userPrompt, onChunk);
        } else if (agent.providerId === 'openai') {
          return await this.callOpenAI(apiKey, agent, history, userPrompt, onChunk);
        } else if (agent.providerId === 'anthropic') {
          return await this.callAnthropic(apiKey, agent, history, userPrompt, onChunk);
        }
      } catch (err: any) {
        console.error(`[AI Engine Error with ${agent.providerId}]`, err);
        return {
          content: `⚠️ Error al consultar el modelo real (${agent.modelId}): ${err.message}. Verifica tu API Key en la sección "AI Providers".`,
          thoughtTrace: `Fallo de autenticación o cuota con ${agent.providerId}: ${err.message}`,
          tokensUsed: 0,
          costUsd: 0,
          isRealExecution: false,
          modelUsed: agent.modelId,
        };
      }
    }

    // Check Ollama if provider is Ollama
    if (agent.providerId === 'ollama') {
      try {
        const endpoint = provider?.apiEndpoint || 'http://localhost:11434';
        return await this.callOllama(endpoint, agent, history, userPrompt, onChunk);
      } catch (err: any) {
        console.warn(`[AI Engine Ollama Offline]`, err.message);
      }
    }

    // 3. Fallback when no API Key is configured yet (with simulated token streaming)
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

  // --- Real Google Gemini Call with Streaming ---
  private async callGemini(
    apiKey: string,
    agent: Agent,
    history: Message[],
    userPrompt: string,
    onChunk?: (chunk: string) => void
  ): Promise<AIExecutionResult> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = agent.modelId.includes('gemini') ? agent.modelId : 'gemini-1.5-flash';
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: agent.systemPrompt,
      generationConfig: {
        temperature: agent.temperature,
      },
    });

    const recentHistory = history.slice(-6).map((m) => ({
      role: m.senderType === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({
      history: recentHistory,
    });

    let fullText = '';
    if (onChunk) {
      const resultStream = await chat.sendMessageStream(userPrompt);
      for await (const chunk of resultStream.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        onChunk(chunkText);
      }
    } else {
      const result = await chat.sendMessage(userPrompt);
      fullText = result.response.text();
    }

    const tokenCount = (await model.countTokens(userPrompt + fullText)).totalTokens || 500;

    return {
      content: fullText,
      thoughtTrace: `Procesado en streaming por Google Gemini (${modelName}) con rol ${agent.role}. Temperatura: ${agent.temperature}.`,
      tokensUsed: tokenCount,
      costUsd: (tokenCount / 1_000_000) * 0.35,
      isRealExecution: true,
      modelUsed: modelName,
    };
  }

  // --- Real OpenAI Call with Streaming ---
  private async callOpenAI(
    apiKey: string,
    agent: Agent,
    history: Message[],
    userPrompt: string,
    onChunk?: (chunk: string) => void
  ): Promise<AIExecutionResult> {
    const openai = new OpenAI({ apiKey });
    const modelName = agent.modelId || 'gpt-4o-mini';

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: agent.systemPrompt },
      ...history.slice(-6).map((m) => ({
        role: (m.senderType === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: userPrompt },
    ];

    let fullText = '';
    let tokensUsed = 400;

    if (onChunk) {
      const stream = await openai.chat.completions.create({
        model: modelName,
        messages,
        temperature: agent.temperature,
        stream: true,
      });

      for await (const part of stream) {
        const delta = part.choices[0]?.delta?.content || '';
        if (delta) {
          fullText += delta;
          onChunk(delta);
        }
      }
    } else {
      const response = await openai.chat.completions.create({
        model: modelName,
        messages,
        temperature: agent.temperature,
      });
      fullText = response.choices[0]?.message?.content || 'Sin respuesta';
      tokensUsed = response.usage?.total_tokens || 400;
    }

    return {
      content: fullText,
      thoughtTrace: `Procesado en streaming por OpenAI (${modelName}) con rol ${agent.role}.`,
      tokensUsed,
      costUsd: (tokensUsed / 1_000_000) * 2.5,
      isRealExecution: true,
      modelUsed: modelName,
    };
  }

  // --- Real Anthropic Call with Streaming ---
  private async callAnthropic(
    apiKey: string,
    agent: Agent,
    history: Message[],
    userPrompt: string,
    onChunk?: (chunk: string) => void
  ): Promise<AIExecutionResult> {
    const anthropic = new Anthropic({ apiKey });
    const modelName = agent.modelId.includes('claude') ? agent.modelId : 'claude-3-5-haiku-20241022';

    const messages = [
      ...history.slice(-6).map((m) => ({
        role: (m.senderType === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: userPrompt },
    ];

    let fullText = '';
    let tokensUsed = 400;

    if (onChunk) {
      const stream = anthropic.messages.stream({
        model: modelName,
        system: agent.systemPrompt,
        max_tokens: 4096,
        temperature: agent.temperature,
        messages,
      });

      stream.on('text', (text) => {
        fullText += text;
        onChunk(text);
      });

      const finalMessage = await stream.finalMessage();
      tokensUsed = (finalMessage.usage?.input_tokens || 0) + (finalMessage.usage?.output_tokens || 0);
    } else {
      const response = await anthropic.messages.create({
        model: modelName,
        system: agent.systemPrompt,
        max_tokens: 4096,
        temperature: agent.temperature,
        messages,
      });
      fullText = response.content[0]?.type === 'text' ? response.content[0].text : 'Sin respuesta';
      tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);
    }

    return {
      content: fullText,
      thoughtTrace: `Procesado en streaming por Anthropic (${modelName}) con rol ${agent.role}.`,
      tokensUsed,
      costUsd: (tokensUsed / 1_000_000) * 3.0,
      isRealExecution: true,
      modelUsed: modelName,
    };
  }

  // --- Real Ollama Local Call ---
  private async callOllama(
    endpoint: string,
    agent: Agent,
    history: Message[],
    userPrompt: string,
    onChunk?: (chunk: string) => void
  ): Promise<AIExecutionResult> {
    const res = await fetch(`${endpoint}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: agent.modelId || 'llama3',
        stream: false,
        messages: [
          { role: 'system', content: agent.systemPrompt },
          ...history.slice(-6).map((m) => ({
            role: m.senderType === 'user' ? 'user' : 'assistant',
            content: m.content,
          })),
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
    const data: any = await res.json();
    const content = data.message?.content || 'Sin respuesta de Ollama';

    if (onChunk) {
      const words = content.split(' ');
      for (const w of words) {
        onChunk(w + ' ');
        await new Promise((r) => setTimeout(r, 20));
      }
    }

    return {
      content,
      thoughtTrace: `Procesado localmente por Ollama (${agent.modelId || 'llama3'}) en ${endpoint}`,
      tokensUsed: data.eval_count || 300,
      costUsd: 0.0,
      isRealExecution: true,
      modelUsed: agent.modelId || 'llama3',
    };
  }
}

export const aiEngine = new AIEngine();
