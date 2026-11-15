import { db, sqlite } from '../db/connection.js';
import * as schema from '../db/schema.js';
import { eq, isNotNull } from 'drizzle-orm';
import { decryptWithKey, encryptWithKey } from '../lib/crypto.js';
import readline from 'readline';

async function readFromStdin(prompt: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Script de rotación de clave de cifrado (Zero-Downtime Key Rotation).
 * Por seguridad Zero-Trust, se leen exclusivamente desde variables de entorno o stdin
 * para evitar exponer secretos en el historial de comandos o lista de procesos de la terminal (ps/proc).
 *
 * Se ejecuta dentro de una transacción SQLite para garantizar atomicidad e idempotencia.
 */
async function rotateKeys() {
  let oldKey = process.env.OLD_ENCRYPTION_KEY;
  let newKey = process.env.NEW_ENCRYPTION_KEY;

  if (!oldKey && process.stdin.isTTY) {
    oldKey = await readFromStdin('Introduce la clave de cifrado antigua (OLD_ENCRYPTION_KEY): ');
  }
  if (!newKey && process.stdin.isTTY) {
    newKey = await readFromStdin('Introduce la clave de cifrado nueva (NEW_ENCRYPTION_KEY): ');
  }

  if (!oldKey || !newKey) {
    console.error('❌ Error de Seguridad: Las claves deben definirse en variables de entorno o por stdin.');
    console.error('Uso seguro:');
    console.error('  OLD_ENCRYPTION_KEY=... NEW_ENCRYPTION_KEY=... npm run rotate-key');
    process.exit(1);
  }

  if (oldKey === newKey) {
    console.error('❌ Error: La clave nueva debe ser diferente de la clave antigua.');
    process.exit(1);
  }

  if (oldKey.length < 32 || newKey.length < 32) {
    console.error('❌ Error: Las claves deben contener al menos 32 caracteres para AES-256.');
    process.exit(1);
  }

  console.log('🔄 Iniciando rotación atómica de credenciales a formato v2 (AES-256-GCM)...');

  const records = db
    .select()
    .from(schema.providers)
    .where(isNotNull(schema.providers.encryptedApiKey))
    .all();

  console.log(`📋 Encontrados ${records.length} proveedores con credenciales cifradas.`);

  let reEncryptedCount = 0;
  let alreadyRotatedCount = 0;

  // Ejecución transaccional e idempotente
  const transaction = sqlite.transaction(() => {
    for (const record of records) {
      if (!record.encryptedApiKey) continue;

      // Idempotencia: Verificar si ya está cifrado con la nueva clave
      try {
        decryptWithKey(record.encryptedApiKey, newKey);
        alreadyRotatedCount++;
        continue;
      } catch {
        // No está cifrado con newKey, proceder a rotar
      }

      // 1. Desencriptar con la clave antigua
      let plainKey: string;
      try {
        plainKey = decryptWithKey(record.encryptedApiKey, oldKey);
      } catch (err: any) {
        throw new Error(
          `No se pudo descifrar la credencial del proveedor '${record.id}'. Verifica que OLD_ENCRYPTION_KEY sea correcta.`
        );
      }

      // 2. Re-encriptar con la clave nueva (formato moderno v2:)
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
      console.log(`  ✓ Proveedor '${record.name}' (${record.id}) migrado a formato v2.`);
    }
  });

  try {
    transaction();
    console.log(
      `\n🎉 Rotación completada con éxito: ${reEncryptedCount} credenciales re-cifradas (${alreadyRotatedCount} ya estaban actualizadas).`
    );
    console.log('💡 Establece PREVIOUS_ENCRYPTION_KEY si requieres ventana de transición sin downtime.');
  } catch (err: any) {
    console.error('\n❌ Transacción revertida (Rollback). Error durante la rotación:', err.message);
    process.exit(1);
  }
}

rotateKeys().catch((err) => {
  console.error('Error fatal durante la rotación:', err);
  process.exit(1);
});
