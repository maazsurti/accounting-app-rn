import { createTestDb } from '@/core/db/test-utils/test-db';
import type { AppDependencies } from '@/core/di/app-dependencies';
import { AppThemeController } from '@/core/theme';
import { ItemDao } from '@/core/db/daos/item-dao';
import { TransactionDao } from '@/core/db/daos/transaction-dao';
import { TransactionModificationDao } from '@/core/db/daos/transaction-modification-dao';
import { ItemRepository } from '@/features/inventory/repository/ItemRepository';
import { InventoryController } from '@/features/inventory/controllers/InventoryController';
import { TransactionRepository } from '@/features/quick_record/repository/TransactionRepository';
import { QuickRecordController } from '@/features/quick_record/controllers/QuickRecordController';
import { createMemoryStorage } from '@/core/storage/test-utils/memory-storage';
import { StatsEngine } from '@/features/transactions/engine/StatsEngine';
import { TransactionController } from '@/features/transactions/controllers/TransactionController';
import { TransactionModificationRepository } from '@/features/transactions/repository/TransactionModificationRepository';

/**
 * In-memory dependency graph for tests — same shape as production `AppDependencies`,
 * backed by `createTestDb()`. Pass `overrides` to swap individual services for
 * test doubles (e.g. a fake `notifications`) without reconstructing the whole graph.
 */
export function createTestAppDependencies(
  overrides: Partial<AppDependencies> = {}
): AppDependencies {
  const db = createTestDb();
  const storage = createMemoryStorage();
  const itemRepo = new ItemRepository(new ItemDao(db));
  const txRepo = new TransactionRepository(new TransactionDao(db));
  const modRepo = new TransactionModificationRepository(new TransactionModificationDao(db));
  const inventory = new InventoryController(itemRepo);
  let quickRecord: QuickRecordController;
  const transactions = new TransactionController(
    txRepo,
    itemRepo,
    modRepo,
    new StatsEngine(),
    () => {
      inventory.load();
      quickRecord.loadFrequentItems();
    }
  );
  quickRecord = new QuickRecordController(itemRepo, txRepo, (tx) =>
    transactions.onTransactionAdded(tx)
  );
  return {
    db,
    storage,
    themeController: new AppThemeController(storage),
    inventory,
    quickRecord,
    transactions,
    ...overrides
  };
}
