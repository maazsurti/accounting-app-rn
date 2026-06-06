import { desc, isNotNull } from 'drizzle-orm';

import type { AppDatabase } from '../client';
import { saleBatches } from '../schema';

export type SaleBatchRow = typeof saleBatches.$inferSelect;
export type NewSaleBatchRow = typeof saleBatches.$inferInsert;

export interface RecentCustomer {
  name: string;
  phone: string;
}

export class SaleBatchDao {
  constructor(private readonly db: AppDatabase) {}

  insertBatch(row: NewSaleBatchRow): number {
    const inserted = this.db
      .insert(saleBatches)
      .values(row)
      .returning({ id: saleBatches.id })
      .get();
    return inserted.id;
  }

  /** Most recent 20 distinct customer name+phone pairs, newest first. */
  getRecentCustomers(): RecentCustomer[] {
    const rows = this.db
      .select({ name: saleBatches.customerName, phone: saleBatches.customerPhone })
      .from(saleBatches)
      .where(isNotNull(saleBatches.customerName))
      .orderBy(desc(saleBatches.createdAt))
      .limit(40)
      .all();

    const seen = new Set<string>();
    const result: RecentCustomer[] = [];
    for (const row of rows) {
      const name = row.name ?? '';
      if (name === '' || seen.has(name)) continue;
      seen.add(name);
      result.push({ name, phone: row.phone ?? '' });
      if (result.length >= 20) break;
    }
    return result;
  }
}
