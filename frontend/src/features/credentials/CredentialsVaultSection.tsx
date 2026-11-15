import React, { useState } from 'react';
import {
  KeyRound,
  Plus,
  Trash2,
  ShieldCheck,
  Calendar,
  Lock,
  Loader2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProviderLogo } from '@/components/shared/ProviderLogo';
import { formatDate } from '@/lib/utils';
import { useCredentials, useDeleteCredential } from './hooks';
import { CredentialModal } from './CredentialModal';
import { APICredential } from '@/types';

export const CredentialsVaultSection: React.FC = () => {
  const { data: credentials = [], isLoading } = useCredentials();
  const deleteMutation = useDeleteCredential();
  const [modalOpen, setModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
                  <div className="flex items-center gap-2.5">
                    <ProviderLogo providerId={cred.providerId} size="md" className="shadow ring-1 ring-slate-800" />
                    <div>
                      <CardTitle className="text-sm font-[510] text-fg-primary">
                        {cred.name}
                      </CardTitle>
                      <Badge variant="outline" className="text-xs font-mono capitalize mt-0.5">
                        {cred.providerId}
                      </Badge>
                    </div>
                  </div>
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
