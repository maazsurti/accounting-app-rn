import { createContext, useContext, type ReactNode } from 'react';
import { useColorScheme, useWindowDimensions } from 'react-native';
import { observer } from 'mobx-react-lite';

import type { AppColorScheme } from './color-scheme';
import { lightColors, darkColors } from './color-scheme';
import { type AppTextStyles, createTextStyles } from './text-styles';
import type { AppThemeController } from './theme-controller';

export interface AppThemeData {
  readonly colors: AppColorScheme;
  readonly text: AppTextStyles;
  readonly brightness: 'light' | 'dark';
}

const AppThemeContext = createContext<AppThemeData | null>(null);

// observer() so MobX re-renders when themeController.mode changes.
// useWindowDimensions() re-renders when OS font scale changes (dynamic type).
// useColorScheme() re-renders when OS light/dark preference changes.
export const AppThemeProvider = observer(function AppThemeProvider({
  controller,
  children
}: {
  controller: AppThemeController;
  children: ReactNode;
}) {
  const osScheme = useColorScheme() ?? 'light';
  const { fontScale } = useWindowDimensions();

  const isDark =
    controller.mode === 'dark' || (controller.mode === 'system' && osScheme === 'dark');

  const colors: AppColorScheme = isDark ? darkColors : lightColors;
  const brightness: 'light' | 'dark' = isDark ? 'dark' : 'light';
  const text = createTextStyles(colors, fontScale);

  return (
    <AppThemeContext.Provider value={{ colors, text, brightness }}>
      {children}
    </AppThemeContext.Provider>
  );
});

export function useTheme(): AppThemeData {
  const theme = useContext(AppThemeContext);
  if (theme === null) {
    throw new Error('useTheme() called outside an AppThemeProvider');
  }
  return theme;
}
