import { spawn, ChildProcess } from 'child_process';
import { SecuritySandbox } from './sandbox.js';
import { MCPProcessInfo, SpawnRequest, JSONRPCRequest, JSONRPCResponse } from './types.js';

interface ActiveProcess {
  info: MCPProcessInfo;
  process: ChildProcess;
  buffer: string;
  pendingRequests: Map<string | number, (response: JSONRPCResponse) => void>;
}

export class MCPProcessManager {
  private processes: Map<string, ActiveProcess> = new Map();
  private sandbox: SecuritySandbox;

  constructor(sandbox: SecuritySandbox) {
    this.sandbox = sandbox;
  }

  public listProcesses(): MCPProcessInfo[] {
    return Array.from(this.processes.values()).map((p) => p.info);
  }

  public getProcess(id: string): MCPProcessInfo | undefined {
    return this.processes.get(id)?.info;
  }

  public spawnProcess(req: SpawnRequest): MCPProcessInfo {
    // 1. Validate Command against Sandbox
    const cmdCheck = this.sandbox.validateCommand(req.command);
    if (!cmdCheck.valid) {
      throw new Error(cmdCheck.reason);
    }

    // 2. Validate Working Directory if provided
    if (req.cwd) {
      const pathCheck = this.sandbox.validatePath(req.cwd);
      if (!pathCheck.valid) {
        throw new Error(pathCheck.reason);
      }
    }

    // Stop existing process if running with same id
    if (this.processes.has(req.id)) {
      this.stopProcess(req.id);
    }

    const args = req.args || [];
    const child = spawn(req.command, args, {
      cwd: req.cwd || process.cwd(),
      env: { ...process.env, ...(req.env || {}) },
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
    });

    const info: MCPProcessInfo = {
      id: req.id,
      name: req.name,
      command: req.command,
      args,
      pid: child.pid,
      status: 'running',
      startedAt: new Date().toISOString(),
    };

    const active: ActiveProcess = {
      info,
      process: child,
      buffer: '',
      pendingRequests: new Map(),
    };

    child.stdout?.on('data', (chunk: Buffer) => {
      active.buffer += chunk.toString('utf8');
      const lines = active.buffer.split('\n');
      active.buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const parsed: JSONRPCResponse = JSON.parse(trimmed);
          if (parsed.id !== undefined && active.pendingRequests.has(parsed.id)) {
            const resolver = active.pendingRequests.get(parsed.id)!;
            active.pendingRequests.delete(parsed.id);
            resolver(parsed);
          }
        } catch {
          // stdout might include debug logging from MCP server
        }
      }
    });

    child.stderr?.on('data', (chunk: Buffer) => {
      const errStr = chunk.toString('utf8').trim();
      if (errStr) {
        info.lastError = errStr;
      }
    });

    child.on('exit', (code) => {
      info.status = 'stopped';
      info.lastError = code !== 0 ? `Proceso finalizado con código ${code}` : undefined;
    });

    child.on('error', (err) => {
      info.status = 'error';
      info.lastError = err.message;
    });

    this.processes.set(req.id, active);
    return info;
  }

  public async sendJSONRPC(processId: string, req: JSONRPCRequest, timeoutMs = 10000): Promise<JSONRPCResponse> {
    const active = this.processes.get(processId);
    if (!active || active.info.status !== 'running') {
      throw new Error(`Proceso MCP '${processId}' no está en ejecución.`);
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        active.pendingRequests.delete(req.id);
        reject(new Error(`Timeout de comunicación JSON-RPC (${timeoutMs}ms) con proceso '${processId}'`));
      }, timeoutMs);

      active.pendingRequests.set(req.id, (res) => {
        clearTimeout(timer);
        resolve(res);
      });

      try {
        active.process.stdin?.write(JSON.stringify(req) + '\n');
      } catch (err: any) {
        clearTimeout(timer);
        active.pendingRequests.delete(req.id);
        reject(err);
      }
    });
  }

  public stopProcess(id: string): boolean {
    const active = this.processes.get(id);
    if (!active) return false;

    try {
      active.process.kill('SIGTERM');
      active.info.status = 'stopped';
      this.processes.delete(id);
      return true;
    } catch {
      return false;
    }
  }

  public stopAll() {
    for (const [id] of this.processes) {
      this.stopProcess(id);
    }
  }
}
