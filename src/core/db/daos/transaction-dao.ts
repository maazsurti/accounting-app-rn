import { and, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';

import type { AppDatabase } from '../client';
import { transactions } from '../schema';

export type TransactionRow = typeof transactions.$inferSelect;
export type NewTransactionRow = typeof transactions.$inferInsert;

/** Raw row shape for hand-written SQL — keys match SQLite column names (snake_case). */
export interface TransactionRawRow {
  id: number;
  item_id: number;
  item_name: string;
  quantity: number;
  selling_price_at_time: number;
  cost_price_at_time: number;
  sold_at: string;
  batch_id: number | null;
}

export interface TransactionWithItemUnitRawRow extends TransactionRawRow {
  item_unit: string;
}

export interface TransactionWithBatchInfoRawRow extends TransactionWithItemUnitRawRow {
  customer_name: string | null;
  customer_phone: string | null;
}

export class TransactionDao {
  constructor(private readonly db: AppDatabase) {}

  insertTransaction(row: NewTransactionRow): number {
    const inserted = this.db
      .insert(transactions)
      .values(row)
      .returning({ id: transactions.id })
      .get();
    return inserted.id;
  }

  deleteTransactionById(id: number): void {
    this.db.delete(transactions).where(eq(transactions.id, id)).run();
  }

  deleteTransactionsByIds(ids: number[]): void {
    if (ids.length === 0) return;
    this.db.delete(transactions).where(inArray(transactions.id, ids)).run();
  }

  updateTransaction(params: { id: number; quantity: number; sellingPriceAtTime: number }): void {
    this.db
      .update(transactions)
      .set({ quantity: params.quantity, sellingPriceAtTime: params.sellingPriceAtTime })
      .where(eq(transactions.id, params.id))
      .run();
  }

  getAll(): TransactionRow[] {
    return this.db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.soldAt), desc(transactions.id))
      .all();
  }

  getAllWithItemUnit(): TransactionWithItemUnitRawRow[] {
    return this.db.all<TransactionWithItemUnitRawRow>(sql`
      SELECT t.*, COALESCE(i.unit, 'piece') AS item_unit
      FROM transactions t
      LEFT JOIN items i ON i.id = t.item_id
      ORDER BY t.sold_at DESC, t.id DESC
    `);
  }

  getRecent(limit: number): TransactionRow[] {
    return this.db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.soldAt), desc(transactions.id))
      .limit(limit)
      .all();
  }

  getRecentWithItemUnit(limit: number): TransactionWithItemUnitRawRow[] {
    return this.db.all<TransactionWithItemUnitRawRow>(sql`
      SELECT t.*, COALESCE(i.unit, 'piece') AS item_unit
      FROM transactions t
      LEFT JOIN items i ON i.id = t.item_id
      ORDER BY t.sold_at DESC, t.id DESC
      LIMIT ${limit}
    `);
  }

  getBetween(start: Date, end: Date): TransactionRow[] {
    return this.db
      .select()
      .from(transactions)
      .where(and(gte(transactions.soldAt, start), lte(transactions.soldAt, end)))
      .orderBy(desc(transactions.soldAt), desc(transactions.id))
      .all();
  }

  getBetweenWithItemUnit(start: Date, end: Date): TransactionWithItemUnitRawRow[] {
    return this.db.all<TransactionWithItemUnitRawRow>(sql`
      SELECT t.*, COALESCE(i.unit, 'piece') AS item_unit
      FROM transactions t
      LEFT JOIN items i ON i.id = t.item_id
      WHERE t.sold_at >= ${start.toISOString()} AND t.sold_at <= ${end.toISOString()}
      ORDER BY t.sold_at DESC, t.id DESC
    `);
  }

  getTopQuantitiesForItem(itemId: number): number[] {
    const rows = this.db.all<{ quantity: number }>(sql`
      SELECT quantity FROM transactions WHERE item_id = ${itemId}
      GROUP BY quantity ORDER BY COUNT(*) DESC LIMIT 3
    `);
    return rows.map((r) => r.quantity);
  }

  getAllWithBatchInfo(): TransactionWithBatchInfoRawRow[] {
    return this.db.all<TransactionWithBatchInfoRawRow>(sql`
      SELECT t.*,
             COALESCE(i.unit, 'piece') AS item_unit,
             sb.customer_name,
             sb.customer_phone
      FROM transactions t
      LEFT JOIN items i ON i.id = t.item_id
      LEFT JOIN sale_batches sb ON sb.id = t.batch_id
      ORDER BY t.sold_at DESC, t.id DESC
    `);
  }
}
