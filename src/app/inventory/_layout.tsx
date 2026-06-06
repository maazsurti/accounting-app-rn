import { Stack } from 'expo-router';

// Full-screen, outside the tab shell — mirrors the Flutter app's
// inventory/addItem/editItem routes pushed over the home branch.
export default function InventoryStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="add" />
      <Stack.Screen name="edit/[id]" />
    </Stack>
  );
}
