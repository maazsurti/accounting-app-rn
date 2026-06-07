import { makeAutoObservable } from 'mobx';

export type AppThemeMode = 'light' | 'dark' | 'system';

export class AppThemeController {
  mode: AppThemeMode = 'system';

  constructor() {
    makeAutoObservable(this);
  }

  setMode(mode: AppThemeMode) {
    this.mode = mode;
    // Phase 1.8: StorageService.set(StorageKey.themeMode, mode)
  }
}
