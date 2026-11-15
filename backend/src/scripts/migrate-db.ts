import { config } from '../config.js';

/**
 * Script utilitario de migración y verificación de base de datos.
 * Detecta automáticamente si la configuración objetivo es SQLite o PostgreSQL + pgvector
 * e imprime las instrucciones o ejecuta las sentencias de inicialización.
 */
export async function runMigrationCheck() {
  const isPostgres = config.databaseUrl.startsWith('postgres://') || config.databaseUrl.startsWith('postgresql://');

  console.log('--- NEXORA Database Migration Utility ---');
  console.log(`Modo detectado: ${isPostgres ? 'PostgreSQL (SaaS Production + pgvector)' : 'SQLite (Local Embedded / Development)'}`);
  console.log(`Cadena de conexión: ${config.databaseUrl}`);

  if (isPostgres) {
    console.log('\n[Postgres Migration Blueprint]');
    console.log('1. Asegúrate de tener instalada la extensión pgvector: CREATE EXTENSION IF NOT EXISTS vector;');
    console.log('2. Drizzle schema centralizado y único en: backend/src/db/schema.ts');
    console.log('3. Ejecuta "npm run db:push" configurando drizzle.config.ts para dialect: "postgresql".');
  } else {
    console.log('\n[SQLite Local Check]');
    console.log('Base de datos SQLite activa con soporte de embeddings JSON y búsqueda vectorial RAG local.');
  }

  return { isPostgres, target: config.databaseUrl };
}

if (process.argv[1]?.includes('migrate-db')) {
  runMigrationCheck();
}
