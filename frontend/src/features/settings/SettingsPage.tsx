import React, { useState } from 'react';
import {
  User,
  Palette,
  Sliders,
  Shield,
  KeyRound,
  Server,
  Terminal,
  Bell,
  Save,
  CheckCircle2,
  Zap,
  FolderLock,
  Lock,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { useSettingsStore } from '@/stores/settings.store';

export const SettingsPage: React.FC = () => {
  const {
    settings,
    updateProfile,
    updateAppearance,
    updatePreferences,
    updateSecurity,
    updateBackend,
    updateLocalAgent,
    updateNotifications,
    testBackendConnection,
    resetToDefaults,
  } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<
    'profile' | 'appearance' | 'preferences' | 'security' | 'backend' | 'localAgent' | 'notifications'
  >('security');

  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  const handleTestBackend = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testBackendConnection();
      setTestResult(`✓ ${res.message} (${res.latencyMs}ms)`);
    } catch (e: any) {
      setTestResult(`✗ Fallo de conexión: ${e.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveAll = () => {
    setSaveFeedback('✓ Configuraciones aplicadas con éxito');
    setTimeout(() => setSaveFeedback(null), 2500);
  };

  const tabs = [
    { id: 'security', label: 'Seguridad & Credenciales', icon: Shield },
    { id: 'backend', label: 'Conexión Backend', icon: Server },
    { id: 'localAgent', label: 'Local Agent & Sandbox', icon: Terminal },
    { id: 'profile', label: 'Perfil de Usuario', icon: User },
    { id: 'preferences', label: 'Preferencias', icon: Sliders },
    { id: 'appearance', label: 'Apariencia & Tema', icon: Palette },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
  ] as const;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Ajustes de la Plataforma
            <Badge variant="outline" className="font-mono text-xs">v1.0-preview</Badge>
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Administra políticas Zero-Trust, variables de backend, puentes locales MCP y preferencias del sistema.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {saveFeedback && (
            <span className="text-xs font-mono text-emerald-400 font-semibold animate-in fade-in">
              {saveFeedback}
            </span>
          )}
          <Button variant="default" size="sm" onClick={handleSaveAll} className="h-8 text-xs">
            <Save className="mr-1.5 h-3.5 w-3.5" />
            Guardar Cambios
          </Button>
        </div>
      </div>

      {/* Main Settings Navigation & Content */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Navigation Pills */}
        <div className="md:col-span-3 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-violet-600/20 text-violet-300 font-semibold border border-violet-500/40 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-violet-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}

          <div className="pt-4 border-t border-slate-800/80 mt-4">
            <button
              onClick={() => {
                if (confirm('¿Restablecer todas las configuraciones a valores por defecto?')) {
                  resetToDefaults();
                }
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-red-400 hover:bg-red-950/20 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restablecer valores iniciales
            </button>
          </div>
        </div>

        {/* Right Settings Form Area (9 cols) */}
        <div className="md:col-span-9 space-y-6">
          {/* SECURITY & CREDENTIALS TAB */}
          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  Políticas de Seguridad & Gestión de Credenciales
                </CardTitle>
                <CardDescription>
                  Gobernanza Zero-Trust para la ejecución de herramientas y protección de secretos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Critical Security Rules Box */}
                <div className="p-4 rounded-xl border border-violet-900/60 bg-violet-950/30 text-xs text-slate-300 space-y-2">
                  <span className="font-semibold text-violet-300 flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" /> Directiva de Almacenamiento Seguro (Frontend Safe):
                  </span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    AgentHub no almacena API Keys ni tokens privados en el <code>localStorage</code> del navegador ni en variables públicas empaquetadas. Toda credencial es transferida directamente al backend mediante canales cifrados TLS.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/60">
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block">
                        Aprobación Humana Obligatoria para Herramientas de Escritura
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Toda operación que modifique el disco local (write_file) o cree Pull Requests requerirá confirmación explícita del usuario.
                      </span>
                    </div>
                    <Switch
                      checked={settings.security.requireHumanApprovalForWriteTools}
                      onCheckedChange={(val) =>
                        updateSecurity({ requireHumanApprovalForWriteTools: val })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/60">
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block">
                        Validación Estricta de Servidores MCP
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Inspeccionar y requerir verificación de handshake antes de habilitar herramientas en agentes autónomos.
                      </span>
                    </div>
                    <Switch
                      checked={settings.security.strictMCPValidation}
                      onCheckedChange={(val) => updateSecurity({ strictMCPValidation: val })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/60">
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block">
                        Telemetría y Diagnóstico Anónimo
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Envío de estadísticas de latencia y uso sin incluir contenidos de mensajes ni prompts.
                      </span>
                    </div>
                    <Switch
                      checked={settings.security.telemetryEnabled}
                      onCheckedChange={(val) => updateSecurity({ telemetryEnabled: val })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* BACKEND CONNECTION TAB */}
          {activeTab === 'backend' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Server className="h-4 w-4 text-blue-400" />
                  Configuración de Conexión al Backend
                </CardTitle>
                <CardDescription>
                  Endpoints de servicio REST y WebSocket para sincronización en tiempo real
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    API REST Base URL
                  </label>
                  <Input
                    value={settings.backend.apiUrl}
                    onChange={(e) => updateBackend({ apiUrl: e.target.value })}
                    placeholder="https://api.tu-backend.com/v1"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Configurable también vía variable de entorno Vercel: <code>VITE_API_URL</code>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    WebSocket Server URL
                  </label>
                  <Input
                    value={settings.backend.wsUrl}
                    onChange={(e) => updateBackend({ wsUrl: e.target.value })}
                    placeholder="wss://api.tu-backend.com/ws"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Utilizado para eventos <code>agent.started</code>, <code>agent.message</code> y <code>tool.approval_required</code>
                  </p>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/60">
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">
                      Utilizar Adaptador Simulado (Mock API Mode)
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Permite probar todas las funcionalidades y persistencia sin requerir backend local activo.
                    </span>
                  </div>
                  <Switch
                    checked={settings.backend.useMockApi}
                    onCheckedChange={(val) => updateBackend({ useMockApi: val })}
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleTestBackend}
                    isLoading={isTesting}
                    className="text-xs"
                  >
                    <Zap className="mr-1.5 h-3.5 w-3.5 text-amber-400" />
                    Probar Conexión al Backend
                  </Button>

                  {testResult && (
                    <span className="text-xs font-mono font-medium text-emerald-400">
                      {testResult}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* LOCAL AGENT & SANDBOX TAB */}
          {activeTab === 'localAgent' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-violet-400" />
                  Configuración del Local Agent & Bridge MCP
                </CardTitle>
                <CardDescription>
                  Parámetros del puente local para ejecución de procesos STDIO de forma aislada
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3.5 rounded-lg border border-amber-900/60 bg-amber-950/25 text-xs text-amber-200 flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    El Local Agent corre como un proceso de fondo desacoplado en el host del desarrollador. El frontend web solo envía especificaciones de tareas y nunca ejecuta scripts directos de shell.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Puerto del Puente Local (HTTP Bridge)
                    </label>
                    <Input
                      type="number"
                      value={settings.localAgent.bridgePort}
                      onChange={(e) =>
                        updateLocalAgent({ bridgePort: parseInt(e.target.value) || 8765 })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/60">
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block">
                        Habilitar Local Bridge
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Permitir comunicación con servidores MCP STDIO locales.
                      </span>
                    </div>
                    <Switch
                      checked={settings.localAgent.enabled}
                      onCheckedChange={(val) => updateLocalAgent({ enabled: val })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                    <FolderLock className="h-3.5 w-3.5 text-emerald-400" />
                    Directorios Autorizados en Sandbox (uno por línea)
                  </label>
                  <Textarea
                    rows={3}
                    value={settings.localAgent.authorizedDirectories.join('\n')}
                    onChange={(e) =>
                      updateLocalAgent({
                        authorizedDirectories: e.target.value.split('\n').filter(Boolean),
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-violet-400" />
                  Perfil de Usuario
                </CardTitle>
                <CardDescription>Información del operador de la plataforma</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Nombre</label>
                    <Input
                      value={settings.profile.name}
                      onChange={(e) => updateProfile({ name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Correo Electrónico</label>
                    <Input
                      value={settings.profile.email}
                      onChange={(e) => updateProfile({ email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Organización</label>
                    <Input
                      value={settings.profile.company}
                      onChange={(e) => updateProfile({ company: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Rol en el Equipo</label>
                    <Input
                      value={settings.profile.role}
                      onChange={(e) => updateProfile({ role: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* APPEARANCE TAB */}
          {activeTab === 'appearance' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Palette className="h-4 w-4 text-violet-400" />
                  Apariencia e Identidad Visual
                </CardTitle>
                <CardDescription>
                  Tema tecnológico oscuro profesional con acentos violetas y azules
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/60">
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">Tema Visual</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Tema oscuro de alta fidelidad predeterminado para AgentHub SaaS.
                    </span>
                  </div>
                  <Badge variant="default">Oscuro (Fondo #090d16)</Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/60">
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">
                      Reducción de Animaciones
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Priorizar rendimiento deshabilitando pulsos y efectos dinámicos.
                    </span>
                  </div>
                  <Switch
                    checked={settings.appearance.reducedMotion}
                    onCheckedChange={(val) => updateAppearance({ reducedMotion: val })}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* PREFERENCES TAB */}
          {activeTab === 'preferences' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-violet-400" />
                  Preferencias del Sistema
                </CardTitle>
                <CardDescription>Comportamiento general de workflows y respuestas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/60">
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">
                      Auto-guardado de Workflows
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Guardar automáticamente modificaciones en el lienzo de React Flow.
                    </span>
                  </div>
                  <Switch
                    checked={settings.preferences.autoSaveWorkflows}
                    onCheckedChange={(val) => updatePreferences({ autoSaveWorkflows: val })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/60">
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">
                      Streaming de Respuestas en Chat
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Mostrar generación de tokens progresiva en salas multiagente.
                    </span>
                  </div>
                  <Switch
                    checked={settings.preferences.streamResponses}
                    onCheckedChange={(val) => updatePreferences({ streamResponses: val })}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-4 w-4 text-violet-400" />
                  Canales de Notificación
                </CardTitle>
                <CardDescription>Alertas en tiempo real y eventos críticos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/60">
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">
                      Aprobación Humana Requerida
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Notificar inmediatamente cuando un agente requiera confirmación de escritura.
                    </span>
                  </div>
                  <Switch
                    checked={settings.notifications.approvalRequired}
                    onCheckedChange={(val) =>
                      updateNotifications({ approvalRequired: val })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/60">
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">
                      Ejecución de Workflow Completada
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Avisar al finalizar exitosamente un pipeline de larga duración.
                    </span>
                  </div>
                  <Switch
                    checked={settings.notifications.executionCompleted}
                    onCheckedChange={(val) =>
                      updateNotifications({ executionCompleted: val })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/60">
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">
                      Fallo o Excepción en Pipeline
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Alerta visual en caso de rechazo de seguridad o timeout de agente.
                    </span>
                  </div>
                  <Switch
                    checked={settings.notifications.executionFailed}
                    onCheckedChange={(val) =>
                      updateNotifications({ executionFailed: val })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

