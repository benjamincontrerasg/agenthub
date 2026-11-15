import dotenv from 'dotenv';

dotenv.config();

const encryptionKey = process.env.ENCRYPTION_KEY?.trim();
if (!encryptionKey || encryptionKey.length < 32) {
  throw new Error(
    'Config Error: La variable de entorno ENCRYPTION_KEY es obligatoria y debe tener al menos 32 caracteres.\n' +
    'Genera una clave criptográficamente segura con:\n' +
    '  node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
  );
}

const jwtSecret = process.env.JWT_SECRET?.trim();
if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error(
    'Config Error: La variable de entorno JWT_SECRET es obligatoria y debe tener al menos 32 caracteres (distinta de ENCRYPTION_KEY).\n' +
    'Genera una clave criptográficamente segura con:\n' +
    '  node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
  );
}

if (jwtSecret === encryptionKey) {
  throw new Error(
    'Config Error: JWT_SECRET y ENCRYPTION_KEY deben ser claves distintas para garantizar la separación de dominios criptográficos.'
  );
}

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',
  databaseUrl: process.env.DATABASE_URL || './data/nexora.db',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  encryptionKey,
  jwtSecret,
} as const;
