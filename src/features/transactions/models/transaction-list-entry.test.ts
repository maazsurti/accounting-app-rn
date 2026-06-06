import { Transaction } from '@/features/quick_record/models/transaction';

import {
  entryRevenue,
  entrySortTime,
  transactionListEntriesFromRows,
  type BatchEntry,
  type SingleEntry
} from './transaction-list-entry';

function makeTx(params: {
  id: number;
  itemName: string;
  quantity?: number;
  sellingPriceAtTime?: number;
  batchId?: number | null;
  soldAt?: Date;
}): Transaction {
  const sellingPriceAtTime = params.sellingPriceAtTime ?? 100;
  return new Transaction({
    id: params.id,
    itemId: params.id,
    itemName: params.itemName,
    itemUnit: 'piece',
    quantity: params.quantity ?? 1,
    sellingPriceAtTime,
    costPriceAtTime: sellingPriceAtTime * 0.6,
    soldAt: params.soldAt ?? new Date('2026-05-29T10:00:00.000Z'),
    batchId: params.batchId ?? null
  });
}

function makeRow(
  tx: Transaction,
  customerName: string | null = null,
  customerPhone: string | null = null
) {
  return { tx, customerName, customerPhone };
}

describe('transactionListEntriesFromRows', () => {
  it('produces a SingleEntry per row when no batch ids are present', () => {
    const rows = [
      makeRow(makeTx({ id: 1, itemName: 'Sugar' })),
      makeRow(makeTx({ id: 2, itemName: 'Oil' })),
      makeRow(makeTx({ id: 3, itemName: 'Rice' }))
    ];

    const result = transactionListEntriesFromRows(rows);

    expect(result).toHaveLength(3);
    expect(result.every((e) => e.kind === 'single')).toBe(true);
  });

  it('groups rows sharing a batchId into a single BatchEntry', () => {
    const t1 = makeTx({ id: 1, itemName: 'Sugar', batchId: 7 });
    const t2 = makeTx({ id: 2, itemName: 'Oil', batchId: 7 });

    const result = transactionListEntriesFromRows([makeRow(t1, 'Ramesh'), makeRow(t2, 'Ramesh')]);

    expect(result).toHaveLength(1);
    const batch = result[0] as BatchEntry;
    expect(batch.kind).toBe('batch');
    expect(batch.batchId).toBe(7);
    expect(batch.transactions).toHaveLength(2);
    expect(batch.customerName).toBe('Ramesh');
  });

  it('mixes a batch row and a single row into 2 entries', () => {
    const soldAt = new Date('2026-05-29T10:00:00.000Z');
    const t1 = makeTx({ id: 1, itemName: 'Sugar', batchId: 7, soldAt });
    const t2 = makeTx({ id: 2, itemName: 'Oil', batchId: 7, soldAt });
    const t3 = makeTx({ id: 3, itemName: 'Rice', soldAt: new Date('2026-05-29T09:00:00.000Z') });

    const result = transactionListEntriesFromRows([
      makeRow(t1, 'Ramesh'),
      makeRow(t2, 'Ramesh'),
      makeRow(t3)
    ]);

    expect(result).toHaveLength(2);
  });

  it('sorts the newest entry first — batches sort by their first transaction', () => {
    const older = makeTx({ id: 1, itemName: 'Rice', soldAt: new Date('2026-05-29T08:00:00.000Z') });
    const newer = makeTx({
      id: 2,
      itemName: 'Sugar',
      batchId: 5,
      soldAt: new Date('2026-05-29T10:00:00.000Z')
    });

    const result = transactionListEntriesFromRows([makeRow(newer, 'Ramesh'), makeRow(older)]);

    expect(result[0]?.kind).toBe('batch');
    expect(result[1]?.kind).toBe('single');
  });

  it('keeps independent batch ids as separate BatchEntry objects', () => {
    const t1 = makeTx({ id: 1, itemName: 'Sugar', batchId: 1 });
    const t2 = makeTx({ id: 2, itemName: 'Oil', batchId: 2 });

    const result = transactionListEntriesFromRows([makeRow(t1, 'A'), makeRow(t2, 'B')]);
    const batches = result.filter((e): e is BatchEntry => e.kind === 'batch');

    expect(batches).toHaveLength(2);
    expect(new Set(batches.map((b) => b.batchId))).toEqual(new Set([1, 2]));
  });

  it('leaves customerName/Phone null when the batch has no customer info', () => {
    const t = makeTx({ id: 1, itemName: 'Sugar', batchId: 3 });

    const [batch] = transactionListEntriesFromRows([makeRow(t)]) as [BatchEntry];

    expect(batch.customerName).toBeNull();
    expect(batch.customerPhone).toBeNull();
  });

  it('returns an empty list for empty input', () => {
    expect(transactionListEntriesFromRows([])).toEqual([]);
  });
});

describe('entryRevenue / entrySortTime', () => {
  const batch: BatchEntry = {
    kind: 'batch',
    batchId: 1,
    customerName: 'Ramesh',
    customerPhone: '9876543210',
    transactions: [
      makeTx({ id: 1, itemName: 'Sugar', quantity: 2, sellingPriceAtTime: 40 }),
      makeTx({ id: 2, itemName: 'Oil', quantity: 1, sellingPriceAtTime: 120 }),
      makeTx({ id: 3, itemName: 'Rice', quantity: 3, sellingPriceAtTime: 83.33 })
    ]
  };

  it('sums every transaction revenue for a batch entry', () => {
    const expected = 2 * 40 + 1 * 120 + 3 * 83.33;
    expect(entryRevenue(batch)).toBeCloseTo(expected, 3);
  });

  it('uses the first transaction soldAt as the batch sort time', () => {
    expect(entrySortTime(batch)).toEqual(batch.transactions[0]?.soldAt);
  });

  it('delegates to the underlying transaction for a single entry', () => {
    const tx = makeTx({ id: 1, itemName: 'Sugar', quantity: 2, sellingPriceAtTime: 40 });
    const single: SingleEntry = { kind: 'single', tx };

    expect(entryRevenue(single)).toBe(tx.revenue);
    expect(entrySortTime(single)).toEqual(tx.soldAt);
  });
});
