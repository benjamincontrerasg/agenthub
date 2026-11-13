import { db } from '../db/connection.js';
import * as schema from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { AppSettings } from '../types.js';

export const settingsService = {
  async getSettings(): Promise<AppSettings> {
    const row = db.select().from(schema.settings).where(eq(schema.settings.id, 'default')).get();
    if (!row) {
      throw new Error('Configuración no inicializada');
    }

    return JSON.parse(row.data);
  },

  async updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.getSettings();
    const merged: AppSettings = {
      profile: { ...current.profile, ...(updates.profile || {}) },
      appearance: { ...current.appearance, ...(updates.appearance || {}) },
      preferences: { ...current.preferences, ...(updates.preferences || {}) },
      security: { ...current.security, ...(updates.security || {}) },
      backend: { ...current.backend, ...(updates.backend || {}) },
      localAgent: { ...current.localAgent, ...(updates.localAgent || {}) },
      notifications: { ...current.notifications, ...(updates.notifications || {}) },
    };

    db.update(schema.settings)
      .set({
        data: JSON.stringify(merged),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.settings.id, 'default'))
      .run();

    return merged;
  },
};
