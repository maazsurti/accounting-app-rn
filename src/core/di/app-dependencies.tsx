import { createContext, useContext, type ReactNode } from 'react';

import { openAppDatabase, type AppDatabase } from '@/core/db/client';
import { AppThemeController } from '@/core/theme';

/**
 * Single dependency graph for the app, built once at startup. Mirrors Dart's
 * `AppDependencies` — grows as each feature's controllers/repositories/
 * services are ported (Phases 2-9 each add their own field + wiring here).
 */
export interface AppDependencies {
  readonly db: AppDatabase;
  readonly themeController: AppThemeController;
}

export async function createAppDependencies(): Promise<AppDependencies> {
  return {
    db: openAppDatabase(),
    themeController: new AppThemeController(),
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
