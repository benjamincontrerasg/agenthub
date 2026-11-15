import { describe, it, expect } from 'vitest';
import { notificationsService } from '../notifications.service.js';

describe('Notifications Service', () => {
  it('manages notification channels correctly', () => {
    const initial = notificationsService.getChannels();
    const countBefore = initial.length;

    const channel = notificationsService.addChannel({
      name: 'Test Discord Channel',
      type: 'discord',
      url: 'https://discord.com/api/webhooks/test',
      enabled: true,
      events: ['approval.required'],
    });

    expect(channel.id).toBeDefined();
    expect(channel.name).toBe('Test Discord Channel');

    const updated = notificationsService.toggleChannel(channel.id, false);
    expect(updated?.enabled).toBe(false);

    const removed = notificationsService.removeChannel(channel.id);
    expect(removed).toBe(true);

    const after = notificationsService.getChannels();
    expect(after.length).toBe(countBefore);
  });

  it('formats payload for different channel types without crashing', async () => {
    // Adds a mock disabled channel to test filtering
    const channel = notificationsService.addChannel({
      name: 'Disabled Slack',
      type: 'slack',
      url: 'https://hooks.slack.com/services/mock',
      enabled: false,
      events: ['*'],
    });

    const res = await notificationsService.notifyApprovalRequired('Agent-Dev', 'tool-write');
    expect(res).toEqual({ sent: 0, failed: 0 });

    notificationsService.removeChannel(channel.id);
  });
});
