import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',
  databaseUrl: process.env.DATABASE_URL || './data/agenthub.db',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  encryptionKey: process.env.ENCRYPTION_KEY || 'dev-encryption-key-change-in-production-32chars!!',
} as const;
