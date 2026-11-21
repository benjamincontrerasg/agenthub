import { describe, it, expect } from 'vitest';
import { emailService } from '../email.service';

describe('SaaS Transactional Email Service (Resend / SMTP / Zero-Trust Alerts)', () => {
  it('envía o simula el despacho de un email transaccional devolviendo un messageId', async () => {
    const result = await emailService.sendEmail({
      to: 'dev@nexora.dev',
      subject: 'Prueba de Sistema NEXORA',
      html: '<p>Hola desde NEXORA</p>',
      category: 'welcome',
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
    expect(typeof result.simulated).toBe('boolean');
    expect(result.timestamp).toBeDefined();
  });

  it('sendZeroTrustAlert genera y despacha alerta de aprobación humana', async () => {
    const result = await emailService.sendZeroTrustAlert(
      'admin@nexora.dev',
      'Despliegue a Producción',
      'tool-k8s-deploy',
      'http://localhost:5173/chat'
    );

    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });

  it('sendTeamInvite genera y despacha invitación para colaborar en equipo', async () => {
    const result = await emailService.sendTeamInvite(
      'invited@nexora.dev',
      'NEXORA Enterprise Core Team',
      'developer',
      'http://localhost:5173/login?invite=inv_test_123'
    );

    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });
});
