import { createMemoryStorage } from '@/core/storage/test-utils/memory-storage';
import { StorageKeys } from '@/core/storage';

import { AppThemeController } from './theme-controller';

describe('AppThemeController', () => {
  it('loads a saved theme mode from storage', () => {
    const storage = createMemoryStorage();
    storage.set(StorageKeys.themeMode, 'dark');

    const controller = new AppThemeController(storage);

    expect(controller.mode).toBe('dark');
  });

  it('falls back to system when storage has an unknown value', () => {
    const storage = createMemoryStorage();
    storage.set(StorageKeys.themeMode, 'sepia');

    const controller = new AppThemeController(storage);

    expect(controller.mode).toBe('system');
  });

  it('persists theme mode changes', () => {
    const storage = createMemoryStorage();
    const controller = new AppThemeController(storage);

    controller.setMode('light');

    expect(storage.get(StorageKeys.themeMode)).toBe('light');
  });
});
