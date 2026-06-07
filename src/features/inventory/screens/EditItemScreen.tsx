import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';

import { useDeps } from '@/core/di/app-dependencies';
import { useL10n } from '@/core/l10n/use-l10n';
import { useTheme } from '@/core/theme';
import { ItemForm } from '@/features/inventory/components/ItemForm';
import type { Item } from '@/features/inventory/models/item';
import { ScreenHeader } from './ScreenHeader';

export const EditItemScreen = observer(function EditItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const deps = useDeps();
  const router = useRouter();
  const l10n = useL10n();
  const { colors, text } = useTheme();
  const itemId = Number(id);
  const item = deps.inventory.items.find((current) => current.id === itemId) ?? null;

  function save(updated: Item) {
    deps.inventory.updateItem(updated);
    router.back();
  }

  if (item === null) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader title={l10n('editItem')} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={text.bodyMedium}>{l10n('itemNotFound')}</Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <ScreenHeader title={l10n('editItem')} />
      <ItemForm initial={item} onSave={save} />
    </>
  );
});
