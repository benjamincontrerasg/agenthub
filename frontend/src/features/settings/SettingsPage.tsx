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
  Plus,
  Trash2,
  Send,
  Globe,
  CreditCard,
  Users,
  Mail,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { CustomSelect } from '@/components/ui/custom-select';
import { useSettingsStore } from '@/stores/settings.store';
import { notificationsService, NotificationChannel } from '@/services/notifications.service';
import { apiClient } from '@/services/api';
import { toast } from '@/stores/toast.store';
import { ApiKeysVault } from './ApiKeysVault';
import { BillingSettingsTab } from './BillingSettingsTab';
import { TeamSettingsTab } from './TeamSettingsTab';
import { SecretsVaultTab } from './SecretsVaultTab';

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

  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as any) || 'apiKeys';

  const [activeTab, setActiveTab] = useState<
    'apiKeys' | 'secrets' | 'billing' | 'team' | 'profile' | 'appearance' | 'preferences' | 'security' | 'backend' | 'localAgent' | 'notifications'
  >(initialTab);

  const [testResult, setTestResult] = useState<string | null>(null);
  const [bridgeTestResult, setBridgeTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isTestingBridge, setIsTestingBridge] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // External Notification Webhooks state
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState<'slack' | 'discord' | 'webhook'>('slack');
  const [newChannelUrl, setNewChannelUrl] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState('admin@nexora.dev');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleSendTestEmail = async () => {
    setIsSendingEmail(true);
    try {
      const res = await apiClient<{ success: boolean; message: string }>('/notifications/test-email', {
        method: 'POST',
        body: JSON.stringify({ to: testEmailRecipient }),
      });
      toast.success('Email Despachado', res.message || `Alerta Zero-Trust enviada a ${testEmailRecipient}`);
    } catch (err: any) {
      toast.error('Fallo de Envío', err.message || 'No se pudo enviar el correo.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  React.useEffect(() => {
    notificationsService.getChannels().then(setChannels).catch(console.error);
  }, []);

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim() || !newChannelUrl.trim()) return;
    try {
      const added = await notificationsService.addChannel({
        name: newChannelName.trim(),
        type: newChannelType,
        url: newChannelUrl.trim(),
      });
      setChannels((prev) => [...prev, added]);
      setNewChannelName('');
      setNewChannelUrl('');
      toast.success('Canal Registrado', `Se agregó el canal "${added.name}".`);
    } catch {
      toast.error('Error', 'No se pudo agregar el canal.');
    }
  };

  const handleToggleChannel = async (id: string, enabled: boolean) => {
    try {
      const updated = await notificationsService.toggleChannel(id, enabled);
      setChannels((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch {
      toast.error('Error', 'No se pudo actualizar el estado del canal.');
    }
  };

  const handleDeleteChannel = async (id: string) => {
    try {
      await notificationsService.deleteChannel(id);
      setChannels((prev) => prev.filter((c) => c.id !== id));
      toast.success('Canal Eliminado', 'Canal de notificación removido.');
    } catch {
      toast.error('Error', 'No se pudo eliminar el canal.');
    }
  };

  const handleSendTestNotification = async () => {
    setIsSendingTest(true);
    try {
      const res = await notificationsService.sendTest();
      toast.success('Prueba Enviada', `Notificación enviada a ${res.sent} canal(es). Fallidos: ${res.failed}.`);
    } catch {
      toast.error('Error', 'Error al enviar notificación de prueba.');
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleTestBridge = async () => {
    setIsTestingBridge(true);
    setBridgeTestResult(null);
    try {
      const port = settings.localAgent.bridgePort || 8765;
      const res = await fetch(`http://127.0.0.1:${port}/status`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setBridgeTestResult(`✓ Local Bridge conectado en puerto ${port} (${data.platform}) - Procesos activos: ${data.activeProcessesCount}`);
    } catch (e: any) {
      setBridgeTestResult(`✗ Local Bridge no detectado en puerto ${settings.localAgent.bridgePort || 8765}. Inicia 'npm run dev:bridge' en tu terminal.`);
    } finally {
      setIsTestingBridge(false);
    }
  };

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
    { id: 'apiKeys', label: 'Claves de API (LLMs)', icon: KeyRound },
    { id: 'secrets', label: 'Bóveda de Secretos (Env)', icon: Lock },
    { id: 'billing', label: 'Planes & Facturación', icon: CreditCard },
    { id: 'team', label: 'Equipo & Miembros', icon: Users },
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
          <h2 className="text-title sm:text-2xl font-[510] tracking-tight text-fg-primary flex items-center gap-2">
            Ajustes de la Plataforma
            <Badge variant="outline" className="font-mono text-caption">v1.0-preview</Badge>
          </h2>
          <p className="mt-1 text-body text-fg-secondary">
            Administra políticas Zero-Trust, variables de backend, puentes locales MCP y preferencias del sistema.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {saveFeedback && (
            <span className="text-caption font-mono text-fg-success font-[510] animate-in fade-in">
              {saveFeedback}
            </span>
          )}
          <Button variant="default" size="sm" onClick={handleSaveAll} className="h-8 text-caption">
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
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[12px] text-caption font-medium transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-bg-brand/20 text-fg-brand font-[510] border border-border-brand/40 shadow-sm'
                    : 'text-fg-secondary hover:bg-bg-card hover:text-[#d0d6e0] border border-transparent'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-fg-brand' : 'text-fg-muted'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}

          <div className="pt-4 border-t border-border-default/80 mt-4">
            <button
              onClick={() => {
                if (confirm('¿Restablecer todas las configuraciones a valores por defecto?')) {
                  resetToDefaults();
                }
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-[6px] text-caption text-fg-muted hover:text-red-400 hover:bg-red-950/20 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restablecer valores iniciales
            </button>
          </div>
        </div>

        {/* Right Settings Form Area (9 cols) */}
        <div className="md:col-span-9 space-y-6">
          {/* API KEYS VAULT TAB */}
          {activeTab === 'apiKeys' && <ApiKeysVault />}

          {/* ZERO-TRUST SECRETS & ENV VAULT TAB */}
          {activeTab === 'secrets' && <SecretsVaultTab />}

          {/* SAAS BILLING & SUBSCRIPTIONS TAB */}
          {activeTab === 'billing' && <BillingSettingsTab />}

          {/* SAAS MULTI-TENANT TEAM MANAGEMENT TAB */}
          {activeTab === 'team' && <TeamSettingsTab />}

          {/* SECURITY & CREDENTIALS TAB */}
          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-subtitle flex items-center gap-2">
                  <Shield className="h-4 w-4 text-fg-success" />
                  Políticas de Seguridad & Gestión de Credenciales
                </CardTitle>
                <CardDescription>
                  Gobernanza Zero-Trust para la ejecución de herramientas y protección de secretos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Critical Security Rules Box */}
                <div className="p-4 rounded-[12px] border border-border-brand/60 bg-bg-brand-subtle/30 text-caption text-fg-secondary space-y-2">
                  <span className="font-[510] text-fg-brand flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" /> Directiva de Almacenamiento Seguro (Frontend Safe):
                  </span>
                  <p className="text-caption text-fg-secondary leading-relaxed">
                    NEXORA no almacena API Keys ni tokens privados en el <code>localStorage</code> del navegador ni en variables públicas empaquetadas. Toda credencial es transferida directamente al backend mediante canales cifrados TLS.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-[6px] border border-border-default bg-bg-card/60">
                    <div>
                      <span className="text-caption font-[510] text-fg-primary block">
                        Aprobación Humana Obligatoria para Herramientas de Escritura
                      </span>
                      <span className="text-caption text-fg-secondary block mt-0.5">
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

                  <div className="flex items-center justify-between p-3 rounded-[6px] border border-border-default bg-bg-card/60">
                    <div>
                      <span className="text-caption font-[510] text-fg-primary block">
                        Validación Estricta de Servidores MCP
                      </span>
                      <span className="text-caption text-fg-secondary block mt-0.5">
                        Inspeccionar y requerir verificación de handshake antes de habilitar herramientas en agentes autónomos.
                      </span>
                    </div>
                    <Switch
                      checked={settings.security.strictMCPValidation}
                      onCheckedChange={(val) => updateSecurity({ strictMCPValidation: val })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-[6px] border border-border-default bg-bg-card/60">
                    <div>
                      <span className="text-caption font-[510] text-fg-primary block">
                        Telemetría y Diagnóstico Anónimo
                      </span>
                      <span className="text-caption text-fg-secondary block mt-0.5">
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
                <CardTitle className="text-subtitle flex items-center gap-2">
                  <Server className="h-4 w-4 text-fg-brand" />
                  Configuración de Conexión al Backend
                </CardTitle>
                <CardDescription>
                  Endpoints de servicio REST y WebSocket para sincronización en tiempo real
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-caption font-medium text-fg-secondary mb-1">
                    API REST Base URL
                  </label>
                  <Input
                    value={settings.backend.apiUrl}
                    onChange={(e) => updateBackend({ apiUrl: e.target.value })}
                    placeholder="https://api.tu-backend.com/v1"
                  />
                  <p className="mt-1 text-caption text-fg-secondary">
                    Configurable también vía variable de entorno Vercel: <code>VITE_API_URL</code>
                  </p>
                </div>

                <div>
                  <label className="block text-caption font-medium text-fg-secondary mb-1">
                    WebSocket Server URL
                  </label>
                  <Input
                    value={settings.backend.wsUrl}
                    onChange={(e) => updateBackend({ wsUrl: e.target.value })}
                    placeholder="wss://api.tu-backend.com/ws"
                  />
                  <p className="mt-1 text-caption text-fg-secondary">
                    Utilizado para eventos <code>agent.started</code>, <code>agent.message</code> y <code>tool.approval_required</code>
                  </p>
                </div>

                <div className="flex items-center justify-between p-3 rounded-[6px] border border-border-default bg-bg-card/60">
                  <div>
                    <span className="text-caption font-[510] text-fg-primary block">
                      Utilizar Adaptador Simulado (Mock API Mode)
                    </span>
                    <span className="text-caption text-fg-secondary block mt-0.5">
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
                    className="text-caption"
                  >
                    <Zap className="mr-1.5 h-3.5 w-3.5 text-fg-warning" />
                    Probar Conexión al Backend
                  </Button>

                  {testResult && (
                    <span className="text-caption font-mono font-medium text-fg-success">
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
                <CardTitle className="text-subtitle flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-fg-brand" />
                  Configuración del Local Agent & Bridge MCP
                </CardTitle>
                <CardDescription>
                  Parámetros del puente local para ejecución de procesos STDIO de forma aislada
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3.5 rounded-[6px] border border-fg-warning/60 bg-bg-warning/25 text-caption text-fg-warning flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-fg-warning shrink-0 mt-0.5" />
                  <p className="text-caption leading-relaxed">
                    El Local Agent corre como un proceso de fondo desacoplado en el host del desarrollador. El frontend web solo envía especificaciones de tareas y nunca ejecuta scripts directos de shell.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-caption font-medium text-fg-secondary mb-1">
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

                  <div className="flex items-center justify-between p-3 rounded-[6px] border border-border-default bg-bg-card/60">
                    <div>
                      <span className="text-caption font-[510] text-fg-primary block">
                        Habilitar Local Bridge
                      </span>
                      <span className="text-caption text-fg-secondary block mt-0.5">
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
                  <label className="block text-caption font-medium text-fg-secondary mb-1 flex items-center gap-1.5">
                    <FolderLock className="h-3.5 w-3.5 text-fg-success" />
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

                <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-border-default/80">
                  <div className="text-caption">
                    {bridgeTestResult && (
                      <span
                        className={`font-mono text-caption ${
                          bridgeTestResult.startsWith('✓') ? 'text-fg-success' : 'text-fg-error'
                        }`}
                      >
                        {bridgeTestResult}
                      </span>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleTestBridge}
                    disabled={isTestingBridge}
                    className="shrink-0"
                  >
                    {isTestingBridge ? 'Comprobando Bridge...' : 'Probar Conexión con Local Bridge'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-subtitle flex items-center gap-2">
                  <User className="h-4 w-4 text-fg-brand" />
                  Perfil de Usuario
                </CardTitle>
                <CardDescription>Información del operador de la plataforma</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-caption font-medium text-fg-secondary mb-1">Nombre</label>
                    <Input
                      value={settings.profile.name}
                      onChange={(e) => updateProfile({ name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-caption font-medium text-fg-secondary mb-1">Correo Electrónico</label>
                    <Input
                      value={settings.profile.email}
                      onChange={(e) => updateProfile({ email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-caption font-medium text-fg-secondary mb-1">Organización</label>
                    <Input
                      value={settings.profile.company}
                      onChange={(e) => updateProfile({ company: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-caption font-medium text-fg-secondary mb-1">Rol en el Equipo</label>
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
                <CardTitle className="text-subtitle flex items-center gap-2">
                  <Palette className="h-4 w-4 text-fg-brand" />
                  Apariencia e Identidad Visual
                </CardTitle>
                <CardDescription>
                  Personaliza el tema visual, modo claro/oscuro y preferencias de accesibilidad
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-[6px] border border-border-default bg-bg-card/60 gap-3">
                  <div>
                    <span className="text-caption font-[510] text-fg-primary block">Tema Visual</span>
                    <span className="text-caption text-fg-secondary block mt-0.5">
                      Selecciona entre la precisión oscura Midnight o el tema blanco limpio.
                    </span>
                  </div>
                  <div className="w-full sm:w-56">
                    <CustomSelect
                      value={settings.appearance?.theme || 'dark'}
                      onChange={(val) => updateAppearance({ theme: val as 'dark' | 'light' | 'system' })}
                      options={[
                        { value: 'dark', label: 'Oscuro (Midnight)', description: 'Fondo near-black #08090a' },
                        { value: 'light', label: 'Blanco (Claro)', description: 'Lienzo blanco limpio y bordes sutiles' },
                        { value: 'system', label: 'Automático (Sistema)', description: 'Sincronizar con el sistema operativo' },
                      ]}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-[6px] border border-border-default bg-bg-card/60">
                  <div>
                    <span className="text-caption font-[510] text-fg-primary block">
                      Reducción de Animaciones
                    </span>
                    <span className="text-caption text-fg-secondary block mt-0.5">
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
                <CardTitle className="text-subtitle flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-fg-brand" />
                  Preferencias del Sistema
                </CardTitle>
                <CardDescription>Comportamiento general de workflows y respuestas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-[6px] border border-border-default bg-bg-card/60">
                  <div>
                    <span className="text-caption font-[510] text-fg-primary block">
                      Auto-guardado de Workflows
                    </span>
                    <span className="text-caption text-fg-secondary block mt-0.5">
                      Guardar automáticamente modificaciones en el lienzo de React Flow.
                    </span>
                  </div>
                  <Switch
                    checked={settings.preferences.autoSaveWorkflows}
                    onCheckedChange={(val) => updatePreferences({ autoSaveWorkflows: val })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-[6px] border border-border-default bg-bg-card/60">
                  <div>
                    <span className="text-caption font-[510] text-fg-primary block">
                      Streaming de Respuestas en Chat
                    </span>
                    <span className="text-caption text-fg-secondary block mt-0.5">
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
                <CardTitle className="text-subtitle flex items-center gap-2">
                  <Bell className="h-4 w-4 text-fg-brand" />
                  Canales de Notificación
                </CardTitle>
                <CardDescription>Alertas en tiempo real y eventos críticos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-[6px] border border-border-default bg-bg-card/60">
                  <div>
                    <span className="text-caption font-[510] text-fg-primary block">
                      Aprobación Humana Requerida
                    </span>
                    <span className="text-caption text-fg-secondary block mt-0.5">
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

                <div className="flex items-center justify-between p-3 rounded-[6px] border border-border-default bg-bg-card/60">
                  <div>
                    <span className="text-caption font-[510] text-fg-primary block">
                      Ejecución de Workflow Completada
                    </span>
                    <span className="text-caption text-fg-secondary block mt-0.5">
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

                <div className="flex items-center justify-between p-3 rounded-[6px] border border-border-default bg-bg-card/60">
                  <div>
                    <span className="text-caption font-[510] text-fg-primary block">
                      Fallo o Excepción en Pipeline
                    </span>
                    <span className="text-caption text-fg-secondary block mt-0.5">
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

                {/* External Notification Webhooks (Slack/Discord/Custom) */}
                <div className="pt-6 border-t border-border-default space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h4 className="text-body font-[510] text-fg-primary flex items-center gap-2">
                        <Globe className="h-4 w-4 text-fg-brand" />
                        Webhooks Externos (Slack / Discord / Custom)
                      </h4>
                      <p className="text-caption text-fg-secondary">
                        Envía eventos de seguridad, alertas Zero-Trust y requerimientos de aprobación a tus canales de mensajería.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSendTestNotification}
                      disabled={isSendingTest || channels.length === 0}
                      className="text-caption"
                    >
                      <Send className="mr-1.5 h-3.5 w-3.5" />
                      {isSendingTest ? 'Enviando...' : 'Enviar Prueba'}
                    </Button>
                  </div>

                  {/* Add Channel Form */}
                  <form onSubmit={handleAddChannel} className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 rounded-[12px] border border-border-default bg-bg-card/40">
                    <div className="sm:col-span-4">
                      <Input
                        placeholder="Nombre (ej: #ops-alerts)"
                        value={newChannelName}
                        onChange={(e) => setNewChannelName(e.target.value)}
                        className="text-caption h-8"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <Select
                        value={newChannelType}
                        onChange={(e) => setNewChannelType(e.target.value as any)}
                        className="text-caption h-8"
                      >
                        <option value="slack">Slack</option>
                        <option value="discord">Discord</option>
                        <option value="webhook">Webhook Genérico</option>
                      </Select>
                    </div>
                    <div className="sm:col-span-4">
                      <Input
                        placeholder="https://hooks.slack.com/services/..."
                        value={newChannelUrl}
                        onChange={(e) => setNewChannelUrl(e.target.value)}
                        className="text-caption h-8 font-mono text-xs"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <Button type="submit" size="sm" className="w-full text-caption h-8" disabled={!newChannelName.trim() || !newChannelUrl.trim()}>
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </form>

                  {/* Configured Channels List */}
                  <div className="space-y-2">
                    {channels.length === 0 ? (
                      <p className="text-caption text-fg-secondary py-2 text-center">No hay canales externos registrados.</p>
                    ) : (
                      channels.map((ch) => (
                        <div
                          key={ch.id}
                          className="flex items-center justify-between p-3 rounded-[6px] border border-border-default bg-bg-card/60 gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Badge variant={ch.type === 'slack' ? 'default' : ch.type === 'discord' ? 'secondary' : 'outline'} className="capitalize font-mono text-[10px]">
                              {ch.type}
                            </Badge>
                            <div className="min-w-0">
                              <span className="text-caption font-[510] text-fg-primary block truncate">
                                {ch.name}
                              </span>
                              <span className="text-[11px] text-fg-secondary font-mono truncate block max-w-xs sm:max-w-md">
                                {ch.url}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Switch
                              checked={ch.enabled}
                              onCheckedChange={(val) => handleToggleChannel(ch.id, val)}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-fg-secondary hover:text-fg-error"
                              onClick={() => handleDeleteChannel(ch.id)}
                              title="Eliminar Canal"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Transactional Email Service (Resend / SMTP) */}
                <div className="pt-6 border-t border-border-default space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h4 className="text-body font-[510] text-fg-primary flex items-center gap-2">
                        <Mail className="h-4 w-4 text-emerald-400" />
                        Servicio de Correo Transaccional (Resend / SMTP)
                        <Badge variant="outline" className="text-[10px] font-mono text-emerald-400 border-emerald-500/30">
                          Zero-Trust Alerting
                        </Badge>
                      </h4>
                      <p className="text-caption text-fg-secondary">
                        Despacha emails de bienvenida, invitaciones de equipo y alertas críticas cuando un pipeline se detiene en una puerta de Aprobación Humana.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-[12px] border border-border-default bg-bg-card/40 flex flex-col sm:flex-row items-center gap-3">
                    <div className="flex-1 w-full">
                      <label className="block text-[11px] font-mono text-fg-secondary mb-1">
                        Destinatario de Prueba (Admin)
                      </label>
                      <Input
                        type="email"
                        value={testEmailRecipient}
                        onChange={(e) => setTestEmailRecipient(e.target.value)}
                        placeholder="admin@nexora.dev"
                        className="text-caption h-8 font-mono"
                      />
                    </div>
                    <div className="w-full sm:w-auto pt-3 sm:pt-4">
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        isLoading={isSendingEmail}
                        onClick={handleSendTestEmail}
                        className="w-full sm:w-auto text-caption bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                      >
                        <Send className="mr-1.5 h-3.5 w-3.5" />
                        Probar Alerta Zero-Trust
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

