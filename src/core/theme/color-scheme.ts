export interface AppColorScheme {
  readonly background: string;
  readonly surface: string;
  readonly surfaceElevated: string;
  readonly border: string;
  readonly divider: string;
  readonly primary: string;
  readonly primaryLight: string;
  readonly primaryDark: string;
  readonly onPrimary: string;
  readonly textPrimary: string;
  readonly textSecondary: string;
  readonly textDisabled: string;
  readonly danger: string;
  readonly dangerLight: string;
  readonly onDanger: string;
  readonly warning: string;
  readonly warningLight: string;
}

export const lightColors: AppColorScheme = {
  background: '#F8F7F4',
  surface: '#FFFFFF',
  surfaceElevated: '#F0EFEC',
  border: '#E7E5E4',
  divider: '#F5F5F4',
  primary: '#16A34A',
  primaryLight: '#DCFCE7',
  primaryDark: '#15803D',
  onPrimary: '#FFFFFF',
  textPrimary: '#1C1917',
  textSecondary: '#78716C',
  textDisabled: '#A8A29E',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  onDanger: '#FFFFFF',
  warning: '#D97706',
  warningLight: '#FEF3C7'
};

export const darkColors: AppColorScheme = {
  background: '#0F0F0F',
  surface: '#1A1A1A',
  surfaceElevated: '#242424',
  border: '#2E2E2E',
  divider: '#1F1F1F',
  primary: '#22C55E',
  primaryLight: '#052E16',
  primaryDark: '#16A34A',
  onPrimary: '#000000',
  textPrimary: '#F5F5F4',
  textSecondary: '#A8A29E',
  textDisabled: '#57534E',
  danger: '#F87171',
  dangerLight: '#2D0A0A',
  onDanger: '#000000',
  warning: '#FBBF24',
  warningLight: '#3A2602'
};
