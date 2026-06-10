import { createContext, useContext, type ReactNode } from 'react';

import { openAppDatabase, type AppDatabase } from '@/core/db/client';
import { AppThemeController } from '@/core/theme';
import { ItemDao } from '@/core/db/daos/item-dao';
import { TransactionDao } from '@/core/db/daos/transaction-dao';
import { TransactionModificationDao } from '@/core/db/daos/transaction-modification-dao';
import { SaleBatchDao } from '@/core/db/daos/sale-batch-dao';
import { ItemRepository } from '@/features/inventory/repository/ItemRepository';
import { InventoryController } from '@/features/inventory/controllers/InventoryController';
import { TransactionRepository } from '@/features/quick_record/repository/TransactionRepository';
import { SaleBatchRepository } from '@/features/quick_record/repository/SaleBatchRepository';
import { QuickRecordController } from '@/features/quick_record/controllers/QuickRecordController';
import { BatchSaleController } from '@/features/quick_record/controllers/BatchSaleController';
import { createStorageService, type StorageService } from '@/core/storage';
import { StatsEngine } from '@/features/transactions/engine/StatsEngine';
import { TransactionController } from '@/features/transactions/controllers/TransactionController';
import { TransactionModificationRepository } from '@/features/transactions/repository/TransactionModificationRepository';

/**
 * Single dependency graph for the app, built once at startup. Mirrors Dart's
 * `AppDependencies` — grows as each feature's controllers/repositories/
 * services are ported (Phases 2-9 each add their own field + wiring here).
 */
export interface AppDependencies {
  readonly db: AppDatabase;
  readonly storage: StorageService;
  readonly themeController: AppThemeController;
  readonly inventory: InventoryController;
  readonly quickRecord: QuickRecordController;
  readonly batchSale: BatchSaleController;
  readonly transactions: TransactionController;
}

export async function createAppDependencies(): Promise<AppDependencies> {
  const db = openAppDatabase();
  const storage = createStorageService();
  const itemRepo = new ItemRepository(new ItemDao(db));
  const txRepo = new TransactionRepository(new TransactionDao(db));
  const modRepo = new TransactionModificationRepository(new TransactionModificationDao(db));
  const batchRepo = new SaleBatchRepository(new SaleBatchDao(db));
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
  const batchSale = new BatchSaleController(itemRepo, txRepo, batchRepo, () => {
    inventory.load();
    transactions.load();
    quickRecord.loadFrequentItems();
  });
  return {
    db,
    storage,
    themeController: new AppThemeController(storage),
    inventory,
    quickRecord,
    batchSale,
    transactions
  };
}

const AppDependenciesContext = createContext<AppDependencies | null>(null);

export function AppDependenciesProvider({
  deps,
  children
}: {
  deps: AppDependencies;
  children: ReactNode;
}) {
  return <AppDependenciesContext.Provider value={deps}>{children}</AppDependenciesContext.Provider>;
}

export function useDeps(): AppDependencies {
  const deps = useContext(AppDependenciesContext);
  if (deps === null) {
    throw new Error('useDeps() called outside an AppDependenciesProvider');
  }
  return deps;
}
