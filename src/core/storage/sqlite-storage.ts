import { StorageValueKind, type StorageKey } from './storage-keys';
import type { StorageService } from './storage-service';

interface SQLiteKeyValueStore {
  getItemSync(key: string): string | null;
  setItemSync(key: string, value: string): void;
  removeItemSync(key: string): void;
  clearSync(): void;
}

export class SQLiteStorageService implements StorageService {
  constructor(private readonly storage: SQLiteKeyValueStore) {}

  get<T extends string | number | boolean>(key: StorageKey<T>): T | undefined {
    const value = this.storage.getItemSync(key.name);
    if (value === null) return undefined;

    switch (key.kind) {
      case StorageValueKind.String:
        return value as T;
      case StorageValueKind.Number:
        return Number(value) as T;
      case StorageValueKind.Boolean:
        return (value === 'true') as T;
    }
  }

  set<T extends string | number | boolean>(key: StorageKey<T>, value: T): void {
    this.storage.setItemSync(key.name, String(value));
  }

  remove<T extends string | number | boolean>(key: StorageKey<T>): void {
    this.storage.removeItemSync(key.name);
  }

  clear(): void {
    this.storage.clearSync();
  }
}

export function createStorageService(): StorageService {
  // Lazy load keeps Jest module evaluation free from native module setup.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Storage = require('expo-sqlite/kv-store').default as SQLiteKeyValueStore;
  return new SQLiteStorageService(Storage);
}
