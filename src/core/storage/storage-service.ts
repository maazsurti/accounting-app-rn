import type { StorageKey } from './storage-keys';

export interface StorageService {
  get<T extends string | number | boolean>(key: StorageKey<T>): T | undefined;
  set<T extends string | number | boolean>(key: StorageKey<T>, value: T): void;
  remove<T extends string | number | boolean>(key: StorageKey<T>): void;
  clear(): void;
}
