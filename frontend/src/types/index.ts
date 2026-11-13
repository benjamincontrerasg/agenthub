export type ProviderId = 'anthropic' | 'openai' | 'gemini' | 'ollama' | string;

export interface AIModel {
  id: string;
  name: string;
  providerId: ProviderId;
  contextWindow: number;
  maxOutputTokens: number;
  inputPricePerMillion: number;
  outputPricePerMillion: number;
  supportsStreaming: boolean;
  supportsToolCalling: boolean;
  isDefault?: boolean;
}

export interface AIProvider {
  id: ProviderId;
  name: string;
  description: string;
  logo: string;
  badge: string;
  status: 'connected' | 'disconnected' | 'error' | 'testing';
  defaultModelId: string;
  models: AIModel[];
  hasApiKey: boolean;
  apiEndpoint?: string;
  latencyMs?: number;
  lastTested?: string;
  rateLimits?: {
    requestsPerMin: number;
    tokensPerMin: number;
  };
}

export type AgentRole = 'Architect' | 'Developer' | 'Reviewer' | 'Research' | 'Coordinator' | string;

export interface AgentStats {
  totalRuns: number;
  avgDurationSec: number;
  totalTokens: number;
  successRate: number;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  role: AgentRole;
  providerId: ProviderId;
  modelId: string;
  systemPrompt: string;
  temperature: number;
  maxIterations: number;
  allowedToolIds: string[];
  allowedAgentCommunicationIds: string[];
  status: 'idle' | 'running' | 'paused' | 'active' | 'error';
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  stats: AgentStats;
}

export type MCPTransport = 'stdio' | 'streamable-http';

export interface MCPToolParameter {
  name: string;
  type: string;
  description: string;
  required?: boolean;
}

export interface MCPTool {
  id: string;
  serverId: string;
  serverName: string;
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, MCPToolParameter>;
    required?: string[];
  };
  isWriteOperation: boolean;
  requiresApproval: boolean;
  assignedAgentIds: string[];
}

export interface MCPLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
}

export interface MCPServer {
  id: string;
  name: string;
  description: string;
  transport: MCPTransport;
  commandOrEndpoint: string;
  args?: string[];
  env?: Record<string, string>;
  allowedDirectories?: string[];
  status: 'connected' | 'disconnected' | 'pending_validation' | 'error';
  isActivated: boolean;
  tools: MCPTool[];
  logs: MCPLog[];
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export type WorkflowNodeType =
  | 'start'
  | 'agent'
  | 'mcp_tool'
  | 'condition'
  | 'parallel'
  | 'human_approval'
  | 'output'
  | 'end';

export interface WorkflowNodeData {
  label: string;
  description?: string;
  nodeType: WorkflowNodeType;
  agentId?: string;
  toolId?: string;
  conditionExpr?: string;
  config?: Record<string, any>;
  status?: 'idle' | 'running' | 'completed' | 'failed' | 'waiting_approval';
  executionResult?: any;
}

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: WorkflowNodeData;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  animated?: boolean;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  version: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  updatedAt: string;
  lastExecutedAt?: string;
  status: 'draft' | 'active' | 'archived';
  stats?: {
    runsCount: number;
    avgRuntimeSec: number;
    successRate: number;
  };
}

export interface ToolExecution {
  id: string;
  toolId: string;
  toolName: string;
  serverName: string;
  isWriteOperation: boolean;
  input: Record<string, any>;
  output?: any;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'rejected';
  executionTimeMs?: number;
  requiresApproval: boolean;
  approvalId?: string;
  error?: string;
}

export interface Approval {
  id: string;
  executionId?: string;
  conversationId?: string;
  toolId: string;
  toolName: string;
  agentId: string;
  agentName: string;
  actionDescription: string;
  payload: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  respondedAt?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderType: 'user' | 'agent' | 'system';
  senderId?: string;
  senderName: string;
  senderRole?: string;
  content: string;
  timestamp: string;
  status?: 'thinking' | 'executing' | 'waiting_approval' | 'done' | 'failed';
  thoughtTrace?: string;
  toolExecutions?: ToolExecution[];
  delegation?: {
    targetAgentId: string;
    targetAgentName: string;
    reason: string;
  };
  approvalRequest?: Approval;
}

export interface Conversation {
  id: string;
  title: string;
  participantAgentIds: string[];
  activeAgentId?: string;
  status: 'active' | 'idle' | 'running' | 'waiting_approval' | 'paused' | 'completed';
  currentDelegationPath?: string[];
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionStep {
  id: string;
  nodeId?: string;
  name: string;
  type: string;
  agentOrToolName?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  tokensUsed?: number;
  outputSummary?: string;
  logs?: string[];
  error?: string;
}

export interface ExecutionLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: string;
  message: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'running' | 'completed' | 'failed' | 'paused' | 'waiting_approval';
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  triggeredBy: string;
  totalTokens: number;
  estimatedCostUsd: number;
  responsibleAgentId?: string;
  responsibleAgentName?: string;
  toolsUsed: string[];
  steps: ExecutionStep[];
  logs: ExecutionLog[];
  errorMessage?: string;
}

export interface AgentExecution {
  id: string;
  agentId: string;
  agentName: string;
  conversationId?: string;
  workflowExecutionId?: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: string;
  durationMs: number;
  tokensUsed: number;
  costUsd: number;
  taskSummary: string;
}

export interface AnalyticsSummary {
  totalTokens: number;
  estimatedCostUsd: number;
  totalExecutions: number;
  successRate: number;
  activeAgents: number;
  connectedProviders: number;
  connectedMCPServers: number;
  tokensByProvider: { provider: string; tokens: number; cost: number }[];
  tokensByAgent: { agent: string; tokens: number; cost: number }[];
  activityTimeline: {
    date: string;
    tokens: number;
    executions: number;
    cost: number;
  }[];
}

export interface AppSettings {
  profile: {
    name: string;
    email: string;
    company: string;
    role: string;
  };
  appearance: {
    theme: 'dark' | 'light' | 'system';
    accentColor: string;
    reducedMotion: boolean;
    compactMode: boolean;
  };
  preferences: {
    language: string;
    defaultTemperature: number;
    streamResponses: boolean;
    autoSaveWorkflows: boolean;
  };
  security: {
    requireHumanApprovalForWriteTools: boolean;
    strictMCPValidation: boolean;
    sessionTimeoutMinutes: number;
    telemetryEnabled: boolean;
  };
  backend: {
    apiUrl: string;
    wsUrl: string;
    useMockApi: boolean;
    connectionStatus: 'connected' | 'disconnected' | 'testing';
  };
  localAgent: {
    enabled: boolean;
    bridgePort: number;
    authorizedDirectories: string[];
    allowStdioExecution: boolean;
  };
  notifications: {
    executionCompleted: boolean;
    executionFailed: boolean;
    approvalRequired: boolean;
    providerRateLimit: boolean;
  };
}

export type WSEventType =
  | 'agent.started'
  | 'agent.message'
  | 'agent.completed'
  | 'agent.failed'
  | 'mcp.connected'
  | 'mcp.disconnected'
  | 'tool.requested'
  | 'tool.approval_required'
  | 'workflow.progress';

export interface WSEvent<T = any> {
  type: WSEventType;
  payload: T;
  timestamp: string;
}
