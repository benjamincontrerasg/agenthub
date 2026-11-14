import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useMCPStore } from '@/stores/mcp.store';
import { Server, ShieldAlert, FolderLock, Terminal } from 'lucide-react';

interface RegisterMCPServerModalProps {
  open: boolean;
  onClose: () => void;
}

export const RegisterMCPServerModal: React.FC<RegisterMCPServerModalProps> = ({ open, onClose }) => {
  const { addServer } = useMCPStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [transport, setTransport] = useState<'stdio' | 'streamable-http'>('stdio');
  const [commandOrEndpoint, setCommandOrEndpoint] = useState('');
  const [argsText, setArgsText] = useState('');
  const [envText, setEnvText] = useState('');
  const [dirsText, setDirsText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !commandOrEndpoint.trim()) {
      setError('El nombre y el comando/endpoint son obligatorios.');
      return;
    }

    const args = argsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const allowedDirectories = dirsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const env: Record<string, string> = {};
    envText.split('\n').forEach((line) => {
      const [k, ...v] = line.split('=');
      if (k && v.length) env[k.trim()] = v.join('=').trim();
    });

    addServer({
      name,
      description: description || 'Servidor MCP registrado en AgentHub.',
      transport,
      commandOrEndpoint,
      args: args.length ? args : undefined,
      env: Object.keys(env).length ? env : undefined,
      allowedDirectories: allowedDirectories.length ? allowedDirectories : undefined,
    });

    // Reset form
    setName('');
    setDescription('');
    setCommandOrEndpoint('');
    setArgsText('');
    setEnvText('');
    setDirsText('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onClose={onClose} className="sm:max-w-xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg-success/60 border border-fg-success/60 text-fg-success">
                <Server className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle>Registrar Servidor MCP</DialogTitle>
                <DialogDescription>
                  Configura un servidor Model Context Protocol vía STDIO o Streamable HTTP.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Security Architecture Notice */}
          <div className="mb-4 rounded-lg border border-fg-warning/60 bg-bg-warning/25 p-3 text-caption text-fg-warning flex items-start gap-2.5">
            <ShieldAlert className="h-4 w-4 shrink-0 text-fg-warning mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold block">Seguridad del Sistema (Zero Local Execution):</span>
              <p className="text-caption text-fg-warning/80 leading-relaxed">
                El frontend <strong>no ejecuta</strong> directamente comandos de PowerShell ni procesos en el host. El servidor se registrará inicialmente en estado <Badge variant="warning" className="text-caption py-0 px-1 inline-flex">Pendiente de validación</Badge> y requerirá confirmación antes de ser activado por el Local Agent.
              </p>
            </div>
          </div>

          <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
            {error && (
              <div className="p-2 rounded bg-bg-error/50 border border-fg-error text-caption text-fg-error">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-caption font-medium text-fg-secondary mb-1">
                  Nombre del Servidor
                </label>
                <Input
                  placeholder="ej. GitHub Cloud MCP"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-caption font-medium text-fg-secondary mb-1">
                  Protocolo de Transporte
                </label>
                <Select
                  value={transport}
                  onChange={(e) => setTransport(e.target.value as any)}
                >
                  <option value="stdio">STDIO (Proceso Local Sandbox)</option>
                  <option value="streamable-http">Streamable HTTP (Servicio Remoto SSE)</option>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-caption font-medium text-fg-secondary mb-1">
                Descripción
              </label>
              <Input
                placeholder="Herramientas y propósito de este servidor MCP..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-caption font-medium text-fg-secondary mb-1">
                {transport === 'stdio' ? 'Comando Ejecutable (STDIO)' : 'Endpoint URL (HTTP SSE)'}
              </label>
              <Input
                placeholder={
                  transport === 'stdio'
                    ? 'npx -y @modelcontextprotocol/server-filesystem'
                    : 'https://mcp.github.enterprise.io/v1'
                }
                value={commandOrEndpoint}
                onChange={(e) => setCommandOrEndpoint(e.target.value)}
              />
            </div>

            {transport === 'stdio' && (
              <>
                <div>
                  <label className="block text-caption font-medium text-fg-secondary mb-1">
                    Argumentos CLI (uno por línea)
                  </label>
                  <Textarea
                    rows={2}
                    placeholder="C:\dev\workspace&#10;--readonly"
                    value={argsText}
                    onChange={(e) => setArgsText(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-caption font-medium text-fg-secondary mb-1 flex items-center gap-1.5">
                    <FolderLock className="h-3 w-3 text-fg-success" />
                    Directorios Autorizados (Sandboxed Paths)
                  </label>
                  <Textarea
                    rows={2}
                    placeholder="C:\dev\workspace&#10;C:\dev\projects"
                    value={dirsText}
                    onChange={(e) => setDirsText(e.target.value)}
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-caption font-medium text-fg-secondary mb-1">
                Variables de Entorno (KEY=VALUE por línea)
              </label>
              <Textarea
                rows={2}
                placeholder="GITHUB_PERSONAL_ACCESS_TOKEN=ghp_...&#10;LOG_LEVEL=info"
                value={envText}
                onChange={(e) => setEnvText(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="mt-5">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="default" size="sm">
              Registrar Servidor (Pendiente Validación)
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

