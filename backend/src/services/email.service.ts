import { auditService } from './audit.service.js';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  category?: 'welcome' | 'team_invite' | 'security_alert' | 'zero_trust_approval';
}

export interface EmailResult {
  success: boolean;
  messageId: string;
  simulated: boolean;
  timestamp: string;
}

export class EmailService {
  private resendApiKey = process.env.RESEND_API_KEY;
  private fromAddress = process.env.EMAIL_FROM || 'NEXORA Platform <notificaciones@nexora.dev>';

  /**
   * Envía un email transaccional usando Resend si está configurado,
   * o simula el despacho de forma idempotente en desarrollo.
   */
  async sendEmail(payload: EmailPayload): Promise<EmailResult> {
    const timestamp = new Date().toISOString();

    if (this.resendApiKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: this.fromAddress,
            to: payload.to,
            subject: payload.subject,
            html: payload.html,
            text: payload.text,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Error al enviar email via Resend');
        }

        await auditService.log({
          action: 'email.sent',
          resource: `email:${payload.to}`,
          status: 'success',
          details: { category: payload.category, messageId: data.id, live: true },
        });

        return {
          success: true,
          messageId: data.id,
          simulated: false,
          timestamp,
        };
      } catch (err: any) {
        console.error('[EmailService] Fallo al enviar email real:', err.message);
      }
    }

    // Modo Simulación en Desarrollo (Cero dependencias externas requeridas)
    const simulatedId = `msg_sim_${Math.random().toString(36).substring(2, 10)}`;
    console.log(`[EmailService] 📧 Email simulado a "${payload.to}": [${payload.subject}]`);

    await auditService.log({
      action: 'email.simulated',
      resource: `email:${payload.to}`,
      status: 'success',
      details: { category: payload.category, messageId: simulatedId, live: false },
    });

    return {
      success: true,
      messageId: simulatedId,
      simulated: true,
      timestamp,
    };
  }

  /**
   * Alerta Zero-Trust: Notifica al administrador que un agente solicita aprobación humana
   */
  async sendZeroTrustAlert(adminEmail: string, workflowName: string, toolName: string, approveUrl: string): Promise<EmailResult> {
    return this.sendEmail({
      to: adminEmail,
      subject: `🚨 [Zero-Trust Gate] Aprobación requerida en "${workflowName}"`,
      category: 'zero_trust_approval',
      html: `
        <div style="font-family: -apple-system, sans-serif; background: #08090a; color: #f7f8f8; padding: 24px; border-radius: 8px;">
          <h2 style="color: #e4f222; margin-top: 0;">Punto de Control Zero-Trust Requerido</h2>
          <p>Un agente en el workflow <strong>${workflowName}</strong> ha solicitado ejecutar una operación sensible con la herramienta <strong>${toolName}</strong>.</p>
          <div style="margin: 20px 0;">
            <a href="${approveUrl}" style="background: #e4f222; color: #08090a; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Revisar y Autorizar Operación &rarr;
            </a>
          </div>
          <p style="color: #8a8f98; font-size: 12px;">NEXORA Security Guard · Operación bloqueada preventivamente hasta autorización explícita.</p>
        </div>
      `,
    });
  }

  /**
   * Invitación de equipo
   */
  async sendTeamInvite(email: string, orgName: string, role: string, inviteUrl: string): Promise<EmailResult> {
    return this.sendEmail({
      to: email,
      subject: `Has sido invitado a unirte a "${orgName}" en NEXORA`,
      category: 'team_invite',
      html: `
        <div style="font-family: -apple-system, sans-serif; background: #08090a; color: #f7f8f8; padding: 24px; border-radius: 8px;">
          <h2 style="color: #f7f8f8; margin-top: 0;">Te han invitado al equipo</h2>
          <p>Has recibido una invitación para colaborar en <strong>${orgName}</strong> con el rol de <strong>${role.toUpperCase()}</strong>.</p>
          <div style="margin: 20px 0;">
            <a href="${inviteUrl}" style="background: #e4f222; color: #08090a; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Aceptar Invitación &rarr;
            </a>
          </div>
          <p style="color: #8a8f98; font-size: 12px;">Si no esperabas este correo, puedes ignorarlo de forma segura.</p>
        </div>
      `,
    });
  }
}

export const emailService = new EmailService();
