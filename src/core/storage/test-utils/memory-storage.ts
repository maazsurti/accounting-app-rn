import type { StorageKey } from '../storage-keys';
import type { StorageService } from '../storage-service';

export class MemoryStorage implements StorageService {
  private readonly values = new Map<string, string | number | boolean>();

  get<T extends string | number | boolean>(key: StorageKey<T>): T | undefined {
    return this.values.get(key.name) as T | undefined;
  }

  set<T extends string | number | boolean>(key: StorageKey<T>, value: T): void {
    this.values.set(key.name, value);
  }

  remove<T extends string | number | boolean>(key: StorageKey<T>): void {
    this.values.delete(key.name);
  }

  clear(): void {
    this.values.clear();
  }
}

export function createMemoryStorage(): StorageService {
  return new MemoryStorage();
}
