import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database, { type Database as DatabaseType } from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import { config } from '../config.js';
import * as schema from './schema.js';

// Ensure the data directory exists
mkdirSync(dirname(config.databaseUrl), { recursive: true });

export const sqlite: DatabaseType = new Database(config.databaseUrl);

// Enable WAL mode for better concurrent read performance
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });
