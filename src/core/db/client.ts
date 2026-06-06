import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import { createSchema } from './bootstrap';
import * as schema from './schema';

/**
 * Synchronous SQLite, typed against our schema — same shape whether the
 * underlying driver is `expo-sqlite` (device) or `better-sqlite3` (tests),
 * which is what lets DAOs be written once against `AppDatabase`.
 */
export type AppDatabase = BaseSQLiteDatabase<'sync', unknown, typeof schema>;

const DATABASE_NAME = 'accounting_app.db';

export function openAppDatabase(): AppDatabase {
  const expoDb = openDatabaseSync(DATABASE_NAME);
  const db = drizzle(expoDb, { schema });
  createSchema(db);
  return db;
}

export { schema };
