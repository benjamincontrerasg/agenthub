import { db, sqlite } from '../db/connection.js';
import * as schema from '../db/schema.js';
import { eq } from 'drizzle-orm';

async function sync() {
  console.log('[Sync] Detecting local Ollama models...');
  try {
    const res = await fetch('http://127.0.0.1:11434/api/tags');
    if (!res.ok) throw new Error('Ollama offline');
    const data: any = await res.json();
    const installed = data.models || [];

    // Set Ollama provider as connected
    db.update(schema.providers)
      .set({
        status: 'connected',
        latencyMs: 14,
        lastTested: new Date().toISOString(),
        defaultModelId: installed[0]?.name || 'llama3.1:latest',
      })
      .where(eq(schema.providers.id, 'ollama'))
      .run();

    for (const m of installed) {
      sqlite.prepare(`
        INSERT OR REPLACE INTO models (
          id, provider_id, name, context_window, max_output_tokens,
          input_price_per_million, output_price_per_million,
          supports_streaming, supports_tool_calling, is_default
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        m.name,
        'ollama',
        `${m.name} (Local en tu PC)`,
        131072,
        8192,
        0.0,
        0.0,
        1,
        1,
        m.name.includes('llama3.1') ? 1 : 0
      );
    }

    console.log(`[Sync] ${installed.length} modelos de Ollama sincronizados en SQLite.`);
  } catch (err: any) {
    console.error('[Sync Error]', err.message);
  }
}

sync().then(() => process.exit(0));
