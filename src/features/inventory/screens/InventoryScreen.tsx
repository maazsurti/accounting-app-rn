import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetBackdropProps
} from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { reaction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useCallback, useLayoutEffect, useRef } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { PressScale } from '@/components/PressScale';
import { useDeps } from '@/core/di/app-dependencies';
import { localizedItemUnitLabel, useL10n } from '@/core/l10n/use-l10n';
import { useTheme } from '@/core/theme';
import { formatInr, formatQty } from '@/core/utils/format';
import type {
  InventoryController,
  RestockFieldError
} from '@/features/inventory/controllers/InventoryController';
import type { Item } from '@/features/inventory/models/item';
import { ScreenHeader } from './ScreenHeader';

export const InventoryScreen = observer(function InventoryScreen() {
  const deps = useDeps();
  const controller = deps.inventory;
  const router = useRouter();
  const l10n = useL10n();
  const { colors, text } = useTheme();
  const restockSheetRef = useRef<BottomSheet>(null);

  useLayoutEffect(() => {
    controller.load();
  }, [controller]);

  useLayoutEffect(() => {
    return reaction(
      () => controller.restockItemId,
      (id) => {
        if (id !== null) restockSheetRef.current?.expand();
        else restockSheetRef.current?.close();
      }
    );
  }, [controller]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.32}
        pressBehavior="close"
      />
    ),
    []
  );

  const allItems = controller.items;
  const lowStockItems = controller.displayedLowStockItems;
  const visibleItems = controller.visibleItems;
  const totalValue = controller.totalStockValue;

  function confirmDelete(item: Item) {
    Alert.alert(l10n('deleteItemTitle'), l10n('deleteItemBody', { itemName: item.name }), [
      { text: l10n('cancel'), style: 'cancel' },
      { text: l10n('delete'), style: 'destructive', onPress: () => controller.deleteItem(item.id!) }
    ]);
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader title={l10n('inventory')} />
      <SearchBar
        value={controller.searchQuery}
        onChangeText={(value) => controller.setSearchQuery(value)}
        onClear={() => controller.clearSearchQuery()}
      />
      {allItems.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={visibleItems}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <MetricsBar
              totalItems={allItems.length}
              lowStockItems={lowStockItems}
              totalValue={totalValue}
            />
          }
          ListEmptyComponent={<NoResultsState />}
          renderItem={({ item }) => (
            <InventoryItemTile
              item={item}
              onToggleStar={() => controller.toggleStar(item)}
              onRestock={() => controller.openRestockSheet(item)}
              onEdit={() =>
                router.push({ pathname: '/inventory/edit/[id]', params: { id: String(item.id) } })
              }
              onDelete={() => confirmDelete(item)}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      <PressScale
        style={styles.fab}
        onPress={() => router.push('/inventory/add')}
        accessibilityRole="button"
        accessibilityLabel={l10n('addItem')}
      >
        <View style={[styles.fabInner, { backgroundColor: colors.primary }]}>
          <MaterialIcons name="add" size={22} color={colors.onPrimary} />
          <Text style={[text.labelLarge, { color: colors.onPrimary }]}>{l10n('addItem')}</Text>
        </View>
      </PressScale>

      <BottomSheet
        ref={restockSheetRef}
        index={-1}
        snapPoints={['55%']}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        onClose={() => controller.closeRestockSheet()}
      >
        <BottomSheetView style={styles.restockSheetWrap}>
          {controller.selectedRestockItem && <RestockSheet controller={controller} />}
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
});

function SearchBar({
  value,
  onChangeText,
  onClear
}: {
  value: string;
  onChangeText: (value: string) => void;
  onClear: () => void;
}) {
  const l10n = useL10n();
  const { colors, text } = useTheme();
  return (
    <View style={[styles.searchWrap, { backgroundColor: colors.surface }]}>
      <View style={[styles.searchBox, { backgroundColor: colors.surfaceElevated }]}>
        <MaterialIcons
          name="search"
          size={22}
          color={colors.textSecondary}
          accessibilityElementsHidden
        />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={l10n('searchItemsHint')}
          placeholderTextColor={colors.textDisabled}
          accessibilityLabel={l10n('searchItemsHint')}
          style={[styles.searchInput, text.bodyMedium, { color: colors.textPrimary }]}
        />
        {value !== '' && (
          <Pressable
            onPress={onClear}
            accessibilityRole="button"
            accessibilityLabel={l10n('cancel')}
            style={styles.clearButton}
          >
            <MaterialIcons name="close" size={20} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

function MetricsBar({
  totalItems,
  lowStockItems,
  totalValue
}: {
  totalItems: number;
  lowStockItems: Item[];
  totalValue: number;
}) {
  const l10n = useL10n();
  return (
    <View style={styles.metricsGrid}>
      <MetricCard
        icon="inventory-2"
        label={l10n('inventoryItemsLabel')}
        value={String(totalItems)}
      />
      <MetricCard
        icon="receipt-long"
        label={l10n('inventoryStockValue')}
        value={`₹${formatInr(totalValue)}`}
      />
      <MetricCard
        icon="warning-amber"
        label={l10n('lowStock')}
        value={String(lowStockItems.length)}
        danger={lowStockItems.length > 0}
      />
    </View>
  );
}

function MetricCard({
  icon,
  label,
  value,
  danger = false
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string;
  danger?: boolean;
}) {
  const { colors, text } = useTheme();
  const color = danger ? colors.danger : colors.primary;
  return (
    <View
      style={[
        styles.metricCard,
        { backgroundColor: danger ? colors.dangerLight : colors.surfaceElevated }
      ]}
    >
      <View style={styles.labelRow}>
        <MaterialIcons
          name={icon}
          size={14}
          color={colors.textSecondary}
          accessibilityElementsHidden
        />
        <Text style={text.labelSmall} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text style={[text.numericMedium, { color }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function InventoryItemTile({
  item,
  onToggleStar,
  onRestock,
  onEdit,
  onDelete
}: {
  item: Item;
  onToggleStar: () => void;
  onRestock: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const l10n = useL10n();
  const { colors, text } = useTheme();
  const unitLabel = localizedItemUnitLabel(item.unit, l10n);
  const stockColor = item.isOutOfStock
    ? colors.danger
    : item.isLowStock
      ? colors.warning
      : colors.primary;
  const stockLabel = item.isOutOfStock
    ? l10n('outOfStock')
    : item.isLowStock
      ? l10n('stockBadgeLow', { qty: formatQty(item.currentStock), unit: unitLabel })
      : l10n('stockBadgeInStock', { qty: formatQty(item.currentStock), unit: unitLabel });

  return (
    <View style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.tileTop}>
        <Pressable
          onPress={onToggleStar}
          accessibilityRole="button"
          accessibilityLabel={l10n(item.isStarred ? 'unpinItem' : 'pinItem', {
            itemName: item.name
          })}
          style={styles.starButton}
        >
          <MaterialIcons
            name={item.isStarred ? 'star' : 'star-outline'}
            size={28}
            color={item.isStarred ? colors.warning : colors.textDisabled}
          />
        </Pressable>
        <View style={styles.tileBody}>
          <Text style={text.labelLarge} numberOfLines={2}>
            {item.name}
          </Text>
          <View
            style={[
              styles.stockBadge,
              { backgroundColor: item.isLowStock ? colors.warningLight : colors.primaryLight }
            ]}
          >
            <MaterialIcons
              name={
                item.isOutOfStock
                  ? 'remove-circle-outline'
                  : item.isLowStock
                    ? 'warning-amber'
                    : 'inventory-2'
              }
              size={14}
              color={stockColor}
              accessibilityElementsHidden
            />
            <Text style={[text.labelSmall, { color: stockColor }]}>{stockLabel}</Text>
          </View>
          <View style={styles.labelRow}>
            <MaterialIcons
              name="sell"
              size={14}
              color={colors.primary}
              accessibilityElementsHidden
            />
            <Text style={[text.labelMedium, { color: colors.primary }]}>
              ₹{formatInr(item.sellingPrice)} / {unitLabel}
            </Text>
          </View>
          <View style={styles.labelRow}>
            <MaterialIcons
              name="shopping-cart"
              size={14}
              color={colors.textSecondary}
              accessibilityElementsHidden
            />
            <Text style={text.labelSmall}>
              {l10n('costPriceLine', { amount: formatInr(item.costPerUnit), unit: unitLabel })}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.tileActions}>
        <View style={styles.actionButton}>
          <AppButton
            label={l10n('restock')}
            icon="inventory-2"
            variant="ghost"
            onPress={onRestock}
          />
        </View>
        <View style={styles.actionButton}>
          <AppButton label={l10n('edit')} icon="edit" variant="ghost" onPress={onEdit} />
        </View>
        <View style={styles.actionButton}>
          <AppButton
            label={l10n('delete')}
            icon="delete-outline"
            variant="destructive"
            onPress={onDelete}
          />
        </View>
      </View>
    </View>
  );
}

const RestockSheet = observer(function RestockSheet({
  controller
}: {
  controller: InventoryController;
}) {
  const l10n = useL10n();
  const { colors, text } = useTheme();
  const item = controller.selectedRestockItem;
  if (item === null) return null;
  const unitLabel = localizedItemUnitLabel(item.unit, l10n);
  const newLotCost = controller.restockNewLotCost;

  return (
    <View style={styles.restockSheet}>
      <Text style={text.headlineSmall}>{l10n('restockItemTitle', { itemName: item.name })}</Text>
      <Text style={text.bodyMedium}>
        {l10n('currentStockValue', { qty: formatQty(item.currentStock), unit: unitLabel })}
      </Text>
      <SheetField
        label={l10n('quantityAdded')}
        value={controller.restockQuantityText}
        error={localizeRestockError(controller.restockQuantityError, l10n)}
        onChangeText={(value) => controller.setRestockQuantityText(value)}
      />
      <SheetField
        label={l10n('totalCostRupees')}
        value={controller.restockTotalCostText}
        error={localizeRestockError(controller.restockCostError, l10n)}
        onChangeText={(value) => controller.setRestockTotalCostText(value)}
      />
      {newLotCost > 0 && (
        <Text style={[text.labelSmall, { color: colors.primary }]}>
          {l10n('newLotCost', { amount: formatInr(newLotCost), unit: unitLabel })}
        </Text>
      )}
      <AppButton
        label={l10n('saveRestock')}
        icon="check"
        onPress={() => controller.submitRestock()}
      />
    </View>
  );
});

function localizeRestockError(
  error: RestockFieldError | null,
  l10n: ReturnType<typeof useL10n>
): string | null {
  return error === null ? null : l10n(error);
}

function SheetField({
  label,
  value,
  error,
  onChangeText
}: {
  label: string;
  value: string;
  error: string | null;
  onChangeText: (value: string) => void;
}) {
  const { colors, text } = useTheme();
  return (
    <View style={styles.sheetField}>
      <Text style={text.labelMedium}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        accessibilityLabel={label}
        style={[
          styles.sheetInput,
          text.bodyMedium,
          { color: colors.textPrimary, borderColor: error ? colors.danger : colors.border }
        ]}
      />
      {error && <Text style={[text.labelSmall, { color: colors.danger }]}>{error}</Text>}
    </View>
  );
}

function EmptyState() {
  const l10n = useL10n();
  const { colors, text } = useTheme();
  return (
    <View style={styles.center}>
      <MaterialIcons name="storefront" size={48} color={colors.textDisabled} />
      <Text style={text.bodyMedium}>{l10n('noItemsInInventory')}</Text>
      <Text style={text.labelSmall}>{l10n('addFirstItemHint')}</Text>
    </View>
  );
}

function NoResultsState() {
  const l10n = useL10n();
  const { colors, text } = useTheme();
  return (
    <View style={styles.noResults}>
      <MaterialIcons name="search-off" size={36} color={colors.textDisabled} />
      <Text style={text.bodyMedium}>{l10n('noItemsMatchSearch')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  searchWrap: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14 },
  searchBox: {
    minHeight: 52,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  searchInput: { flex: 1, minHeight: 48 },
  clearButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16, paddingBottom: 110 },
  metricsGrid: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  metricCard: {
    flex: 1,
    minHeight: 72,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  separator: { height: 10 },
  tile: { borderWidth: 1, borderRadius: 8, padding: 14, gap: 12 },
  tileTop: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  starButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  tileBody: { flex: 1, gap: 7 },
  stockBadge: {
    alignSelf: 'flex-start',
    minHeight: 28,
    borderRadius: 8,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  tileActions: { flexDirection: 'row', gap: 8 },
  actionButton: { flex: 1 },
  fab: { position: 'absolute', bottom: 24, alignSelf: 'center' },
  fabInner: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    borderRadius: 28
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  noResults: { alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  restockSheetWrap: { flex: 1, padding: 24 },
  restockSheet: { gap: 16 },
  sheetField: { gap: 8 },
  sheetInput: { minHeight: 52, borderWidth: 1, borderRadius: 8, paddingHorizontal: 14 }
});
