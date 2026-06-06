import { desc, eq } from 'drizzle-orm';

import type { AppDatabase } from '../client';
import { creditEntries } from '../schema';

export type CreditEntryRow = typeof creditEntries.$inferSelect;
export type NewCreditEntryRow = typeof creditEntries.$inferInsert;

export class CreditEntryDao {
  constructor(private readonly db: AppDatabase) {}

  insert(row: NewCreditEntryRow): number {
    const inserted = this.db
      .insert(creditEntries)
      .values(row)
      .returning({ id: creditEntries.id })
      .get();
    return inserted.id;
  }

  getForCustomer(customerId: number): CreditEntryRow[] {
    return this.db
      .select()
      .from(creditEntries)
      .where(eq(creditEntries.customerId, customerId))
      .orderBy(desc(creditEntries.date))
      .all();
  }

  getAll(): CreditEntryRow[] {
    return this.db.select().from(creditEntries).orderBy(desc(creditEntries.date)).all();
  }
}
