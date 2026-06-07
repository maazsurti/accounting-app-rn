import { makeAutoObservable } from 'mobx';

import type { StorageService } from '@/core/storage';
import { StorageKeys } from '@/core/storage';

export type AppThemeMode = 'light' | 'dark' | 'system';

const appThemeModes: readonly AppThemeMode[] = ['light', 'dark', 'system'];

function isAppThemeMode(value: string): value is AppThemeMode {
  return appThemeModes.includes(value as AppThemeMode);
}

export class AppThemeController {
  mode: AppThemeMode = 'system';

  constructor(private readonly storage?: StorageService) {
    const storedMode = storage?.get(StorageKeys.themeMode);
    if (storedMode !== undefined && isAppThemeMode(storedMode)) {
      this.mode = storedMode;
    }
    makeAutoObservable(this);
  }

  setMode(mode: AppThemeMode) {
    this.mode = mode;
    this.storage?.set(StorageKeys.themeMode, mode);
  }
}
