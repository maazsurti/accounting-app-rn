import { useRouter } from 'expo-router';

import { ItemForm } from '@/features/inventory/components/ItemForm';
import type { Item } from '@/features/inventory/models/item';
import { useDeps } from '@/core/di/app-dependencies';
import { ScreenHeader } from './ScreenHeader';
import { useL10n } from '@/core/l10n/use-l10n';

export function AddItemScreen() {
  const deps = useDeps();
  const router = useRouter();
  const l10n = useL10n();

  function save(item: Item) {
    deps.inventory.addItem(item);
    router.back();
  }

  return (
    <>
      <ScreenHeader title={l10n('addItem')} />
      <ItemForm onSave={save} />
    </>
  );
}
