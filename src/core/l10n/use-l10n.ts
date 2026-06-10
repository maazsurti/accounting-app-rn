import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type en from './en.json';

export type L10nKey = keyof typeof en;
export type L10n = TFunction<'translation'>;

/** Returns the translation function. Use as: `const l10n = useL10n()` → `l10n('key')` or `l10n('key', { param: value })`. */
export function useL10n(): L10n {
  const { t } = useTranslation();
  return t;
}

/** Returns the localized label for an item unit. Call at component level (uses useL10n internally). */
export function localizedItemUnitLabel(unit: string, l10n: L10n): string {
  const key = `unit${unit.charAt(0).toUpperCase()}${unit.slice(1)}` as L10nKey;
  return l10n(key);
}
