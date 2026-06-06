import { useLocalSearchParams } from 'expo-router';

import { RouteStub } from '@/components/route-stub';

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  return <RouteStub label={`Reset password${token ? ` (token: ${token})` : ''} (Phase 7)`} />;
}
