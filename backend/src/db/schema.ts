import { sqliteTable, text, integer, real, primaryKey } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// --- AI Providers & Models ---

export const providers = sqliteTable('providers', {
  id: text('id').primaryKey(), // 'anthropic', 'openai', 'gemini', 'ollama'
  name: text('name').notNull(),
  description: text('description').notNull(),
  logo: text('logo').notNull(),
  badge: text('badge').notNull(),
  status: text('status', { enum: ['connected', 'disconnected', 'error', 'testing'] }).notNull().default('disconnected'),
  defaultModelId: text('default_model_id').notNull(),
  hasApiKey: integer('has_api_key', { mode: 'boolean' }).notNull().default(false),
  encryptedApiKey: text('encrypted_api_key'),
  apiEndpoint: text('api_endpoint'),
  latencyMs: integer('latency_ms'),
  lastTested: text('last_tested'),
  rateLimitRequestsPerMin: integer('rate_limit_requests_per_min'),
  rateLimitTokensPerMin: integer('rate_limit_tokens_per_min'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const models = sqliteTable('models', {
  id: text('id').primaryKey(),
  providerId: text('provider_id').notNull().references(() => providers.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  contextWindow: integer('context_window').notNull(),
  maxOutputTokens: integer('max_output_tokens').notNull(),
  inputPricePerMillion: real('input_price_per_million').notNull(),
  outputPricePerMillion: real('output_price_per_million').notNull(),
  supportsStreaming: integer('supports_streaming', { mode: 'boolean' }).notNull().default(true),
  supportsToolCalling: integer('supports_tool_calling', { mode: 'boolean' }).notNull().default(true),
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
});

// --- Agents ---

export const agents = sqliteTable('agents', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  role: text('role').notNull(),
  providerId: text('provider_id').notNull().references(() => providers.id),
  modelId: text('model_id').notNull(),
  systemPrompt: text('system_prompt').notNull(),
  temperature: real('temperature').notNull().default(0.7),
  maxIterations: integer('max_iterations').notNull().default(10),
  status: text('status', { enum: ['idle', 'running', 'paused', 'active', 'error'] }).notNull().default('idle'),
  avatarUrl: text('avatar_url'),
  totalRuns: integer('total_runs').notNull().default(0),
  avgDurationSec: real('avg_duration_sec').notNull().default(0),
  totalTokens: integer('total_tokens').notNull().default(0),
  successRate: real('success_rate').notNull().default(100),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const agentAllowedTools = sqliteTable('agent_allowed_tools', {
  agentId: text('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
  toolId: text('tool_id').notNull(),
}, (table) => [
  primaryKey({ columns: [table.agentId, table.toolId] })
]);

export const agentCommunications = sqliteTable('agent_communications', {
  agentId: text('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
  targetAgentId: text('target_agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
}, (table) => [
  primaryKey({ columns: [table.agentId, table.targetAgentId] })
]);

// --- MCP Servers & Tools ---

export const mcpServers = sqliteTable('mcp_servers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  transport: text('transport', { enum: ['stdio', 'streamable-http'] }).notNull(),
  commandOrEndpoint: text('command_or_endpoint').notNull(),
  args: text('args'), // JSON string array
  env: text('env'), // JSON key-value
  allowedDirectories: text('allowed_directories'), // JSON string array
  status: text('status', { enum: ['connected', 'disconnected', 'pending_validation', 'error'] }).notNull().default('pending_validation'),
  isActivated: integer('is_activated', { mode: 'boolean' }).notNull().default(false),
  error: text('error'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const mcpTools = sqliteTable('mcp_tools', {
  id: text('id').primaryKey(),
  serverId: text('server_id').notNull().references(() => mcpServers.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description').notNull(),
  inputSchema: text('input_schema').notNull(), // JSON schema
  isWriteOperation: integer('is_write_operation', { mode: 'boolean' }).notNull().default(false),
  requiresApproval: integer('requires_approval', { mode: 'boolean' }).notNull().default(true),
});

export const mcpToolAssignments = sqliteTable('mcp_tool_assignments', {
  toolId: text('tool_id').notNull().references(() => mcpTools.id, { onDelete: 'cascade' }),
  agentId: text('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
}, (table) => [
  primaryKey({ columns: [table.toolId, table.agentId] })
]);

export const mcpLogs = sqliteTable('mcp_logs', {
  id: text('id').primaryKey(),
  serverId: text('server_id').notNull().references(() => mcpServers.id, { onDelete: 'cascade' }),
  timestamp: text('timestamp').notNull(),
  level: text('level', { enum: ['info', 'warn', 'error', 'debug'] }).notNull(),
  message: text('message').notNull(),
});

// --- Workflows ---

export const workflows = sqliteTable('workflows', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  version: text('version').notNull().default('1.0.0'),
  nodes: text('nodes').notNull(), // JSON WorkflowNode[]
  edges: text('edges').notNull(), // JSON WorkflowEdge[]
  status: text('status', { enum: ['draft', 'active', 'archived'] }).notNull().default('draft'),
  runsCount: integer('runs_count').notNull().default(0),
  avgRuntimeSec: real('avg_runtime_sec').notNull().default(0),
  successRate: real('success_rate').notNull().default(100),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  lastExecutedAt: text('last_executed_at'),
});

// --- Multi-Agent Chat & Messaging ---

export const conversations = sqliteTable('conversations', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  participantAgentIds: text('participant_agent_ids').notNull(), // JSON array
  activeAgentId: text('active_agent_id'),
  status: text('status', { enum: ['active', 'idle', 'running', 'waiting_approval', 'paused', 'completed'] }).notNull().default('idle'),
  currentDelegationPath: text('current_delegation_path'), // JSON array
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  senderType: text('sender_type', { enum: ['user', 'agent', 'system'] }).notNull(),
  senderId: text('sender_id'),
  senderName: text('sender_name').notNull(),
  senderRole: text('sender_role'),
  content: text('content').notNull(),
  timestamp: text('timestamp').notNull(),
  status: text('status', { enum: ['thinking', 'executing', 'waiting_approval', 'done', 'failed'] }),
  thoughtTrace: text('thought_trace'),
  delegation: text('delegation'), // JSON object
  approvalRequestId: text('approval_request_id'),
});

// --- Executions, Steps & Logs ---

export const workflowExecutions = sqliteTable('workflow_executions', {
  id: text('id').primaryKey(),
  workflowId: text('workflow_id').notNull().references(() => workflows.id),
  workflowName: text('workflow_name').notNull(),
  status: text('status', { enum: ['running', 'completed', 'failed', 'paused', 'waiting_approval'] }).notNull().default('running'),
  startedAt: text('started_at').notNull(),
  finishedAt: text('finished_at'),
  durationMs: integer('duration_ms'),
  triggeredBy: text('triggered_by').notNull(),
  totalTokens: integer('total_tokens').notNull().default(0),
  estimatedCostUsd: real('estimated_cost_usd').notNull().default(0),
  responsibleAgentId: text('responsible_agent_id'),
  responsibleAgentName: text('responsible_agent_name'),
  toolsUsed: text('tools_used').notNull(), // JSON array string[]
  errorMessage: text('error_message'),
});

export const executionSteps = sqliteTable('execution_steps', {
  id: text('id').primaryKey(),
  executionId: text('execution_id').notNull().references(() => workflowExecutions.id, { onDelete: 'cascade' }),
  nodeId: text('node_id'),
  name: text('name').notNull(),
  type: text('type').notNull(),
  agentOrToolName: text('agent_or_tool_name'),
  status: text('status', { enum: ['pending', 'running', 'completed', 'failed', 'skipped'] }).notNull().default('pending'),
  startedAt: text('started_at').notNull(),
  completedAt: text('completed_at'),
  durationMs: integer('duration_ms'),
  tokensUsed: integer('tokens_used'),
  outputSummary: text('output_summary'),
  logs: text('logs'), // JSON array string[]
  error: text('error'),
});

export const executionLogs = sqliteTable('execution_logs', {
  id: text('id').primaryKey(),
  executionId: text('execution_id').notNull().references(() => workflowExecutions.id, { onDelete: 'cascade' }),
  timestamp: text('timestamp').notNull(),
  level: text('level', { enum: ['info', 'warn', 'error', 'debug'] }).notNull(),
  source: text('source').notNull(),
  message: text('message').notNull(),
});

// --- Approvals & Tool Executions ---

export const approvals = sqliteTable('approvals', {
  id: text('id').primaryKey(),
  executionId: text('execution_id'),
  conversationId: text('conversation_id'),
  toolId: text('tool_id').notNull(),
  toolName: text('tool_name').notNull(),
  agentId: text('agent_id').notNull(),
  agentName: text('agent_name').notNull(),
  actionDescription: text('action_description').notNull(),
  payload: text('payload').notNull(), // JSON string
  status: text('status', { enum: ['pending', 'approved', 'rejected'] }).notNull().default('pending'),
  requestedAt: text('requested_at').notNull(),
  respondedAt: text('responded_at'),
});

export const toolExecutions = sqliteTable('tool_executions', {
  id: text('id').primaryKey(),
  messageId: text('message_id').references(() => messages.id, { onDelete: 'cascade' }),
  toolId: text('tool_id').notNull(),
  toolName: text('tool_name').notNull(),
  serverName: text('server_name').notNull(),
  isWriteOperation: integer('is_write_operation', { mode: 'boolean' }).notNull().default(false),
  input: text('input').notNull(), // JSON string
  output: text('output'), // JSON string
  status: text('status', { enum: ['pending', 'running', 'completed', 'failed', 'rejected'] }).notNull().default('pending'),
  executionTimeMs: integer('execution_time_ms'),
  requiresApproval: integer('requires_approval', { mode: 'boolean' }).notNull().default(true),
  approvalId: text('approval_id').references(() => approvals.id),
  error: text('error'),
});

// --- Settings & Analytics ---

export const settings = sqliteTable('settings', {
  id: text('id').primaryKey().default('default'),
  data: text('data').notNull(), // JSON AppSettings
  updatedAt: text('updated_at').notNull(),
});

export const tokenUsage = sqliteTable('token_usage', {
  id: text('id').primaryKey(),
  providerId: text('provider_id').notNull(),
  agentId: text('agent_id'),
  tokens: integer('tokens').notNull(),
  costUsd: real('cost_usd').notNull(),
  timestamp: text('timestamp').notNull(),
  executionId: text('execution_id'),
});

// --- Relations ---

export const providersRelations = relations(providers, ({ many }) => ({
  models: many(models),
  agents: many(agents),
}));

export const modelsRelations = relations(models, ({ one }) => ({
  provider: one(providers, {
    fields: [models.providerId],
    references: [providers.id],
  }),
}));

export const agentsRelations = relations(agents, ({ one, many }) => ({
  provider: one(providers, {
    fields: [agents.providerId],
    references: [providers.id],
  }),
  allowedTools: many(agentAllowedTools),
  communications: many(agentCommunications, { relationName: 'agent_comms' }),
  assignedTools: many(mcpToolAssignments),
}));

export const mcpServersRelations = relations(mcpServers, ({ many }) => ({
  tools: many(mcpTools),
  logs: many(mcpLogs),
}));

export const mcpToolsRelations = relations(mcpTools, ({ one, many }) => ({
  server: one(mcpServers, {
    fields: [mcpTools.serverId],
    references: [mcpServers.id],
  }),
  assignedAgents: many(mcpToolAssignments),
}));

export const workflowsRelations = relations(workflows, ({ many }) => ({
  executions: many(workflowExecutions),
}));

export const conversationsRelations = relations(conversations, ({ many }) => ({
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  toolExecutions: many(toolExecutions),
}));

export const workflowExecutionsRelations = relations(workflowExecutions, ({ one, many }) => ({
  workflow: one(workflows, {
    fields: [workflowExecutions.workflowId],
    references: [workflows.id],
  }),
  steps: many(executionSteps),
  logs: many(executionLogs),
}));
