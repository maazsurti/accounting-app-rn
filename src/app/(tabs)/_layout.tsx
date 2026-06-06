import { Tabs } from 'expo-router';

// 4-tab shell mirroring the Flutter app's StatefulShellRoute.indexedStack
// branches: Home / Transactions / Credit / Settings (see app_routes.dart).
export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="transactions" options={{ title: 'Transactions' }} />
      <Tabs.Screen name="credit" options={{ title: 'Credit' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
