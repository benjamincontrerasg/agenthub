import { pgTable, text, integer, real, boolean, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// --- AI Providers & Models (PostgreSQL Blueprint) ---

export const providers = pgTable('providers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  logo: text('logo').notNull(),
  badge: text('badge').notNull(),
  kind: text('kind').notNull().default('openai-compatible'),
  baseUrl: text('base_url'),
  status: text('status').notNull().default('disconnected'),
  defaultModelId: text('default_model_id').notNull(),
  hasApiKey: boolean('has_api_key').notNull().default(false),
  encryptedApiKey: text('encrypted_api_key'),
  apiEndpoint: text('api_endpoint'),
  latencyMs: integer('latency_ms'),
  lastTested: timestamp('last_tested', { withTimezone: true }),
  rateLimitRequestsPerMin: integer('rate_limit_requests_per_min'),
  rateLimitTokensPerMin: integer('rate_limit_tokens_per_min'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const models = pgTable('models', {
  id: text('id').primaryKey(),
  providerId: text('provider_id').notNull().references(() => providers.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  contextWindow: integer('context_window').notNull(),
  maxOutputTokens: integer('max_output_tokens').notNull(),
  inputPricePerMillion: real('input_price_per_million').notNull(),
  outputPricePerMillion: real('output_price_per_million').notNull(),
  supportsStreaming: boolean('supports_streaming').notNull().default(true),
  supportsToolCalling: boolean('supports_tool_calling').notNull().default(true),
  isDefault: boolean('is_default').notNull().default(false),
});

export const providerModels = pgTable('provider_models', {
  providerId: text('provider_id').notNull().references(() => providers.id, { onDelete: 'cascade' }),
  modelId: text('model_id').notNull(),
  contextWindow: integer('context_window').default(128000),
  inputCostPer1M: real('input_cost_per_1m'),
  outputCostPer1M: real('output_cost_per_1m'),
  supportsTools: boolean('supports_tools').notNull().default(true),
}, (table) => [
  primaryKey({ columns: [table.providerId, table.modelId] })
]);

export const agents = pgTable('agents', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  role: text('role').notNull(),
  providerId: text('provider_id').notNull().references(() => providers.id),
  modelId: text('model_id').notNull(),
  systemPrompt: text('system_prompt').notNull(),
  temperature: real('temperature').notNull().default(0.7),
  maxIterations: integer('max_iterations').notNull().default(10),
  status: text('status').notNull().default('idle'),
  avatarUrl: text('avatar_url'),
  totalRuns: integer('total_runs').notNull().default(0),
  avgDurationSec: real('avg_duration_sec').notNull().default(0),
  totalTokens: integer('total_tokens').notNull().default(0),
  successRate: real('success_rate').notNull().default(100),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
