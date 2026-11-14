import { db } from '../db/connection.js';
import * as schema from '../db/schema.js';
import { eq, isNotNull } from 'drizzle-orm';
import { decryptWithKey, encryptWithKey } from '../lib/crypto.js';

/**
 * Script de rotación de clave de cifrado (Zero-Downtime Key Rotation)
 * Uso:
 *   npx tsx src/scripts/rotate-key.ts <OLD_KEY> <NEW_KEY>
 * o mediante variables de entorno:
 *   OLD_ENCRYPTION_KEY=... NEW_ENCRYPTION_KEY=... npx tsx src/scripts/rotate-key.ts
 */
async function rotateKeys() {
  const oldKey = process.argv[2] || process.env.OLD_ENCRYPTION_KEY;
  const newKey = process.argv[3] || process.env.NEW_ENCRYPTION_KEY;

  if (!oldKey || !newKey) {
    console.error('❌ Error: Se requieren la clave antigua y la clave nueva.');
    console.error('Uso: npx tsx src/scripts/rotate-key.ts <OLD_KEY> <NEW_KEY>');
    console.error('  o: OLD_ENCRYPTION_KEY=... NEW_ENCRYPTION_KEY=... npx tsx src/scripts/rotate-key.ts');
    process.exit(1);
  }

  if (oldKey === newKey) {
    console.error('❌ Error: La clave nueva debe ser diferente de la clave antigua.');
    process.exit(1);
  }

  console.log('🔄 Iniciando rotación de credenciales cifradas con AES-256-GCM...');

  const records = db
    .select()
    .from(schema.providers)
    .where(isNotNull(schema.providers.encryptedApiKey))
    .all();

  console.log(`📋 Encontrados ${records.length} proveedores con credenciales cifradas.`);

  let reEncryptedCount = 0;

  for (const record of records) {
    if (!record.encryptedApiKey) continue;

    try {
      // 1. Desencriptar con la clave antigua
      const plainKey = decryptWithKey(record.encryptedApiKey, oldKey);

      // 2. Re-encriptar con la clave nueva
      const reEncryptedKey = encryptWithKey(plainKey, newKey);

      // 3. Actualizar registro en base de datos
      db.update(schema.providers)
        .set({
          encryptedApiKey: reEncryptedKey,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.providers.id, record.id))
        .run();

      reEncryptedCount++;
      console.log(`  ✓ Proveedor '${record.name}' (${record.id}) re-cifrado con éxito.`);
    } catch (err: any) {
      console.error(`  ✗ Error al rotar credenciales de '${record.id}':`, err.message);
      console.error('  ⚠️ Asegúrate de que la OLD_KEY proporcionada sea correcta.');
      process.exit(1);
    }
  }

  console.log(`\n🎉 Rotación completada con éxito: ${reEncryptedCount} credenciales migradas a la nueva clave.`);
  console.log('💡 Recuerda actualizar ENCRYPTION_KEY en tu archivo .env o gestor de secretos.');
}

rotateKeys().catch((err) => {
  console.error('Error fatal durante la rotación:', err);
  process.exit(1);
});
