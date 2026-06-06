import { Item, type ItemProps } from './item';

function makeItem(overrides: Partial<ItemProps> = {}): Item {
  return new Item({
    name: 'Sugar',
    sellingPrice: 50,
    totalPurchasePrice: 400,
    purchasedQty: 10,
    currentStock: 5,
    unit: 'kg',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides
  });
}

describe('Item', () => {
  it('costPerUnit divides total purchase price by purchased quantity', () => {
    expect(makeItem({ totalPurchasePrice: 400, purchasedQty: 10 }).costPerUnit).toBe(40);
  });

  it('costPerUnit is 0 when nothing has been purchased yet — avoids division by zero', () => {
    expect(makeItem({ totalPurchasePrice: 0, purchasedQty: 0 }).costPerUnit).toBe(0);
  });

  it('margin is selling price minus cost per unit', () => {
    expect(makeItem({ sellingPrice: 50, totalPurchasePrice: 400, purchasedQty: 10 }).margin).toBe(
      10
    );
  });

  it('isOutOfStock when current stock has hit zero (or gone negative)', () => {
    expect(makeItem({ currentStock: 0 }).isOutOfStock).toBe(true);
    expect(makeItem({ currentStock: 1 }).isOutOfStock).toBe(false);
  });

  it('falls back to 25% of purchased quantity when no explicit low-stock threshold is set', () => {
    expect(makeItem({ purchasedQty: 20, lowStockThreshold: null }).effectiveLowStockThreshold).toBe(
      5
    );
  });

  it('uses the explicit low-stock threshold over the 25% default when one is set', () => {
    expect(makeItem({ purchasedQty: 20, lowStockThreshold: 2 }).effectiveLowStockThreshold).toBe(2);
  });

  it('isLowStock compares current stock against the effective threshold, not a fixed number', () => {
    expect(
      makeItem({ purchasedQty: 20, currentStock: 5, lowStockThreshold: null }).isLowStock
    ).toBe(true);
    expect(
      makeItem({ purchasedQty: 20, currentStock: 6, lowStockThreshold: null }).isLowStock
    ).toBe(false);
  });

  it('isDeleted reflects whether deletedAt is set', () => {
    expect(makeItem().isDeleted).toBe(false);
    expect(makeItem({ deletedAt: new Date('2026-02-01T00:00:00.000Z') }).isDeleted).toBe(true);
  });

  it('copyWith overrides only the given fields and keeps the rest', () => {
    const item = makeItem({ currentStock: 5, sellingPrice: 50 });

    const restocked = item.copyWith({ currentStock: 15 });

    expect(restocked.currentStock).toBe(15);
    expect(restocked.sellingPrice).toBe(50);
    expect(restocked.id).toBe(item.id);
  });
});
