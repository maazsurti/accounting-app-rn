import { createTestDb } from '@/core/db/test-utils/test-db';
import type { AppDependencies } from '@/core/di/app-dependencies';
import { AppThemeController } from '@/core/theme';
import { ItemDao } from '@/core/db/daos/item-dao';
import { TransactionDao } from '@/core/db/daos/transaction-dao';
import { ItemRepository } from '@/features/inventory/repository/ItemRepository';
import { TransactionRepository } from '@/features/quick_record/repository/TransactionRepository';
import { QuickRecordController } from '@/features/quick_record/controllers/QuickRecordController';

/**
 * In-memory dependency graph for tests — same shape as production `AppDependencies`,
 * backed by `createTestDb()`. Pass `overrides` to swap individual services for
 * test doubles (e.g. a fake `notifications`) without reconstructing the whole graph.
 */
export function createTestAppDependencies(
  overrides: Partial<AppDependencies> = {}
): AppDependencies {
  const db = createTestDb();
  const itemRepo = new ItemRepository(new ItemDao(db));
  const txRepo = new TransactionRepository(new TransactionDao(db));
  return {
    db,
    themeController: new AppThemeController(),
    quickRecord: new QuickRecordController(itemRepo, txRepo),
    ...overrides
  };
}
