import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import { createSchema } from '../bootstrap';
import * as schema from '../schema';
import type { AppDatabase } from '../client';

/** Fresh in-memory DB per test — same schema bootstrap as the device DB. */
export function createTestDb(): AppDatabase {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');
  const db = drizzle(sqlite, { schema });
  createSchema(db);
  return db;
}
