import { useLocalSearchParams } from 'expo-router';

import { RouteStub } from '@/components/route-stub';

export default function CustomerLedgerScreen() {
  const { customerId } = useLocalSearchParams<{ customerId: string }>();
  return <RouteStub label={`Customer ledger #${customerId} (Phase 5)`} />;
}
