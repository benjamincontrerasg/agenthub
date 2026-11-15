import React, { useState } from 'react';
import {
  KeyRound,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  ShieldCheck,
  Calendar,
  Lock,
  Loader2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ProviderLogo } from '@/components/shared/ProviderLogo';
import { formatDate } from '@/lib/utils';
import { useCredentials, useDeleteCredential, useUpdateCredential } from './hooks';
import { CredentialModal } from './CredentialModal';
import { APICredential } from '@/types';

export const CredentialsVaultSection: React.FC = () => {
  const { data: credentials = [], isLoading } = useCredentials();
  const deleteMutation = useDeleteCredential();
  const updateMutation = useUpdateCredential();
  const [modalOpen, setModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleDelete = async (cred: APICredential) => {
    if (window.confirm(`¿Seguro que deseas eliminar la credencial '${cred.name}'? Los agentes que la utilicen pasarán a usar la clave predeterminada del proveedor.`)) {
      setDeletingId(cred.id);
      try {
        await deleteMutation.mutateAsync(cred.id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleStartEdit = (cred: APICredential) => {
    setEditingId(cred.id);
    setEditingName(cred.name);
  };

  const handleSaveEdit = async (id: string) => {
    const trimmed = editingName.trim();
    if (!trimmed) return;
    try {
      await updateMutation.mutateAsync({ id, name: trimmed });
      setEditingId(null);
    } catch {}
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  return (
    <div className="space-y-4 pt-6 border-t border-border-default/80">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-[510] tracking-tight text-fg-primary flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-fg-brand" />
              Bóveda de Credenciales / API Keys Nombradas
            </h3>
            {!isLoading && (
              <Badge variant="secondary" className="font-mono text-caption">
                {credentials.length} Guardadas
              </Badge>
            )}
          </div>
          <p className="mt-1 text-caption text-fg-secondary">
            Guarda tus claves con un nombre descriptivo. Al configurar tus agentes, selecciona solo el nombre sin exponer la clave completa ni volver a escribirla.
          </p>
        </div>

        <Button
          variant="default"
          size="sm"
          className="gap-1.5 shrink-0"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Nueva API Key
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center p-8 rounded-[12px] border border-border-default bg-bg-card/40 space-x-2">
          <Loader2 className="h-5 w-5 animate-spin text-fg-brand" />
          <span className="text-caption text-fg-secondary">Cargando credenciales de la bóveda...</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && credentials.length === 0 && (
        <div className="flex flex-col items-center justify-center p-8 rounded-[12px] border border-dashed border-border-default bg-bg-card/30 text-center space-y-3">
          <div className="p-3 rounded-full bg-fg-brand/10 text-fg-brand">
            <Lock className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="text-subtitle font-medium text-fg-primary">Bóveda sin credenciales adicionales</p>
            <p className="text-caption text-fg-secondary max-w-md">
              Crea alias para tus API keys (ej. "Mi OpenAI Personal", "Claude Equipo"). Podrás asociarlas directamente a agentes individuales.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-caption"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Agregar Primera API Key
          </Button>
        </div>
      )}

      {/* Credentials Grid */}
      {!isLoading && credentials.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {credentials.map((cred) => (
            <Card
              key={cred.id}
              className="border-border-default bg-bg-card/60 hover:border-border-default/90 transition-all flex flex-col justify-between"
            >
              <CardHeader className="pb-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <ProviderLogo providerId={cred.providerId} size="md" className="shadow ring-1 ring-slate-800 shrink-0" />
                    <div className="flex-1 min-w-0">
                      {editingId === cred.id ? (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(cred.id);
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            className="h-7 text-xs py-0 px-2"
                            autoFocus
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-fg-success hover:bg-fg-success/10 shrink-0"
                            onClick={() => handleSaveEdit(cred.id)}
                            isLoading={updateMutation.isPending}
                            title="Guardar nombre"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-fg-muted hover:bg-slate-700/20 shrink-0"
                            onClick={handleCancelEdit}
                            title="Cancelar"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <CardTitle className="text-sm font-[510] text-fg-primary truncate" title={cred.name}>
                            {cred.name}
                          </CardTitle>
                          <Badge variant="outline" className="text-xs font-mono capitalize mt-0.5">
                            {cred.providerId}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                  {editingId !== cred.id && (
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-fg-secondary hover:text-fg-brand"
                        title="Editar alias"
                        onClick={() => handleStartEdit(cred)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-fg-secondary hover:text-fg-error"
                        title="Eliminar credencial"
                        onClick={() => handleDelete(cred)}
                        isLoading={deletingId === cred.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-1 pb-3 space-y-2.5">
                <div className="flex items-center justify-between text-caption px-2.5 py-1.5 rounded-[6px] bg-bg-card border border-border-default/80 font-mono">
                  <span className="text-fg-secondary text-xs">Clave:</span>
                  <span className="font-semibold text-fg-primary text-xs">{cred.maskedKey}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-fg-secondary pt-0.5">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-fg-success" />
                    AES-256-GCM
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="h-3 w-3" />
                    {formatDate(cred.createdAt)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <CredentialModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};
