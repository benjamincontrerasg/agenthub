import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '127.0.0.1',
  databaseUrl: process.env.DATABASE_URL || './data/nexora.db',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  encryptionKey: process.env.ENCRYPTION_KEY || 'dev-encryption-key-change-in-production-32chars!!',
  previousEncryptionKey: process.env.PREVIOUS_ENCRYPTION_KEY || undefined,
  bridgeToken: process.env.BRIDGE_TOKEN || undefined,
  allowedPrivateHosts: process.env.ALLOWED_PRIVATE_HOSTS || '',
} as const;
