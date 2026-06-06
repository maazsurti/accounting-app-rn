import type { AppDatabase } from '../client';
import { transactionModifications } from '../schema';

export type TransactionModificationRow = typeof transactionModifications.$inferSelect;
export type NewTransactionModificationRow = typeof transactionModifications.$inferInsert;

export class TransactionModificationDao {
  constructor(private readonly db: AppDatabase) {}

  insertModification(row: NewTransactionModificationRow): number {
    const inserted = this.db
      .insert(transactionModifications)
      .values(row)
      .returning({ id: transactionModifications.id })
      .get();
    return inserted.id;
  }
}
