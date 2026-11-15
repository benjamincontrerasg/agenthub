import { spawn, ChildProcess } from 'child_process';
import { SecuritySandbox } from './sandbox.js';
import { MCPProcessInfo, SpawnRequest, JSONRPCRequest, JSONRPCResponse } from './types.js';

interface ActiveProcess {
  info: MCPProcessInfo;
  process: ChildProcess;
  buffer: string;
  pendingRequests: Map<string | number, (response: JSONRPCResponse) => void>;
}

const SAFE_ENV_VARS = [
  'PATH',
  'Path',
  'SYSTEMROOT',
  'SystemRoot',
  'COMSPEC',
  'ComSpec',
  'PATHEXT',
  'TEMP',
  'TMP',
  'HOME',
  'USERPROFILE',
  'HOMEDRIVE',
  'HOMEPATH',
  'APPDATA',
  'LOCALAPPDATA',
  'LANG',
  'LC_ALL',
  'NODE_ENV',
];

function buildSanitizedEnv(customEnv?: Record<string, string>): Record<string, string> {
  const sanitized: Record<string, string> = {};
  for (const key of SAFE_ENV_VARS) {
    if (process.env[key] !== undefined) {
      sanitized[key] = process.env[key]!;
    }
  }
  return { ...sanitized, ...(customEnv || {}) };
}

export const MAX_CONCURRENT_PROCESSES = 10;

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
    const args = req.args || [];

    // 1. Validar límite de procesos simultáneos
    if (this.processes.size >= MAX_CONCURRENT_PROCESSES && !this.processes.has(req.id)) {
      throw new Error(`Límite máximo de procesos MCP simultáneos alcanzado (${MAX_CONCURRENT_PROCESSES}). Detén procesos inactivos.`);
    }

    // 2. Validar Comando y Argumentos contra el Sandbox
    const cmdCheck = this.sandbox.validateCommand(req.command, args);
    if (!cmdCheck.valid) {
      throw new Error(cmdCheck.reason);
    }

    // 3. Validar y confinar Directorio de Trabajo
    const targetCwd = req.cwd || process.cwd();
    const pathCheck = this.sandbox.validatePath(targetCwd);
    if (!pathCheck.valid) {
      throw new Error(pathCheck.reason);
    }

    // Detener proceso anterior con el mismo ID si existía
    if (this.processes.has(req.id)) {
      this.stopProcess(req.id);
    }

    // 4. Confinamiento: spawn sin shell y con entorno mínimo sanitizado
    const sanitizedEnv = buildSanitizedEnv(req.env);
    const child = spawn(req.command, args, {
      cwd: targetCwd,
      env: sanitizedEnv,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: false,
    });

    const info: MCPProcessInfo = {
      id: req.id,
      name: req.name,
      command: req.command,
      args,
      pid: child.pid,
      status: 'running',
      startedAt: new Date().toISOString(),
      defaultTimeoutMs: Math.min(Math.max(req.timeoutMs || 30000, 1000), 300000),
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
          // Salida de depuración no JSON-RPC ignorada
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

  public async sendJSONRPC(processId: string, req: JSONRPCRequest, timeoutMs?: number): Promise<JSONRPCResponse> {
    const active = this.processes.get(processId);
    if (!active || active.info.status !== 'running') {
      throw new Error(`Proceso MCP '${processId}' no está en ejecución.`);
    }

    const requestedTimeout = timeoutMs || active.info.defaultTimeoutMs || 30000;
    const effectiveTimeout = Math.min(Math.max(requestedTimeout, 1000), 300000);

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        active.pendingRequests.delete(req.id);
        reject(new Error(`Timeout de comunicación JSON-RPC (${effectiveTimeout}ms) con proceso '${processId}'`));
      }, effectiveTimeout);

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
