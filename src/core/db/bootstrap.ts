import { sql } from 'drizzle-orm';

import type { AppDatabase } from './client';

/**
 * Creates the schema for a fresh install. Mirrors the Flutter app's drift
 * `onCreate` (consolidated v10 shape) — there is no migration chain to
 * replay since this is a brand-new RN install (`docs/rn_port/PLAN.md` → 1.1).
 * Statement order respects FK dependencies: `items`/`sale_batches` before
 * `transactions`, `customers` before `credit_entries`.
 */
const CREATE_TABLE_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    selling_price REAL NOT NULL,
    total_purchase_price REAL NOT NULL DEFAULT 0,
    purchased_qty REAL NOT NULL DEFAULT 1,
    current_stock REAL NOT NULL DEFAULT 0,
    unit TEXT NOT NULL,
    image_path TEXT,
    low_stock_threshold REAL,
    is_starred INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT,
    deleted_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS sale_batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT,
    customer_phone TEXT,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL REFERENCES items (id),
    item_name TEXT NOT NULL,
    quantity REAL NOT NULL,
    selling_price_at_time REAL NOT NULL,
    cost_price_at_time REAL NOT NULL,
    sold_at TEXT NOT NULL,
    batch_id INTEGER REFERENCES sale_batches (id)
  )`,
  `CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    created_at TEXT NOT NULL,
    deleted_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS credit_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL REFERENCES customers (id),
    amount REAL NOT NULL,
    type TEXT NOT NULL,
    note TEXT,
    date TEXT NOT NULL,
    created_at TEXT NOT NULL,
    reminder_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS transaction_modifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    item_name TEXT NOT NULL,
    old_quantity REAL NOT NULL,
    new_quantity REAL,
    old_selling_price REAL NOT NULL,
    new_selling_price REAL,
    modified_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_sold_at ON transactions (sold_at)`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_item_id ON transactions (item_id)`
];

export function createSchema(db: AppDatabase): void {
  for (const statement of CREATE_TABLE_STATEMENTS) {
    db.run(sql.raw(statement));
  }
}
