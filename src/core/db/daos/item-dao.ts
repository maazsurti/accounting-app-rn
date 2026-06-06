import { desc, eq, isNull, sql } from 'drizzle-orm';

import type { AppDatabase } from '../client';
import { items } from '../schema';

export type ItemRow = typeof items.$inferSelect;
export type NewItemRow = typeof items.$inferInsert;

/** Raw row shape for hand-written SQL — keys match SQLite column names (snake_case). */
export interface ItemRawRow {
  id: number;
  name: string;
  selling_price: number;
  total_purchase_price: number;
  purchased_qty: number;
  current_stock: number;
  unit: string;
  image_path: string | null;
  low_stock_threshold: number | null;
  is_starred: number;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
}

export interface FrequentItemRawRow extends ItemRawRow {
  sale_count: number;
}

export class ItemDao {
  constructor(private readonly db: AppDatabase) {}

  insertItem(row: NewItemRow): number {
    const inserted = this.db.insert(items).values(row).returning({ id: items.id }).get();
    return inserted.id;
  }

  updateItemRow(row: ItemRow): void {
    const { id, ...rest } = row;
    this.db.update(items).set(rest).where(eq(items.id, id)).run();
  }

  softDelete(id: number): void {
    const now = new Date();
    this.db.update(items).set({ deletedAt: now, updatedAt: now }).where(eq(items.id, id)).run();
  }

  toggleStar(id: number, starred: boolean): void {
    this.db
      .update(items)
      .set({ isStarred: starred ? 1 : 0, updatedAt: new Date() })
      .where(eq(items.id, id))
      .run();
  }

  decrementStock(id: number, qty: number): void {
    this.db.run(sql`
      UPDATE items
      SET current_stock = MAX(0, current_stock - ${qty}),
          updated_at = ${new Date().toISOString()}
      WHERE id = ${id}
    `);
  }

  adjustStock(id: number, delta: number): void {
    this.db.run(sql`
      UPDATE items
      SET current_stock = MAX(0, current_stock + ${delta}),
          updated_at = ${new Date().toISOString()}
      WHERE id = ${id}
    `);
  }

  getAllActiveRaw(): ItemRawRow[] {
    return this.db.all<ItemRawRow>(sql`
      SELECT *
      FROM items
      WHERE deleted_at IS NULL
      ORDER BY COALESCE(updated_at, created_at) DESC, id DESC
    `);
  }

  getLowStockRaw(): ItemRawRow[] {
    return this.db.all<ItemRawRow>(sql`
      SELECT * FROM items
      WHERE deleted_at IS NULL
        AND current_stock <= COALESCE(low_stock_threshold, purchased_qty * 0.25)
      ORDER BY (current_stock * 1.0 / MAX(purchased_qty, 1)) ASC
    `);
  }

  /**
   * Ranking: starred = pin to top, then recent sale count, then oldest.
   * isStarred is not a filter — all active items are returned up to `limit`.
   * (`docs/rn_port/PLAN.md` → Phase 2: this rule is load-bearing — keep the
   * SQL/ordering exactly as documented in `CLAUDE.md` → "frequentItems".)
   */
  getFrequentRaw(limit: number, since: string): FrequentItemRawRow[] {
    return this.db.all<FrequentItemRawRow>(sql`
      SELECT i.*, COUNT(t.id) AS sale_count
      FROM items i
      LEFT JOIN transactions t
        ON t.item_id = i.id AND t.sold_at >= ${since}
      WHERE i.deleted_at IS NULL
      GROUP BY i.id
      ORDER BY i.is_starred DESC, sale_count DESC, i.created_at ASC
      LIMIT ${limit}
    `);
  }

  /** Test/seed helper — not part of the Dart DAO; exposed for unit tests. */
  getAllActiveTyped(): ItemRow[] {
    return this.db.select().from(items).where(isNull(items.deletedAt)).orderBy(desc(items.id)).all();
  }
}
