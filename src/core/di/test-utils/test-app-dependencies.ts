import { createTestDb } from '@/core/db/test-utils/test-db';
import type { AppDependencies } from '@/core/di/app-dependencies';

/**
 * In-memory dependency graph for tests — same shape as production `AppDependencies`,
 * backed by `createTestDb()`. Pass `overrides` to swap individual services for
 * test doubles (e.g. a fake `notifications`) without reconstructing the whole graph.
 */
export function createTestAppDependencies(
  overrides: Partial<AppDependencies> = {}
): AppDependencies {
  return { db: createTestDb(), ...overrides };
}
