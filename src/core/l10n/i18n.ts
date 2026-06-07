import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import en from './en.json';
import gu from './gu.json';

export const SUPPORTED_LOCALES = ['en', 'gu'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

const deviceLocale = Localization.getLocales()[0]?.languageCode ?? 'en';
const defaultLocale: SupportedLocale = SUPPORTED_LOCALES.includes(deviceLocale as SupportedLocale)
  ? (deviceLocale as SupportedLocale)
  : 'en';

const i18n = createInstance();

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, gu: { translation: gu } },
  lng: defaultLocale,
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
});

export default i18n;
