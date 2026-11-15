import path from 'path';
import fs from 'fs';

// Whitelist of permitted command binaries for MCP runtime execution
const ALLOWED_COMMANDS = new Set([
  'npx',
  'npx.cmd',
  'node',
  'node.exe',
  'python',
  'python.exe',
  'python3',
  'python3.exe',
  'uvx',
  'uvx.exe',
  'docker',
  'docker.exe',
  'git',
  'git.exe',
]);

export interface BinarySecurityPolicy {
  blockedArgs: RegExp[];
  description: string;
}

export const BINARY_SECURITY_POLICIES: Record<string, BinarySecurityPolicy> = {
  node: {
    blockedArgs: [/^-e$/i, /^--eval$/i, /^-p$/i, /^--print$/i, /^--inspect/i],
    description: 'Bloquea evaluación directa (-e, --eval, -p) y depuración remota',
  },
  python: {
    blockedArgs: [/^-c$/i, /^--command$/i, /^-m$/i],
    description: 'Bloquea comandos en línea (-c, -m)',
  },
  python3: {
    blockedArgs: [/^-c$/i, /^--command$/i, /^-m$/i],
    description: 'Bloquea comandos en línea (-c, -m)',
  },
  docker: {
    blockedArgs: [
      /^-v$/i,
      /^--volume/i,
      /^--mount/i,
      /^--privileged/i,
      /^--net=host/i,
      /^--network=host/i,
      /^--pid=host/i,
      /^--cap-add/i,
    ],
    description: 'Bloquea montaje de volúmenes de host y contenedores privilegiados',
  },
  git: {
    blockedArgs: [/^-c$/i, /^--exec-path/i, /^--config-env/i, /^--upload-pack/i],
    description: 'Bloquea inyección de configuración y ejecución de comandos remotos',
  },
  npx: {
    blockedArgs: [/^-e$/i, /^--eval$/i, /^-c$/i],
    description: 'Bloquea evaluación directa no empaquetada',
  },
  uvx: {
    blockedArgs: [/^-c$/i, /^--command$/i],
    description: 'Bloquea ejecución directa en línea',
  },
};

// Global forbidden argument patterns
const GLOBAL_FORBIDDEN_ARG_PATTERNS = [
  /^-c$/i,
  /^-e$/i,
  /^--eval$/i,
  /^-v$/i,
  /^--volume/i,
  /^--mount/i,
  /^--privileged/i,
  /^--net=host/i,
  /^--network=host/i,
  /^--pid=host/i,
];

export class SecuritySandbox {
  private authorizedDirs: string[];

  constructor(authorizedDirs: string[] = []) {
    this.authorizedDirs = authorizedDirs.map((d) => path.resolve(d));
  }

  public setAuthorizedDirectories(dirs: string[]) {
    this.authorizedDirs = dirs.map((d) => path.resolve(d));
  }

  public getAuthorizedDirectories(): string[] {
    return [...this.authorizedDirs];
  }

  public validateCommand(command: string, args: string[] = []): { valid: boolean; reason?: string } {
    const rawBase = path.basename(command).toLowerCase();
    const baseCmd = rawBase.replace(/\.(exe|cmd|bat)$/i, '');

    if (!ALLOWED_COMMANDS.has(rawBase) && !ALLOWED_COMMANDS.has(baseCmd)) {
      return {
        valid: false,
        reason: `Comando '${command}' no permitido por política de Sandbox Zero-Trust. Comandos autorizados: ${Array.from(ALLOWED_COMMANDS).join(', ')}`,
      };
    }

    const binaryPolicy = BINARY_SECURITY_POLICIES[baseCmd];

    for (const arg of args) {
      const trimmed = arg.trim();

      // Validación por binario específico
      if (binaryPolicy) {
        for (const pattern of binaryPolicy.blockedArgs) {
          if (pattern.test(trimmed)) {
            return {
              valid: false,
              reason: `Argumento prohibido '${arg}' para el binario '${baseCmd}'. Política Zero-Trust: ${binaryPolicy.description}.`,
            };
          }
        }
      }

      // Validación global defensiva
      for (const pattern of GLOBAL_FORBIDDEN_ARG_PATTERNS) {
        if (pattern.test(trimmed)) {
          return {
            valid: false,
            reason: `Argumento prohibido '${arg}' detectado por política global del Sandbox Zero-Trust.`,
          };
        }
      }
    }

    return { valid: true };
  }

  public validatePath(targetPath: string): { valid: boolean; reason?: string } {
    if (this.authorizedDirs.length === 0) {
      return { valid: true };
    }

    const resolved = path.resolve(targetPath);
    let realTarget: string;
    try {
      realTarget = fs.existsSync(resolved) ? fs.realpathSync(resolved) : resolved;
    } catch {
      realTarget = resolved;
    }

    const isAuthorized = this.authorizedDirs.some((dir) => {
      let realDir: string;
      try {
        realDir = fs.existsSync(dir) ? fs.realpathSync(dir) : dir;
      } catch {
        realDir = dir;
      }
      return realTarget === realDir || realTarget.startsWith(realDir + path.sep);
    });

    if (!isAuthorized) {
      return {
        valid: false,
        reason: `Ruta '${targetPath}' fuera del sandbox autorizado (verificación de symlinks y ../). Directorios permitidos: ${this.authorizedDirs.join('; ')}`,
      };
    }

    return { valid: true };
  }
}
