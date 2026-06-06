import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { isoDateTime } from './columns';

/**
 * Consolidated schema equivalent to the Flutter app's drift schema v10 — this
 * is a fresh install with no upgrade path, so there is no migration chain to
 * replay (see `docs/rn_port/PLAN.md` → 1.1).
 */

export const items = sqliteTable('items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  sellingPrice: real('selling_price').notNull(),
  totalPurchasePrice: real('total_purchase_price').notNull().default(0),
  purchasedQty: real('purchased_qty').notNull().default(1),
  currentStock: real('current_stock').notNull().default(0),
  unit: text('unit').notNull(),
  imagePath: text('image_path'),
  lowStockThreshold: real('low_stock_threshold'),
  isStarred: integer('is_starred').notNull().default(0),
  createdAt: isoDateTime('created_at').notNull(),
  updatedAt: isoDateTime('updated_at'),
  deletedAt: isoDateTime('deleted_at')
});

export const saleBatches = sqliteTable('sale_batches', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  customerName: text('customer_name'),
  customerPhone: text('customer_phone'),
  createdAt: isoDateTime('created_at').notNull()
});

export const transactions = sqliteTable(
  'transactions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    itemId: integer('item_id')
      .notNull()
      .references(() => items.id),
    itemName: text('item_name').notNull(),
    quantity: real('quantity').notNull(),
    sellingPriceAtTime: real('selling_price_at_time').notNull(),
    costPriceAtTime: real('cost_price_at_time').notNull(),
    soldAt: isoDateTime('sold_at').notNull(),
    batchId: integer('batch_id').references(() => saleBatches.id)
  },
  (table) => [
    index('idx_transactions_sold_at').on(table.soldAt),
    index('idx_transactions_item_id').on(table.itemId)
  ]
);

export const customers = sqliteTable('customers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  phone: text('phone'),
  createdAt: isoDateTime('created_at').notNull(),
  deletedAt: isoDateTime('deleted_at')
});

export const creditEntries = sqliteTable('credit_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  customerId: integer('customer_id')
    .notNull()
    .references(() => customers.id),
  amount: real('amount').notNull(),
  type: text('type').notNull(),
  note: text('note'),
  date: isoDateTime('date').notNull(),
  createdAt: isoDateTime('created_at').notNull(),
  reminderAt: isoDateTime('reminder_at')
});

export const transactionModifications = sqliteTable('transaction_modifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  // Not a FK — transaction may be deleted; log is kept for audit.
  transactionId: integer('transaction_id').notNull(),
  action: text('action').notNull(), // 'edit' | 'delete'
  itemName: text('item_name').notNull(),
  oldQuantity: real('old_quantity').notNull(),
  newQuantity: real('new_quantity'),
  oldSellingPrice: real('old_selling_price').notNull(),
  newSellingPrice: real('new_selling_price'),
  modifiedAt: isoDateTime('modified_at').notNull()
});
