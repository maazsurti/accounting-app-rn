export enum StorageValueKind {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean'
}

export class StorageKey<T extends string | number | boolean> {
  private readonly valueBrand?: T;

  private constructor(
    readonly name: string,
    readonly kind: StorageValueKind
  ) {}

  static string(name: string): StorageKey<string> {
    return new StorageKey<string>(name, StorageValueKind.String);
  }

  static number(name: string): StorageKey<number> {
    return new StorageKey<number>(name, StorageValueKind.Number);
  }

  static boolean(name: string): StorageKey<boolean> {
    return new StorageKey<boolean>(name, StorageValueKind.Boolean);
  }
}

export const StorageKeys = {
  themeMode: StorageKey.string('themeMode'),
  trialStartDate: StorageKey.string('trialStartDate'),
  trialLastSeenDate: StorageKey.string('trialLastSeenDate'),
  hasCompletedOnboarding: StorageKey.boolean('hasCompletedOnboarding'),
  notificationsEnabled: StorageKey.boolean('notificationsEnabled'),
  biometricEnabled: StorageKey.boolean('biometricEnabled'),
  locale: StorageKey.string('locale')
} as const;

export const TipKeys = {
  credit: StorageKey.boolean('tip_credit'),
  inventory: StorageKey.boolean('tip_inventory'),
  home: StorageKey.boolean('tip_home'),
  transactions: StorageKey.boolean('tip_transactions')
} as const;

export const allTipKeys = [
  TipKeys.credit,
  TipKeys.inventory,
  TipKeys.home,
  TipKeys.transactions
] as const;
