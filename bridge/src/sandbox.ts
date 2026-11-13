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

  public validateCommand(command: string): { valid: boolean; reason?: string } {
    const baseCmd = path.basename(command).toLowerCase();
    if (!ALLOWED_COMMANDS.has(baseCmd)) {
      return {
        valid: false,
        reason: `Comando '${command}' no permitido por política de Sandbox Zero-Trust. Comandos autorizados: ${Array.from(ALLOWED_COMMANDS).join(', ')}`,
      };
    }
    return { valid: true };
  }

  public validatePath(targetPath: string): { valid: boolean; reason?: string } {
    if (this.authorizedDirs.length === 0) {
      // If no directories restricted, allow current working dir
      return { valid: true };
    }

    const resolved = path.resolve(targetPath);
    const isAuthorized = this.authorizedDirs.some(
      (dir) => resolved === dir || resolved.startsWith(dir + path.sep)
    );

    if (!isAuthorized) {
      return {
        valid: false,
        reason: `Ruta '${targetPath}' fuera del sandbox autorizado. Directorios permitidos: ${this.authorizedDirs.join('; ')}`,
      };
    }

    return { valid: true };
  }
}
