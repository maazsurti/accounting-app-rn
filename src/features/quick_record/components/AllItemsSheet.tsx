import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { observer } from 'mobx-react-lite';

import { useTheme } from '@/core/theme';
import { useL10n, localizedItemUnitLabel } from '@/core/l10n/use-l10n';
import { formatInr } from '@/core/utils/format';
import type { Item } from '@/features/inventory/models/item';
import type { QuickRecordController } from '@/features/quick_record/controllers/QuickRecordController';

interface AllItemsSheetProps {
  controller: QuickRecordController;
  onItemSelected: (item: Item) => void;
}

export const AllItemsSheet = observer(function AllItemsSheet({
  controller,
  onItemSelected
}: AllItemsSheetProps) {
  const { colors, text } = useTheme();
  const l10n = useL10n();
  const [query, setQuery] = useState('');

  useEffect(() => {
    controller.loadAllItems();
  }, [controller]);

  const state = controller.allItemsState;
  const items = controller.allItems;
  const filtered =
    query.trim() === ''
      ? items
      : items.filter((i) => i.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <View style={styles.container}>
      <Text style={text.headlineSmall}>{l10n('recordASale')}</Text>

      {/* Search input */}
      <View style={[styles.searchBox, { backgroundColor: colors.surfaceElevated }]}>
        <MaterialIcons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={l10n('searchItemsHint')}
          placeholderTextColor={colors.textDisabled}
          autoFocus
          style={[text.bodyMedium, styles.searchInput, { color: colors.textPrimary }]}
        />
      </View>

      {/* List */}
      {state.kind === 'loading' ? (
        <ActivityIndicator color={colors.primary} style={styles.center} />
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Text style={[text.bodyMedium, { color: colors.textSecondary }]}>
            {query ? l10n('noItemsMatchSearch') : l10n('noItemsFound')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          style={styles.list}
          ItemSeparatorComponent={() => (
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
          )}
          renderItem={({ item }) => (
            <AllItemRow
              item={item}
              onTap={() => onItemSelected(item)}
              l10n={l10n}
              colors={colors}
              text={text}
            />
          )}
        />
      )}
    </View>
  );
});

function AllItemRow({
  item,
  onTap,
  l10n,
  colors,
  text
}: {
  item: Item;
  onTap: () => void;
  l10n: ReturnType<typeof useL10n>;
  colors: ReturnType<typeof useTheme>['colors'];
  text: ReturnType<typeof useTheme>['text'];
}) {
  const outOfStock = item.isOutOfStock;
  const unitLabel = localizedItemUnitLabel(item.unit, l10n);

  return (
    <TouchableOpacity
      onPress={outOfStock ? undefined : onTap}
      activeOpacity={outOfStock ? 1 : 0.6}
      style={styles.row}
    >
      <View style={styles.rowInfo}>
        <Text
          style={[
            text.labelMedium,
            { color: outOfStock ? colors.textDisabled : colors.textPrimary }
          ]}
        >
          {item.name}
        </Text>
        <Text
          style={[text.labelSmall, { color: outOfStock ? colors.textDisabled : colors.primary }]}
        >
          ₹{formatInr(item.sellingPrice)} / {unitLabel}
        </Text>
      </View>
      {outOfStock ? (
        <Text style={[text.labelSmall, { color: colors.danger }]}>{l10n('outOfStock')}</Text>
      ) : (
        <MaterialIcons name="chevron-right" size={18} color={colors.textDisabled} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8
  },
  searchInput: { flex: 1 },
  list: { maxHeight: 350 },
  divider: { height: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4
  },
  rowInfo: { flex: 1, gap: 2 },
  center: { paddingVertical: 24, alignItems: 'center' }
});
