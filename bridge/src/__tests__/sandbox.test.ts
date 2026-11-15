import { describe, it, expect } from 'vitest';
import { SecuritySandbox } from '../sandbox.js';

describe('Local Agent Security Sandbox', () => {
  it('allows authorized commands (node, npx, python, docker, uvx)', () => {
    const sandbox = new SecuritySandbox();
    expect(sandbox.validateCommand('npx').valid).toBe(true);
    expect(sandbox.validateCommand('node').valid).toBe(true);
    expect(sandbox.validateCommand('python').valid).toBe(true);
    expect(sandbox.validateCommand('docker').valid).toBe(true);
  });

  it('rejects unauthorized or dangerous commands', () => {
    const sandbox = new SecuritySandbox();
    expect(sandbox.validateCommand('powershell.exe').valid).toBe(false);
    expect(sandbox.validateCommand('bash').valid).toBe(false);
    expect(sandbox.validateCommand('rm').valid).toBe(false);
    expect(sandbox.validateCommand('curl').valid).toBe(false);
  });

  it('blocks dangerous argument patterns (-c, -e, --eval, volume mounts)', () => {
    const sandbox = new SecuritySandbox();
    expect(sandbox.validateCommand('python', ['-c', 'import os']).valid).toBe(false);
    expect(sandbox.validateCommand('node', ['-e', 'process.exit()']).valid).toBe(false);
    expect(sandbox.validateCommand('node', ['--eval', 'console.log(1)']).valid).toBe(false);
    expect(sandbox.validateCommand('docker', ['run', '-v', '/:/host']).valid).toBe(false);
    expect(sandbox.validateCommand('docker', ['run', '--volume', '/:/host']).valid).toBe(false);
    expect(sandbox.validateCommand('node', ['server.js']).valid).toBe(true);
    expect(sandbox.validateCommand('python', ['script.py']).valid).toBe(true);
  });

  it('restricts path access to authorized sandbox directories', () => {
    const sandbox = new SecuritySandbox(['C:/projects/safe', 'C:/work/mcp']);
    expect(sandbox.validatePath('C:/projects/safe/data.json').valid).toBe(true);
    expect(sandbox.validatePath('C:/work/mcp/subfolder/file.ts').valid).toBe(true);
    expect(sandbox.validatePath('C:/Windows/System32/cmd.exe').valid).toBe(false);
  });
});
