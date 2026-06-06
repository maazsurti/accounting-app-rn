import { asc, eq, isNull } from 'drizzle-orm';

import type { AppDatabase } from '../client';
import { customers } from '../schema';

export type CustomerRow = typeof customers.$inferSelect;
export type NewCustomerRow = typeof customers.$inferInsert;

export class CustomerDao {
  constructor(private readonly db: AppDatabase) {}

  insert(row: NewCustomerRow): number {
    const inserted = this.db.insert(customers).values(row).returning({ id: customers.id }).get();
    return inserted.id;
  }

  getAllActive(): CustomerRow[] {
    return this.db
      .select()
      .from(customers)
      .where(isNull(customers.deletedAt))
      .orderBy(asc(customers.createdAt))
      .all();
  }

  softDelete(id: number): void {
    this.db.update(customers).set({ deletedAt: new Date() }).where(eq(customers.id, id)).run();
  }
}
