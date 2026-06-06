import { Stack } from 'expo-router';

export default function DebugStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="db" />
    </Stack>
  );
}
