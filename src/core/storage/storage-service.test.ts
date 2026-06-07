import { SQLiteStorageService } from './sqlite-storage';
import { StorageKey, StorageKeys, TipKeys, allTipKeys } from './storage-keys';

function createFakeSQLiteStorage() {
  const values = new Map<string, string>();

  return {
    getItemSync: (key: string) => values.get(key) ?? null,
    setItemSync: (key: string, value: string) => values.set(key, value),
    removeItemSync: (key: string) => values.delete(key),
    clearSync: () => values.clear()
  };
}

describe('SQLiteStorageService', () => {
  it('stores and reads supported primitive key types', () => {
    const storage = new SQLiteStorageService(createFakeSQLiteStorage());

    storage.set(StorageKeys.themeMode, 'dark');
    storage.set(StorageKeys.notificationsEnabled, true);
    storage.set(StorageKey.number('exampleCount'), 12);

    expect(storage.get(StorageKeys.themeMode)).toBe('dark');
    expect(storage.get(StorageKeys.notificationsEnabled)).toBe(true);
    expect(storage.get(StorageKey.number('exampleCount'))).toBe(12);
  });

  it('removes a single key without clearing others', () => {
    const storage = new SQLiteStorageService(createFakeSQLiteStorage());

    storage.set(StorageKeys.locale, 'gu');
    storage.set(StorageKeys.biometricEnabled, true);
    storage.remove(StorageKeys.locale);

    expect(storage.get(StorageKeys.locale)).toBeUndefined();
    expect(storage.get(StorageKeys.biometricEnabled)).toBe(true);
  });

  it('clears all values from its backing store', () => {
    const storage = new SQLiteStorageService(createFakeSQLiteStorage());

    storage.set(StorageKeys.trialStartDate, '2026-06-07');
    storage.set(TipKeys.home, true);
    storage.clear();

    expect(storage.get(StorageKeys.trialStartDate)).toBeUndefined();
    expect(storage.get(TipKeys.home)).toBeUndefined();
  });
});

describe('storage keys', () => {
  it('keeps every help tip key available as a resettable collection', () => {
    expect(allTipKeys).toEqual([
      TipKeys.credit,
      TipKeys.inventory,
      TipKeys.home,
      TipKeys.transactions
    ]);
  });
});
