import type { AppDatabase } from '../client';
import { createTestDb } from '../test-utils/test-db';
import { ItemDao, type NewItemRow } from './item-dao';
import { TransactionDao } from './transaction-dao';

function seedItem(db: AppDatabase, overrides: Partial<NewItemRow> = {}): number {
  return new ItemDao(db).insertItem({
    name: 'Sugar',
    sellingPrice: 45,
    unit: 'kg',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides
  });
}

describe('ItemDao', () => {
  let db: AppDatabase;
  let dao: ItemDao;

  beforeEach(() => {
    db = createTestDb();
    dao = new ItemDao(db);
  });

  it('inserts an item and returns its id', () => {
    const id = seedItem(db);

    expect(id).toBeGreaterThan(0);
    expect(dao.getAllActiveTyped()[0]).toMatchObject({
      id,
      name: 'Sugar',
      sellingPrice: 45,
      unit: 'kg'
    });
  });

  it('updates an item row in place', () => {
    const id = seedItem(db);
    const [row] = dao.getAllActiveTyped();

    dao.updateItemRow({ ...row, name: 'Brown Sugar', sellingPrice: 50 });

    expect(dao.getAllActiveTyped()[0]).toMatchObject({ id, name: 'Brown Sugar', sellingPrice: 50 });
  });

  it('soft-deletes — excluded from the active list', () => {
    const id = seedItem(db);

    dao.softDelete(id);

    expect(dao.getAllActiveRaw()).toHaveLength(0);
  });

  it('toggles the starred flag', () => {
    const id = seedItem(db);

    dao.toggleStar(id, true);
    expect(dao.getAllActiveTyped()[0]?.isStarred).toBe(1);

    dao.toggleStar(id, false);
    expect(dao.getAllActiveTyped()[0]?.isStarred).toBe(0);
  });

  it('decrements stock but never below zero', () => {
    const id = seedItem(db, { currentStock: 5 });

    dao.decrementStock(id, 3);
    expect(dao.getAllActiveTyped()[0]?.currentStock).toBe(2);

    dao.decrementStock(id, 10);
    expect(dao.getAllActiveTyped()[0]?.currentStock).toBe(0);
  });

  it('adjusts stock up or down but never below zero', () => {
    const id = seedItem(db, { currentStock: 5 });

    dao.adjustStock(id, 4);
    expect(dao.getAllActiveTyped()[0]?.currentStock).toBe(9);

    dao.adjustStock(id, -20);
    expect(dao.getAllActiveTyped()[0]?.currentStock).toBe(0);
  });

  it('orders active items by most-recently-touched first', () => {
    const older = seedItem(db, { name: 'Salt', createdAt: new Date('2026-01-01T00:00:00.000Z') });
    const newer = seedItem(db, { name: 'Atta', createdAt: new Date('2026-01-02T00:00:00.000Z') });

    expect(dao.getAllActiveRaw().map((r) => r.id)).toEqual([newer, older]);
  });

  it('flags items at or below their low-stock threshold, worst-ratio first', () => {
    const critical = seedItem(db, {
      name: 'Salt',
      currentStock: 1,
      purchasedQty: 10,
      lowStockThreshold: 5
    });
    const borderline = seedItem(db, {
      name: 'Atta',
      currentStock: 4,
      purchasedQty: 10,
      lowStockThreshold: 5
    });
    seedItem(db, { name: 'Sugar', currentStock: 50, purchasedQty: 10, lowStockThreshold: 5 });

    expect(dao.getLowStockRaw().map((r) => r.id)).toEqual([critical, borderline]);
  });

  it('ranks frequent items by starred, then 30-day sale count, then oldest first', () => {
    const txDao = new TransactionDao(db);
    const since = '2026-01-01T00:00:00.000Z';

    const starred = seedItem(db, { name: 'Tea', createdAt: new Date('2026-01-05T00:00:00.000Z') });
    const wellSold = seedItem(db, {
      name: 'Sugar',
      createdAt: new Date('2026-01-04T00:00:00.000Z')
    });
    const oldUnsold = seedItem(db, {
      name: 'Salt',
      createdAt: new Date('2026-01-01T00:00:00.000Z')
    });
    const newUnsold = seedItem(db, {
      name: 'Atta',
      createdAt: new Date('2026-01-06T00:00:00.000Z')
    });

    dao.toggleStar(starred, true);
    for (let i = 0; i < 3; i += 1) {
      txDao.insertTransaction({
        itemId: wellSold,
        itemName: 'Sugar',
        quantity: 1,
        sellingPriceAtTime: 45,
        costPriceAtTime: 40,
        soldAt: new Date('2026-01-10T00:00:00.000Z')
      });
    }

    expect(dao.getFrequentRaw(10, since).map((r) => r.id)).toEqual([
      starred,
      wellSold,
      oldUnsold,
      newUnsold
    ]);
  });
});
