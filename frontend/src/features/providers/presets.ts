export interface ProviderPreset {
  id: string;
  name: string;
  kind: 'openai-compatible' | 'anthropic';
  baseUrl: string;
  defaultHeaders?: Record<string, string>;
  description?: string;
}

export const PROVIDER_PRESETS: Record<string, ProviderPreset> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    kind: 'openai-compatible',
    baseUrl: 'https://api.openai.com/v1',
    description: 'Modelos GPT-4o, GPT-4o-mini y o1',
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    kind: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    description: 'Modelos Claude 3.7 Sonnet, Claude 3.5 Sonnet y Haiku',
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini (Endpoint Compatible)',
    kind: 'openai-compatible',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    description: 'Modelos Gemini 2.0 Flash, Gemini 1.5 Pro y 1.5 Flash',
  },
  groq: {
    id: 'groq',
    name: 'Groq Cloud',
    kind: 'openai-compatible',
    baseUrl: 'https://api.groq.com/openai/v1',
    description: 'Inferencia ultra-rápida Llama 3 y Mixtral en LPUs',
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    kind: 'openai-compatible',
    baseUrl: 'https://openrouter.ai/api/v1',
    description: 'Enrutador unificado para +200 modelos de IA',
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    kind: 'openai-compatible',
    baseUrl: 'https://api.deepseek.com/v1',
    description: 'Modelos DeepSeek-V3 y DeepSeek-R1',
  },
  mistral: {
    id: 'mistral',
    name: 'Mistral AI',
    kind: 'openai-compatible',
    baseUrl: 'https://api.mistral.ai/v1',
    description: 'Modelos Mistral Large, Codestral y Pixtral',
  },
  together: {
    id: 'together',
    name: 'Together AI',
    kind: 'openai-compatible',
    baseUrl: 'https://api.together.xyz/v1',
    description: 'Modelos open-source Llama 3.3, Qwen y DeepSeek',
  },
  xai: {
    id: 'xai',
    name: 'xAI (Grok)',
    kind: 'openai-compatible',
    baseUrl: 'https://api.x.ai/v1',
    description: 'Modelos Grok-2 y Grok-beta',
  },
  ollama: {
    id: 'ollama',
    name: 'Ollama (Local)',
    kind: 'openai-compatible',
    baseUrl: 'http://localhost:11434/v1',
    description: 'Servidor local open-source en tu propia máquina',
  },
  lmstudio: {
    id: 'lmstudio',
    name: 'LM Studio (Local)',
    kind: 'openai-compatible',
    baseUrl: 'http://localhost:1234/v1',
    description: 'Inferencia local compatible con OpenAI en LM Studio',
  },
};
