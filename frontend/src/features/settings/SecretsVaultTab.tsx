import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  ShieldCheck,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Check,
  Lock,
  Database,
  Webhook,
  Layers,
  Sparkles,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/services/api';
import { toast } from '@/stores/toast.store';

export interface SecretItem {
  id: string;
  name: string;
  description?: string | null;
  maskedValue: string;
  category: 'api_key' | 'database' | 'auth' | 'webhook' | 'custom';
  createdAt: string;
  updatedAt: string;
}

const categoryIcons: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  api_key: { label: 'API Key', icon: KeyRound, color: 'text-amber-400' },
  database: { label: 'Base de Datos', icon: Database, color: 'text-blue-400' },
  auth: { label: 'Autenticación', icon: Lock, color: 'text-emerald-400' },
  webhook: { label: 'Webhook HMAC', icon: Webhook, color: 'text-purple-400' },
  custom: { label: 'Personalizado', icon: Layers, color: 'text-zinc-400' },
};

export const SecretsVaultTab: React.FC = () => {
  const [secrets, setSecrets] = useState<SecretItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [revealedValues, setRevealedValues] = useState<Record<string, string>>({});
  const [revealingKey, setRevealingKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // New secret form
  const [newName, setNewName] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<'api_key' | 'database' | 'auth' | 'webhook' | 'custom'>('custom');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSecrets = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient<SecretItem[]>('/secrets');
      setSecrets(data);
    } catch {
      // Fallback for mock mode
      setSecrets([
        {
          id: 'sec-db-url',
          name: 'DATABASE_URL',
          description: 'Cadena de conexión a base de datos primaria',
          maskedValue: 'sqli••••••••a.db',
          category: 'database',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'sec-ollama-host',
          name: 'OLLAMA_HOST',
          description: 'Host local de inferencia para modelos Ollama',
          maskedValue: 'http••••••••1434',
          category: 'api_key',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'sec-webhook-secret',
          name: 'WEBHOOK_SIGNING_SECRET',
          description: 'Clave HMAC para validar webhooks entrantes de CI/CD',
          maskedValue: 'whse••••••••dcba',
          category: 'webhook',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSecrets();
  }, []);

  const handleReveal = async (name: string) => {
    if (revealedValues[name]) {
      // Hide
      setRevealedValues((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
      return;
    }

    setRevealingKey(name);
    try {
      const res = await apiClient<{ name: string; value: string }>(`/secrets/${name}/reveal`, {
        method: 'POST',
      });
      setRevealedValues((prev) => ({ ...prev, [name]: res.value }));
      toast.info('Valor Revelado', `Acceso a "${name}" registrado en la auditoría inmutable.`);

      // Auto-hide after 10s for safety
      setTimeout(() => {
        setRevealedValues((prev) => {
          const next = { ...prev };
          delete next[name];
          return next;
        });
      }, 10000);
    } catch {
      toast.error('Error', 'No se pudo descifrar el secreto.');
    } finally {
      setRevealingKey(null);
    }
  };

  const handleCopy = (name: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(name);
    toast.success('Copiado', `Secreto "${name}" copiado al portapapeles.`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newValue.trim()) return;

    setIsSubmitting(true);
    try {
      const created = await apiClient<SecretItem>('/secrets', {
        method: 'POST',
        body: JSON.stringify({
          name: newName.trim(),
          value: newValue.trim(),
          description: newDesc.trim() || undefined,
          category: newCategory,
        }),
      });

      setSecrets((prev) => [created, ...prev.filter((s) => s.name !== created.name)]);
      setNewName('');
      setNewValue('');
      setNewDesc('');
      setIsCreating(false);
      toast.success('Secreto Guardado', `Variable "${created.name}" cifrada con AES-256-GCM.`);
    } catch {
      toast.error('Error', 'No se pudo guardar el secreto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`¿Estás seguro de eliminar permanentemente el secreto "${name}"? Esta acción se auditará.`)) {
      return;
    }

    try {
      await apiClient(`/secrets/${name}`, { method: 'DELETE' });
      setSecrets((prev) => prev.filter((s) => s.name !== name));
      setRevealedValues((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
      toast.success('Secreto Eliminado', `Variable "${name}" removida del almacén seguro.`);
    } catch {
      toast.error('Error', 'No se pudo eliminar el secreto.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Zero-Trust Architecture Banner */}
      <div className="rounded-[12px] border border-border-default bg-bg-card p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 h-9 w-9 rounded-[8px] bg-bg-brand-subtle flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5 text-fg-brand" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-body font-[510] text-fg-primary flex items-center gap-2">
              Bóveda de Secretos & Variables de Entorno Zero-Trust
              <Badge variant="outline" className="text-[10px] font-mono text-fg-brand border-border-brand/40">
                AES-256-GCM
              </Badge>
            </h3>
            <p className="mt-1 text-caption text-fg-secondary">
              Las claves y variables se almacenan cifradas en reposo con sal criptográfica única y autenticación GCM.
              Cada intento de descifrado genera una traza inmutable en el registro de auditoría.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setIsCreating(!isCreating)}
            className="gap-1.5 shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            Nuevo Secreto
          </Button>
        </div>
      </div>

      {/* New Secret Form */}
      {isCreating && (
        <Card className="bg-bg-card border-border-brand/40 animate-in fade-in duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-body flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-fg-brand" />
              Registrar Nueva Variable o Secreto
            </CardTitle>
            <CardDescription className="text-caption">
              El valor será cifrado de inmediato antes de persistirse en la base de datos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-caption font-medium text-fg-secondary block mb-1">
                    Nombre de Variable (UPPERCASE)
                  </label>
                  <Input
                    placeholder="EJ: STRIPE_SECRET_KEY"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))}
                    className="font-mono text-caption"
                    required
                  />
                </div>
                <div>
                  <label className="text-caption font-medium text-fg-secondary block mb-1">
                    Categoría
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full h-9 rounded-[6px] border border-border-default bg-bg-surface px-3 text-caption text-fg-primary focus:outline-none focus:border-border-brand"
                  >
                    <option value="custom">Personalizado</option>
                    <option value="api_key">API Key</option>
                    <option value="database">Base de Datos</option>
                    <option value="auth">Autenticación / JWT</option>
                    <option value="webhook">Webhook HMAC</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-caption font-medium text-fg-secondary block mb-1">
                  Valor Secreto
                </label>
                <Input
                  type="password"
                  placeholder="Introduce el valor confidencial..."
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="font-mono text-caption"
                  required
                />
              </div>

              <div>
                <label className="text-caption font-medium text-fg-secondary block mb-1">
                  Descripción (Opcional)
                </label>
                <Input
                  placeholder="Para qué se utiliza este secreto..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="text-caption"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCreating(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || !newName.trim() || !newValue.trim()}
                  className="gap-1.5"
                >
                  {isSubmitting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
                  Cifrar y Guardar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Secrets List */}
      <Card className="bg-bg-card border-border-default">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-body flex items-center gap-2">
              <Lock className="h-4 w-4 text-fg-brand" />
              Variables Disponibles ({secrets.length})
            </CardTitle>
            <CardDescription className="text-caption">
              Variables accesibles por agentes, pipelines y conectores MCP autorizados.
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchSecrets}
            disabled={isLoading}
            className="gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {secrets.length === 0 ? (
            <div className="text-center py-8">
              <Lock className="h-8 w-8 text-fg-muted mx-auto mb-2" />
              <p className="text-body text-fg-secondary">No hay secretos registrados</p>
              <p className="text-caption text-fg-muted mt-1">
                Haz clic en "Nuevo Secreto" para agregar variables de entorno cifradas.
              </p>
            </div>
          ) : (
            secrets.map((sec) => {
              const catInfo = categoryIcons[sec.category] || categoryIcons.custom;
              const CatIcon = catInfo.icon;
              const isRevealed = Boolean(revealedValues[sec.name]);
              const displayVal = isRevealed ? revealedValues[sec.name] : sec.maskedValue;

              return (
                <div
                  key={sec.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-[8px] border border-border-default bg-bg-surface hover:border-border-hover transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-caption font-[510] text-fg-primary">
                        {sec.name}
                      </span>
                      <Badge variant="outline" className={`text-[10px] ${catInfo.color} border-current/30`}>
                        <CatIcon className="h-2.5 w-2.5 mr-1" />
                        {catInfo.label}
                      </Badge>
                    </div>
                    {sec.description && (
                      <p className="text-caption text-fg-muted mt-0.5 truncate">{sec.description}</p>
                    )}
                    <div className="mt-1 flex items-center gap-2">
                      <code className="px-2 py-0.5 rounded bg-bg-card font-mono text-xs text-fg-secondary border border-border-default/60">
                        {displayVal}
                      </code>
                      {isRevealed && (
                        <span className="text-[10px] text-amber-400 font-mono flex items-center gap-0.5">
                          <AlertCircle className="h-2.5 w-2.5" />
                          Auto-ocultado en 10s
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleReveal(sec.name)}
                      disabled={revealingKey === sec.name}
                      title={isRevealed ? 'Ocultar valor' : 'Revelar valor (auditado)'}
                      className="h-8 w-8 p-0"
                    >
                      {revealingKey === sec.name ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-fg-brand" />
                      ) : isRevealed ? (
                        <EyeOff className="h-3.5 w-3.5 text-amber-400" />
                      ) : (
                        <Eye className="h-3.5 w-3.5 text-fg-secondary hover:text-fg-primary" />
                      )}
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(sec.name, isRevealed ? revealedValues[sec.name] : sec.name)}
                      title="Copiar valor"
                      className="h-8 w-8 p-0"
                    >
                      {copiedKey === sec.name ? (
                        <Check className="h-3.5 w-3.5 text-fg-success" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-fg-secondary hover:text-fg-primary" />
                      )}
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(sec.name)}
                      title="Eliminar secreto"
                      className="h-8 w-8 p-0 text-fg-error hover:bg-bg-error-subtle"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
};
