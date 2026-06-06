import { useLocalSearchParams } from 'expo-router';

import { RouteStub } from '@/components/route-stub';

export default function EditItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <RouteStub label={`Edit item #${id} (Phase 3)`} />;
}
