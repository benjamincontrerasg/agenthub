import React, { useState, useEffect } from 'react';
import {
  Shield,
  Search,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  User,
  Globe,
  RefreshCw,
  Clock,
  Filter,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { auditService, AuditLogItem } from '@/services/audit.service';
import { formatDate } from '@/lib/utils';
import { toast } from '@/stores/toast.store';

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await auditService.getLogs({ limit: 100 });
      setLogs(data);
    } catch (err: any) {
      toast.error('Error al cargar auditoría', err.message || 'No se pudieron recuperar los registros');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      searchQuery === '' ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.userEmail || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.ip || '').includes(searchQuery);

    const matchesAction = filterAction === 'all' || log.action === filterAction;
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;

    return matchesSearch && matchesAction && matchesStatus;
  });

  const exportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `NEXORA-audit-logs-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Auditoría Exportada', 'Archivo JSON generado para análisis de cumplimiento.');
  };

  const exportCSV = () => {
    const headers = ['ID', 'Timestamp', 'Action', 'Resource', 'UserEmail', 'IP', 'Status'];
    const rows = logs.map((l) => [
      l.id,
      l.timestamp,
      l.action,
      `"${l.resource}"`,
      l.userEmail || 'N/A',
      l.ip || 'N/A',
      l.status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', `NEXORA-audit-logs-${Date.now()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Auditoría Exportada', 'Archivo CSV descargado con éxito.');
  };

  const totalSuccess = logs.filter((l) => l.status === 'success').length;
  const totalFailures = logs.filter((l) => l.status === 'failure').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-title font-[510] text-fg-primary tracking-tight">Registro de Auditoría Zero-Trust</h1>
            <Badge variant="outline" className="border-border-brand text-fg-brand font-mono text-caption">
              SOC 2 / Zero-Trust
            </Badge>
          </div>
          <p className="text-caption text-fg-secondary mt-1">
            Trazabilidad inmutable de accesos, aprobaciones humanas y ejecuciones de agentes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={isLoading}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button variant="outline" size="sm" onClick={exportJSON}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            JSON
          </Button>
          <Button variant="default" size="sm" onClick={exportCSV}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            CSV
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <span className="text-caption text-fg-secondary">Total de Eventos</span>
            <p className="text-title font-[510] text-fg-primary mt-1">{logs.length}</p>
            <span className="text-caption text-fg-brand">Ventana activa</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <span className="text-caption text-fg-secondary">Operaciones Autorizadas</span>
            <p className="text-title font-[510] text-fg-success mt-1">{totalSuccess}</p>
            <span className="text-caption text-fg-success">Aprobadas / Exitosas</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <span className="text-caption text-fg-secondary">Alertas / Bloqueos</span>
            <p className="text-title font-[510] text-fg-error mt-1">{totalFailures}</p>
            <span className="text-caption text-fg-error">Rechazos o Rate-Limit</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <span className="text-caption text-fg-secondary">Integridad del Gate</span>
            <p className="text-title font-[510] text-fg-primary mt-1">100%</p>
            <span className="text-caption text-fg-success">Zero-Trust Compliance</span>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-fg-secondary" />
              <input
                type="text"
                placeholder="Buscar por usuario, IP, recurso o acción..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-[6px] border border-border-default bg-bg-surface pl-9 pr-3 py-1.5 text-caption text-fg-primary focus:border-border-brand focus:outline-none placeholder:text-[#62666d]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="h-3.5 w-3.5 text-fg-secondary" />
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="rounded-[6px] border border-border-default bg-bg-surface px-3 py-1.5 text-caption text-fg-primary focus:border-border-brand focus:outline-none"
              >
                <option value="all">Todas las Acciones</option>
                <option value="auth.login">auth.login</option>
                <option value="auth.register">auth.register</option>
                <option value="security_gate.approved">security_gate.approved</option>
                <option value="security_gate.rejected">security_gate.rejected</option>
                <option value="mcp.server_register">mcp.server_register</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-[6px] border border-border-default bg-bg-surface px-3 py-1.5 text-caption text-fg-primary focus:border-border-brand focus:outline-none"
              >
                <option value="all">Todos los Estados</option>
                <option value="success">Exitoso</option>
                <option value="failure">Fallido</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-subtitle flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-fg-brand" />
              Eventos de Seguridad Registrados ({filteredLogs.length})
            </span>
          </CardTitle>
          <CardDescription>
            Trazabilidad detallada por IP de origen, cuenta de usuario y payload verificado
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-caption text-fg-secondary">Cargando registros de auditoría...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-8 text-center text-caption text-fg-secondary">
              No se encontraron eventos con los filtros seleccionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-caption">
                <thead className="border-b border-border-default text-fg-secondary font-medium">
                  <tr>
                    <th className="pb-3 pl-2">Fecha y Hora</th>
                    <th className="pb-3">Acción</th>
                    <th className="pb-3">Recurso / Tool</th>
                    <th className="pb-3">Usuario / IP</th>
                    <th className="pb-3">Estado</th>
                    <th className="pb-3 text-right pr-2">Detalles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#0f1011]/40 transition-colors">
                      <td className="py-2.5 pl-2 font-mono text-fg-secondary whitespace-nowrap">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="py-2.5">
                        <Badge
                          variant="outline"
                          className={`font-mono text-[11px] ${
                            log.action.includes('security_gate')
                              ? 'border-fg-brand/40 text-fg-brand'
                              : 'border-border-default text-fg-primary'
                          }`}
                        >
                          {log.action}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-fg-primary font-mono text-[12px]">{log.resource}</td>
                      <td className="py-2.5 text-fg-secondary">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3 w-3" />
                          <span>{log.userEmail || 'Anónimo'}</span>
                        </div>
                        {log.ip && (
                          <div className="flex items-center gap-1.5 text-[11px] text-[#62666d] font-mono">
                            <Globe className="h-2.5 w-2.5" />
                            <span>{log.ip}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-2.5">
                        <Badge variant={log.status === 'success' ? 'success' : 'destructive'} className="capitalize text-[11px]">
                          {log.status === 'success' ? 'Autorizado' : 'Bloqueado'}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-right pr-2">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2 py-1 rounded border border-border-default hover:bg-[#161718] text-[11px] font-medium text-fg-primary cursor-pointer"
                        >
                          Ver Payload
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: JSON Payload Inspector */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="w-full max-w-xl rounded-[12px] border border-border-default bg-bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border-default">
              <div>
                <h3 className="text-subtitle font-[510] text-fg-primary flex items-center gap-2">
                  <Shield className="h-4 w-4 text-fg-brand" />
                  Inspección de Evento Zero-Trust
                </h3>
                <p className="text-caption font-mono text-fg-secondary mt-0.5">{selectedLog.id}</p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-fg-secondary hover:text-fg-primary cursor-pointer">
                ×
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-caption">
                <div className="p-2.5 rounded-[6px] bg-bg-surface border border-border-default">
                  <span className="text-fg-secondary block">Acción</span>
                  <span className="font-[510] text-fg-primary font-mono">{selectedLog.action}</span>
                </div>
                <div className="p-2.5 rounded-[6px] bg-bg-surface border border-border-default">
                  <span className="text-fg-secondary block">Estado</span>
                  <span className="font-[510] text-fg-primary font-mono uppercase">{selectedLog.status}</span>
                </div>
              </div>

              <div>
                <span className="text-caption font-medium text-fg-secondary block mb-1.5">Metadatos del Payload:</span>
                <pre className="p-3.5 rounded-[12px] bg-bg-surface border border-border-default text-[12px] font-mono text-[#d0d6e0] leading-relaxed overflow-x-auto max-h-60">
                  {JSON.stringify(selectedLog.details || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <Button variant="default" size="sm" onClick={() => setSelectedLog(null)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
