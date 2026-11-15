/**
 * Servicio de notificaciones externas
 * Envía alertas a webhooks configurados (Slack, Discord, custom)
 */

interface NotificationPayload {
  event: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
  metadata?: Record<string, any>;
}

interface NotificationChannel {
  id: string;
  name: string;
  type: 'slack' | 'discord' | 'webhook';
  url: string;
  enabled: boolean;
  events: string[];
  createdAt: string;
}

// In-memory store for notification channels
const channels: NotificationChannel[] = [];

export const notificationsService = {
  getChannels(): NotificationChannel[] {
    return [...channels];
  },

  addChannel(channel: Omit<NotificationChannel, 'id' | 'createdAt'>): NotificationChannel {
    const created: NotificationChannel = {
      ...channel,
      id: `notif-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    channels.push(created);
    return created;
  },

  removeChannel(id: string): boolean {
    const idx = channels.findIndex((c) => c.id === id);
    if (idx !== -1) {
      channels.splice(idx, 1);
      return true;
    }
    return false;
  },

  toggleChannel(id: string, enabled: boolean): NotificationChannel | null {
    const ch = channels.find((c) => c.id === id);
    if (ch) {
      ch.enabled = enabled;
      return { ...ch };
    }
    return null;
  },

  async sendNotification(payload: NotificationPayload): Promise<{ sent: number; failed: number }> {
    const enabledChannels = channels.filter(
      (ch) => ch.enabled && (ch.events.includes('*') || ch.events.includes(payload.event))
    );

    let sent = 0;
    let failed = 0;

    for (const channel of enabledChannels) {
      try {
        let body: string;

        if (channel.type === 'slack') {
          // Slack-compatible webhook format
          body = JSON.stringify({
            text: `*[${payload.severity.toUpperCase()}]* ${payload.title}`,
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*${payload.title}*\n${payload.message}`,
                },
              },
              {
                type: 'context',
                elements: [
                  {
                    type: 'mrkdwn',
                    text: `📌 Evento: \`${payload.event}\` | ⏰ ${payload.timestamp}`,
                  },
                ],
              },
            ],
          });
        } else if (channel.type === 'discord') {
          // Discord webhook format
          const colorMap = { info: 0x3498db, warning: 0xf39c12, critical: 0xe74c3c };
          body = JSON.stringify({
            embeds: [
              {
                title: payload.title,
                description: payload.message,
                color: colorMap[payload.severity],
                timestamp: payload.timestamp,
                footer: { text: `NEXORA | ${payload.event}` },
                fields: payload.metadata
                  ? Object.entries(payload.metadata).map(([k, v]) => ({
                      name: k,
                      value: String(v),
                      inline: true,
                    }))
                  : [],
              },
            ],
          });
        } else {
          // Generic webhook
          body = JSON.stringify(payload);
        }

        const response = await fetch(channel.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          sent++;
        } else {
          failed++;
          console.error(
            `[notifications] Canal ${channel.name} respondió ${response.status}: ${response.statusText}`
          );
        }
      } catch (error) {
        failed++;
        console.error(`[notifications] Error enviando a ${channel.name}:`, error);
      }
    }

    return { sent, failed };
  },

  async notifyApprovalRequired(agentName: string, toolName: string, workflowName?: string) {
    return this.sendNotification({
      event: 'approval.required',
      title: '🔐 Aprobación Humana Requerida',
      message: `El agente **${agentName}** solicita aprobación para ejecutar la herramienta **${toolName}**${workflowName ? ` en el workflow "${workflowName}"` : ''}.`,
      severity: 'warning',
      timestamp: new Date().toISOString(),
      metadata: { agentName, toolName, workflowName },
    });
  },

  async notifyExecutionCompleted(workflowName: string, status: string, durationMs?: number) {
    return this.sendNotification({
      event: 'execution.completed',
      title: status === 'completed' ? '✅ Ejecución Completada' : '❌ Ejecución Fallida',
      message: `El workflow **${workflowName}** finalizó con estado **${status}**${durationMs ? ` en ${durationMs}ms` : ''}.`,
      severity: status === 'completed' ? 'info' : 'critical',
      timestamp: new Date().toISOString(),
      metadata: { workflowName, status, durationMs },
    });
  },

  async notifySecurityAlert(message: string, source: string) {
    return this.sendNotification({
      event: 'security.alert',
      title: '🛡️ Alerta de Seguridad Zero-Trust',
      message,
      severity: 'critical',
      timestamp: new Date().toISOString(),
      metadata: { source },
    });
  },
};
