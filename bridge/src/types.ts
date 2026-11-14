export interface BridgeConfig {
  port: number;
  host: string;
  authorizedDirectories: string[];
  backendUrl: string;
  allowStdioExecution: boolean;
  token?: string;
}

export interface MCPProcessInfo {
  id: string;
  name: string;
  command: string;
  args: string[];
  pid?: number;
  status: 'running' | 'stopped' | 'error';
  startedAt: string;
  lastError?: string;
}

export interface SpawnRequest {
  id: string;
  name: string;
  command: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
}

export interface JSONRPCRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: any;
}

export interface JSONRPCResponse {
  jsonrpc: '2.0';
  id: number | string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}
