import { createContext, useContext, type ReactNode } from 'react';

import { openAppDatabase, type AppDatabase } from '@/core/db/client';
import { AppThemeController } from '@/core/theme';
import { ItemDao } from '@/core/db/daos/item-dao';
import { TransactionDao } from '@/core/db/daos/transaction-dao';
import { ItemRepository } from '@/features/inventory/repository/ItemRepository';
import { TransactionRepository } from '@/features/quick_record/repository/TransactionRepository';
import { QuickRecordController } from '@/features/quick_record/controllers/QuickRecordController';

/**
 * Single dependency graph for the app, built once at startup. Mirrors Dart's
 * `AppDependencies` — grows as each feature's controllers/repositories/
 * services are ported (Phases 2-9 each add their own field + wiring here).
 */
export interface AppDependencies {
  readonly db: AppDatabase;
  readonly themeController: AppThemeController;
  readonly quickRecord: QuickRecordController;
}

export async function createAppDependencies(): Promise<AppDependencies> {
  const db = openAppDatabase();
  const itemRepo = new ItemRepository(new ItemDao(db));
  const txRepo = new TransactionRepository(new TransactionDao(db));
  return {
    db,
    themeController: new AppThemeController(),
    quickRecord: new QuickRecordController(itemRepo, txRepo)
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
