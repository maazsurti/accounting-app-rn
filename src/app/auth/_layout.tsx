import { Stack } from 'expo-router';

export default function AuthStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password/index" />
      <Stack.Screen name="forgot-password/reset-password" />
    </Stack>
  );
}
