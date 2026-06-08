import { createTestDb } from '@/core/db/test-utils/test-db';
import type { AppDatabase } from '@/core/db/client';
import { ItemDao } from '@/core/db/daos/item-dao';
import { SaleBatchDao } from '@/core/db/daos/sale-batch-dao';
import { TransactionDao } from '@/core/db/daos/transaction-dao';
import { TransactionModificationDao } from '@/core/db/daos/transaction-modification-dao';
import { transactionModifications } from '@/core/db/schema';
import { Item } from '@/features/inventory/models/item';
import { ItemRepository } from '@/features/inventory/repository/ItemRepository';
import { TransactionRepository } from '@/features/quick_record/repository/TransactionRepository';
import { StatsEngine } from '@/features/transactions/engine/StatsEngine';
import { TransactionModificationRepository } from '@/features/transactions/repository/TransactionModificationRepository';

import { TransactionController } from './TransactionController';

function makeItem(overrides: Partial<ConstructorParameters<typeof Item>[0]> = {}): Item {
  return new Item({
    name: 'Sugar',
    sellingPrice: 50,
    totalPurchasePrice: 300,
    purchasedQty: 10,
    currentStock: 10,
    unit: 'kg',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides
  });
}

function createHarness(): {
  db: AppDatabase;
  itemRepo: ItemRepository;
  txRepo: TransactionRepository;
  batchDao: SaleBatchDao;
  controller: TransactionController;
  modifiedCalls: () => number;
} {
  const db = createTestDb();
  const itemRepo = new ItemRepository(new ItemDao(db));
  const txRepo = new TransactionRepository(new TransactionDao(db));
  const modRepo = new TransactionModificationRepository(new TransactionModificationDao(db));
  const batchDao = new SaleBatchDao(db);
  let calls = 0;
  const controller = new TransactionController(txRepo, itemRepo, modRepo, new StatsEngine(), () => {
    calls += 1;
  });
  return { db, itemRepo, txRepo, batchDao, controller, modifiedCalls: () => calls };
}

describe('TransactionController', () => {
  it('loads grouped entries and calculates today stats', () => {
    const { controller, itemRepo, txRepo } = createHarness();
    const item = itemRepo.addItem(makeItem({ sellingPrice: 50, totalPurchasePrice: 300 }));
    txRepo.recordTransaction(item, 2);

    controller.load();

    expect(controller.state.kind).toBe('loaded');
    expect(controller.entries).toHaveLength(1);
    expect(controller.transactions).toHaveLength(1);
    expect(controller.todayStats.totalRevenue).toBe(100);
    expect(controller.todayStats.byItem[0]).toMatchObject({ itemName: 'Sugar', unitsSold: 2 });
  });

  it('edits a transaction, logs an audit row, and applies only the stock delta', () => {
    const { controller, db, itemRepo, txRepo, modifiedCalls } = createHarness();
    const item = itemRepo.addItem(makeItem({ currentStock: 10 }));
    const tx = txRepo.recordTransaction(item, 2);
    itemRepo.decrementStock(item.id!, 2);
    controller.load();

    controller.editTransaction(tx, { newQuantity: 5, newSellingPrice: 60 });

    expect(txRepo.getAllTransactions()[0]).toMatchObject({
      id: tx.id,
      quantity: 5,
      sellingPriceAtTime: 60
    });
    expect(itemRepo.getAllItems()[0]?.currentStock).toBe(5);
    expect(modifiedCalls()).toBe(1);
    expect(db.select().from(transactionModifications).all()[0]).toMatchObject({
      action: 'edit',
      oldQuantity: 2,
      newQuantity: 5,
      oldSellingPrice: 50,
      newSellingPrice: 60
    });
    expect(controller.transactions[0]).toMatchObject({ id: tx.id, quantity: 5 });
  });

  it('deletes one transaction, restores sold stock, removes selection, and logs delete', () => {
    const { controller, db, itemRepo, txRepo, modifiedCalls } = createHarness();
    const item = itemRepo.addItem(makeItem({ currentStock: 10 }));
    const tx = txRepo.recordTransaction(item, 2);
    itemRepo.decrementStock(item.id!, 2);
    controller.load();
    controller.toggleSelection(tx);

    controller.deleteTransaction(tx);

    expect(txRepo.getAllTransactions()).toEqual([]);
    expect(itemRepo.getAllItems()[0]?.currentStock).toBe(10);
    expect(controller.selectedTransactionIds.size).toBe(0);
    expect(modifiedCalls()).toBe(1);
    expect(db.select().from(transactionModifications).all()[0]).toMatchObject({
      action: 'delete',
      oldQuantity: 2
    });
  });

  it('selects an entire batch and bulk deletes it as one entry', () => {
    const { controller, itemRepo, txRepo, batchDao } = createHarness();
    const sugar = itemRepo.addItem(makeItem({ name: 'Sugar', currentStock: 10 }));
    const oil = itemRepo.addItem(makeItem({ name: 'Oil', sellingPrice: 120, currentStock: 8 }));
    const batchId = batchDao.insertBatch({
      customerName: 'Rakesh',
      customerPhone: '9876543210',
      createdAt: new Date()
    });
    const sugarTx = txRepo.recordTransactionWithBatchId(sugar, 2, batchId);
    const oilTx = txRepo.recordTransactionWithBatchId(oil, 1, batchId);
    itemRepo.decrementStock(sugar.id!, 2);
    itemRepo.decrementStock(oil.id!, 1);
    controller.load();
    const batch = controller.entries.find((entry) => entry.kind === 'batch');
    expect(batch?.kind).toBe('batch');
    if (!batch || batch.kind !== 'batch') throw new Error('Expected a batch entry');

    controller.toggleBatchSelection(batch);
    expect([...controller.selectedTransactionIds].sort()).toEqual([sugarTx.id, oilTx.id].sort());

    controller.deleteTransactions(batch.transactions);

    expect(controller.entries).toEqual([]);
    expect(
      Object.fromEntries(itemRepo.getAllItems().map((item) => [item.name, item.currentStock]))
    ).toEqual({
      Oil: 8,
      Sugar: 10
    });
    expect(controller.selectedTransactionIds.size).toBe(0);
  });
});
