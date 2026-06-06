import type { AppDatabase } from '../client';
import { createTestDb } from '../test-utils/test-db';
import { ItemDao } from './item-dao';
import { SaleBatchDao } from './sale-batch-dao';
import { TransactionDao, type NewTransactionRow } from './transaction-dao';

function seedItem(db: AppDatabase, name: string, unit = 'kg'): number {
  return new ItemDao(db).insertItem({
    name,
    sellingPrice: 45,
    unit,
    createdAt: new Date('2026-01-01T00:00:00.000Z')
  });
}

function tx(
  overrides: Partial<NewTransactionRow> & { itemId: number; itemName: string }
): NewTransactionRow {
  return {
    quantity: 1,
    sellingPriceAtTime: 45,
    costPriceAtTime: 40,
    soldAt: new Date('2026-01-10T10:00:00.000Z'),
    ...overrides
  };
}

describe('TransactionDao', () => {
  let db: AppDatabase;
  let dao: TransactionDao;
  let itemId: number;

  beforeEach(() => {
    db = createTestDb();
    dao = new TransactionDao(db);
    itemId = seedItem(db, 'Sugar');
  });

  it('inserts a transaction and returns its id', () => {
    const id = dao.insertTransaction(tx({ itemId, itemName: 'Sugar' }));

    expect(id).toBeGreaterThan(0);
    expect(dao.getAll().map((r) => r.id)).toEqual([id]);
  });

  it('returns all transactions newest-first', () => {
    const first = dao.insertTransaction(
      tx({ itemId, itemName: 'Sugar', soldAt: new Date('2026-01-10T09:00:00.000Z') })
    );
    const second = dao.insertTransaction(
      tx({ itemId, itemName: 'Sugar', soldAt: new Date('2026-01-10T10:00:00.000Z') })
    );

    expect(dao.getAll().map((r) => r.id)).toEqual([second, first]);
  });

  it('deletes a transaction by id', () => {
    const id = dao.insertTransaction(tx({ itemId, itemName: 'Sugar' }));

    dao.deleteTransactionById(id);

    expect(dao.getAll()).toHaveLength(0);
  });

  it('deletes multiple transactions by id, and no-ops on an empty list', () => {
    const a = dao.insertTransaction(tx({ itemId, itemName: 'Sugar' }));
    const b = dao.insertTransaction(tx({ itemId, itemName: 'Sugar' }));
    const c = dao.insertTransaction(tx({ itemId, itemName: 'Sugar' }));

    dao.deleteTransactionsByIds([]);
    expect(dao.getAll()).toHaveLength(3);

    dao.deleteTransactionsByIds([a, b]);
    expect(dao.getAll().map((r) => r.id)).toEqual([c]);
  });

  it('updates only quantity and selling price, leaving the rest untouched', () => {
    const id = dao.insertTransaction(
      tx({ itemId, itemName: 'Sugar', quantity: 1, sellingPriceAtTime: 45 })
    );

    dao.updateTransaction({ id, quantity: 2.5, sellingPriceAtTime: 50 });

    expect(dao.getAll()[0]).toMatchObject({
      id,
      quantity: 2.5,
      sellingPriceAtTime: 50,
      itemName: 'Sugar'
    });
  });

  it('joins the selling item’s unit onto each row', () => {
    dao.insertTransaction(tx({ itemId, itemName: 'Sugar' }));

    expect(dao.getAllWithItemUnit()[0]?.item_unit).toBe('kg');
  });

  it('returns the N most recent transactions', () => {
    const ids = [0, 1, 2].map((offset) =>
      dao.insertTransaction(
        tx({ itemId, itemName: 'Sugar', soldAt: new Date(2026, 0, 10 + offset, 10) })
      )
    );

    expect(dao.getRecent(2).map((r) => r.id)).toEqual([ids[2], ids[1]]);
  });

  it('joins item unit onto the recent-transactions query too', () => {
    dao.insertTransaction(tx({ itemId, itemName: 'Sugar' }));

    expect(dao.getRecentWithItemUnit(5)[0]?.item_unit).toBe('kg');
  });

  it('filters to an inclusive sold-at date range', () => {
    const before = dao.insertTransaction(
      tx({ itemId, itemName: 'Sugar', soldAt: new Date('2026-01-09T00:00:00.000Z') })
    );
    const inside = dao.insertTransaction(
      tx({ itemId, itemName: 'Sugar', soldAt: new Date('2026-01-10T00:00:00.000Z') })
    );
    const after = dao.insertTransaction(
      tx({ itemId, itemName: 'Sugar', soldAt: new Date('2026-01-11T00:00:00.000Z') })
    );

    const ids = dao
      .getBetween(new Date('2026-01-10T00:00:00.000Z'), new Date('2026-01-10T23:59:59.000Z'))
      .map((r) => r.id);

    expect(ids).toEqual([inside]);
    expect(ids).not.toContain(before);
    expect(ids).not.toContain(after);
  });

  it('joins item unit onto the date-range query too', () => {
    dao.insertTransaction(
      tx({ itemId, itemName: 'Sugar', soldAt: new Date('2026-01-10T00:00:00.000Z') })
    );

    const rows = dao.getBetweenWithItemUnit(
      new Date('2026-01-01T00:00:00.000Z'),
      new Date('2026-01-31T00:00:00.000Z')
    );

    expect(rows[0]?.item_unit).toBe('kg');
  });

  it('ranks an item’s historical quantities by frequency, top 3', () => {
    for (const quantity of [1, 1, 1, 2, 2, 0.5]) {
      dao.insertTransaction(tx({ itemId, itemName: 'Sugar', quantity }));
    }

    expect(dao.getTopQuantitiesForItem(itemId)).toEqual([1, 2, 0.5]);
  });

  it('attaches batch customer info to batched sales, leaves solo sales null', () => {
    const batchId = new SaleBatchDao(db).insertBatch({
      customerName: 'Rakesh',
      customerPhone: '9876543210',
      createdAt: new Date('2026-01-10T00:00:00.000Z')
    });
    const batched = dao.insertTransaction(tx({ itemId, itemName: 'Sugar', batchId }));
    const solo = dao.insertTransaction(tx({ itemId, itemName: 'Sugar' }));

    const rows = dao.getAllWithBatchInfo();

    expect(rows.find((r) => r.id === batched)).toMatchObject({
      customer_name: 'Rakesh',
      customer_phone: '9876543210'
    });
    expect(rows.find((r) => r.id === solo)).toMatchObject({
      customer_name: null,
      customer_phone: null
    });
  });
});
