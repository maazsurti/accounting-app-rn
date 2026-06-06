import { Stack } from 'expo-router';

export default function CreditStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[customerId]" />
    </Stack>
  );
}
