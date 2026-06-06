import type { Transaction } from '@/features/quick_record/models/transaction';

export interface SingleEntry {
  readonly kind: 'single';
  readonly tx: Transaction;
}

export interface BatchEntry {
  readonly kind: 'batch';
  readonly batchId: number;
  readonly customerName: string | null;
  readonly customerPhone: string | null;
  readonly transactions: Transaction[];
}

export type TransactionListEntry = SingleEntry | BatchEntry;

export function entrySortTime(entry: TransactionListEntry): Date {
  return entry.kind === 'single' ? entry.tx.soldAt : entry.transactions[0].soldAt;
}

export function entryRevenue(entry: TransactionListEntry): number {
  const txs = entry.kind === 'single' ? [entry.tx] : entry.transactions;
  return txs.reduce((sum, tx) => sum + tx.revenue, 0);
}

/**
 * Groups flat transaction rows into single/batch entries (by `batchId`) and
 * sorts newest-first by `entrySortTime`. Mirrors the Dart sealed-class
 * `TransactionListEntry.fromRows` grouping rule exactly — load-bearing for
 * how the transactions list renders.
 */
export function transactionListEntriesFromRows(
  rows: readonly { tx: Transaction; customerName: string | null; customerPhone: string | null }[]
): TransactionListEntry[] {
  const batches = new Map<
    number,
    { customerName: string | null; customerPhone: string | null; transactions: Transaction[] }
  >();
  const result: TransactionListEntry[] = [];

  for (const row of rows) {
    const batchId = row.tx.batchId;
    if (batchId === null) {
      result.push({ kind: 'single', tx: row.tx });
      continue;
    }
    let batch = batches.get(batchId);
    if (!batch) {
      batch = {
        customerName: row.customerName,
        customerPhone: row.customerPhone,
        transactions: []
      };
      batches.set(batchId, batch);
    }
    batch.transactions.push(row.tx);
  }

  for (const [batchId, batch] of batches) {
    result.push({ kind: 'batch', batchId, ...batch });
  }

  result.sort((a, b) => entrySortTime(b).getTime() - entrySortTime(a).getTime());
  return result;
}
