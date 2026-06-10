import { autorun } from 'mobx';

import { createTestDb } from '@/core/db/test-utils/test-db';
import { ItemDao } from '@/core/db/daos/item-dao';
import { Item } from '@/features/inventory/models/item';
import { ItemRepository } from '@/features/inventory/repository/ItemRepository';
import { InventoryController } from './InventoryController';

function makeItem(overrides: Partial<ConstructorParameters<typeof Item>[0]> = {}): Item {
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

function createController(): { controller: InventoryController; repo: ItemRepository } {
  const repo = new ItemRepository(new ItemDao(createTestDb()));
  return { controller: new InventoryController(repo), repo };
}

describe('InventoryController', () => {
  it('loads active items from the repository', () => {
    const { controller, repo } = createController();
    repo.addItem(makeItem({ name: 'Sugar' }));
    repo.addItem(makeItem({ name: 'Salt', createdAt: new Date('2026-01-02T00:00:00.000Z') }));

    controller.load();

    expect(controller.state.kind).toBe('loaded');
    expect(controller.items.map((item) => item.name)).toEqual(['Salt', 'Sugar']);
  });

  it('computes low-stock items from loaded inventory', () => {
    const { controller } = createController();

    controller.addItem(makeItem({ name: 'Low', currentStock: 2, lowStockThreshold: 3 }));
    controller.addItem(makeItem({ name: 'Healthy', currentStock: 10, lowStockThreshold: 3 }));

    expect(controller.lowStockItems.map((item) => item.name)).toEqual(['Low']);
  });

  it('owns inventory search state and derives visible/low-stock rows', () => {
    const { controller } = createController();
    controller.addItem(makeItem({ name: 'Sugar', currentStock: 2, lowStockThreshold: 3 }));
    controller.addItem(makeItem({ name: 'Salt', currentStock: 10, lowStockThreshold: 3 }));

    controller.setSearchQuery('sug');

    expect(controller.visibleItems.map((item) => item.name)).toEqual(['Sugar']);
    expect(controller.displayedLowStockItems).toEqual([]);

    controller.clearSearchQuery();

    expect(controller.visibleItems.map((item) => item.name)).toEqual(['Sugar', 'Salt']);
    expect(controller.displayedLowStockItems.map((item) => item.name)).toEqual(['Sugar']);
  });

  it('restocks an existing item by merging quantity and cost, not inserting a duplicate', () => {
    const { controller, repo } = createController();
    const saved = controller.addItem(
      makeItem({ purchasedQty: 10, currentStock: 4, totalPurchasePrice: 400 })
    );

    controller.restockItem({ item: saved, quantity: 6, totalCost: 300 });

    expect(controller.items).toHaveLength(1);
    expect(controller.items[0]).toMatchObject({
      id: saved.id,
      purchasedQty: 16,
      currentStock: 10,
      totalPurchasePrice: 700
    });
    expect(repo.getAllItems()).toHaveLength(1);
  });

  it('owns restock sheet state, validates input, and closes after successful submit', () => {
    const { controller, repo } = createController();
    const saved = controller.addItem(
      makeItem({ purchasedQty: 10, currentStock: 4, totalPurchasePrice: 400 })
    );

    controller.openRestockSheet(saved);
    controller.setRestockQuantityText('0');
    controller.setRestockTotalCostText('-1');

    expect(controller.submitRestock()).toBe(false);
    expect(controller.restockQuantityError).toBe('enterQtyAboveZero');
    expect(controller.restockCostError).toBe('enterValidAmount');

    controller.setRestockQuantityText('6');
    controller.setRestockTotalCostText('300');

    expect(controller.restockNewLotCost).toBe(50);
    expect(controller.submitRestock()).toBe(true);
    expect(controller.selectedRestockItem).toBeNull();
    expect(repo.getAllItems()[0]).toMatchObject({
      id: saved.id,
      purchasedQty: 16,
      currentStock: 10,
      totalPurchasePrice: 700
    });
  });

  it('deletes items with a soft delete and increments changeStamp', () => {
    const { controller, repo } = createController();
    const saved = controller.addItem(makeItem());
    const stampAfterAdd = controller.changeStamp;

    controller.deleteItem(saved.id!);

    expect(controller.items).toEqual([]);
    expect(repo.getAllItems()).toEqual([]);
    expect(controller.changeStamp).toBe(stampAfterAdd + 1);
  });

  it('toggles starred state and exposes an observable change stamp', () => {
    const { controller, repo } = createController();
    const seenStamps: number[] = [];
    const dispose = autorun(() => {
      seenStamps.push(controller.changeStamp);
    });
    const saved = controller.addItem(makeItem({ isStarred: false }));

    controller.toggleStar(saved);

    expect(controller.items[0]?.isStarred).toBe(true);
    expect(repo.getAllItems()[0]?.isStarred).toBe(true);
    expect(seenStamps).toContain(controller.changeStamp);
    dispose();
  });
});
