import type { TextStyle } from 'react-native';

import type { AppColorScheme } from './color-scheme';

// Flutter fontWeight → Hind Vadodara font file mapping
const FONT_REGULAR = 'HindVadodara-Regular'; // w400
const FONT_MEDIUM = 'HindVadodara-Medium'; // w500
const FONT_SEMIBOLD = 'HindVadodara-SemiBold'; // w600
const FONT_BOLD = 'HindVadodara-Bold'; // w700

export interface AppTextStyles {
  readonly displayLarge: TextStyle;
  readonly headlineMedium: TextStyle;
  readonly headlineSmall: TextStyle;
  readonly bodyLarge: TextStyle;
  readonly bodyMedium: TextStyle;
  readonly labelLarge: TextStyle;
  readonly labelMedium: TextStyle;
  readonly labelSmall: TextStyle;
  readonly numericLarge: TextStyle;
  readonly numericMedium: TextStyle;
}

// fontScale comes from useWindowDimensions().fontScale — never hardcoded.
export function createTextStyles(colors: AppColorScheme, fontScale: number): AppTextStyles {
  const s = (base: number) => base * fontScale;

  return {
    displayLarge: {
      color: colors.textPrimary,
      fontSize: s(32),
      fontFamily: FONT_BOLD,
      lineHeight: s(32) * 1.2,
      letterSpacing: -0.5
    },
    headlineMedium: {
      color: colors.textPrimary,
      fontSize: s(22),
      fontFamily: FONT_BOLD,
      lineHeight: s(22) * 1.3
    },
    headlineSmall: {
      color: colors.textPrimary,
      fontSize: s(18),
      fontFamily: FONT_SEMIBOLD,
      lineHeight: s(18) * 1.3
    },
    bodyLarge: {
      color: colors.textPrimary,
      fontSize: s(17),
      fontFamily: FONT_REGULAR,
      lineHeight: s(17) * 1.5
    },
    bodyMedium: {
      color: colors.textSecondary,
      fontSize: s(16),
      fontFamily: FONT_REGULAR,
      lineHeight: s(16) * 1.5
    },
    labelLarge: {
      color: colors.textPrimary,
      fontSize: s(17),
      fontFamily: FONT_SEMIBOLD,
      lineHeight: s(17) * 1.2
    },
    labelMedium: {
      color: colors.textPrimary,
      fontSize: s(16),
      fontFamily: FONT_SEMIBOLD,
      lineHeight: s(16) * 1.2
    },
    labelSmall: {
      color: colors.textSecondary,
      fontSize: s(14),
      fontFamily: FONT_MEDIUM,
      lineHeight: s(14) * 1.2
    },
    numericLarge: {
      color: colors.textPrimary,
      fontSize: s(28),
      fontFamily: FONT_BOLD,
      lineHeight: s(28) * 1.1,
      letterSpacing: -0.5
    },
    numericMedium: {
      color: colors.textPrimary,
      fontSize: s(20),
      fontFamily: FONT_SEMIBOLD,
      lineHeight: s(20) * 1.1,
      letterSpacing: -0.3
    }
  };
}
