import '@/core/l10n/i18n'; // initialise i18next before any component renders

import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import {
  AppDependenciesProvider,
  createAppDependencies,
  type AppDependencies
} from '@/core/di/app-dependencies';
import { AppThemeProvider, useTheme } from '@/core/theme';
import { AppTopSafeArea } from '@/core/safe-area/AppTopSafeArea';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [deps, setDeps] = useState<AppDependencies | null>(null);

  const [fontsLoaded] = useFonts({
    'HindVadodara-Regular': require('../../assets/fonts/HindVadodara-Regular.ttf'),
    'HindVadodara-Medium': require('../../assets/fonts/HindVadodara-Medium.ttf'),
    'HindVadodara-SemiBold': require('../../assets/fonts/HindVadodara-SemiBold.ttf'),
    'HindVadodara-Bold': require('../../assets/fonts/HindVadodara-Bold.ttf')
  });

  useEffect(() => {
    createAppDependencies()
      .then((d) => setDeps(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (fontsLoaded && deps !== null) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, deps]);

  if (!fontsLoaded || deps === null) return null;

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <AppDependenciesProvider deps={deps}>
          <AppThemeProvider controller={deps.themeController}>
            <BottomSheetModalProvider>
              <RootStack />
            </BottomSheetModalProvider>
          </AppThemeProvider>
        </AppDependenciesProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootStack() {
  const { colors } = useTheme();
  return (
    <AppTopSafeArea backgroundColor={colors.background}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="inventory" />
        <Stack.Screen name="batch-sale" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="debug" />
        <Stack.Screen name="lock" />
      </Stack>
    </AppTopSafeArea>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 }
});
