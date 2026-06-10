import { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, ToastAndroid, Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { observer } from 'mobx-react-lite';

import { useTheme } from '@/core/theme';
import { useL10n, localizedItemUnitLabel } from '@/core/l10n/use-l10n';
import { useDeps } from '@/core/di/app-dependencies';
import { ItemCard } from '@/components/ItemCard';
import { AppBottomSheet } from '@/components/AppBottomSheet';
import { PressScale } from '@/components/PressScale';
import { SaleSheet } from '@/features/quick_record/components/SaleSheet';
import { AllItemsSheet } from '@/features/quick_record/components/AllItemsSheet';
import type { Item } from '@/features/inventory/models/item';

export default observer(function HomeScreen() {
  const { colors, text } = useTheme();
  const l10n = useL10n();
  const deps = useDeps();
  const router = useRouter();

  const controller = deps.quickRecord;
  const loadedRef = useRef(false);

  const [saleItem, setSaleItem] = useState<Item | null>(null);
  const [showAllItems, setShowAllItems] = useState(false);

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      controller.loadFrequentItems();
    }
  }, [controller]);

  function handleSaleConfirm(item: Item, qty: number) {
    setSaleItem(null);
    try {
      const tx = controller.recordSale(item, qty);
      showSnack(l10n('saleRecorded', { itemName: tx.itemName }));
    } catch {
      showSnack(l10n('genericError'));
    }
  }

  function showSnack(msg: string) {
    if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.SHORT);
  }

  const state = controller.frequentState;
  const items = controller.frequentItems;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* App bar */}
      <HomeAppBar
        hasItems={items.length > 0}
        onSearchTap={() => setShowAllItems(true)}
        onCartTap={() => router.push('/batch-sale')}
        l10n={l10n}
        colors={colors}
        text={text}
      />

      {/* Content */}
      {state.kind === 'failed' ? (
        <View style={styles.center}>
          <Text style={[text.bodyMedium, { color: colors.danger }]}>{l10n('genericError')}</Text>
        </View>
      ) : items.length === 0 ? (
        <EmptyState l10n={l10n} colors={colors} text={text} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item }) => (
            <View style={styles.gridCell}>
              <ItemCard
                name={item.name}
                price={item.sellingPrice}
                unit={localizedItemUnitLabel(item.unit, l10n)}
                imagePath={item.imagePath}
                isOutOfStock={item.isOutOfStock}
                onPress={() => setSaleItem(item)}
                stockFraction={
                  item.purchasedQty > 0
                    ? Math.max(0, Math.min(1, item.currentStock / item.purchasedQty))
                    : null
                }
              />
            </View>
          )}
        />
      )}

      {/* Manage items FAB */}
      <PressScale
        style={styles.fab}
        onPress={() => router.push('/inventory')}
        accessibilityRole="button"
        accessibilityLabel={l10n('manageItems')}
      >
        <View style={[styles.fabInner, { backgroundColor: colors.primary }]}>
          <MaterialIcons name="inventory-2" size={20} color={colors.onPrimary} />
          <Text style={[text.labelLarge, { color: colors.onPrimary }]}>{l10n('manageItems')}</Text>
        </View>
      </PressScale>

      {/* Sale sheet */}
      <AppBottomSheet visible={saleItem !== null} onDismiss={() => setSaleItem(null)}>
        {saleItem && (
          <SaleSheet
            item={saleItem}
            loadTopQuantities={() => controller.topQuantitiesFor(saleItem.id!)}
            onConfirm={(qty) => handleSaleConfirm(saleItem, qty)}
          />
        )}
      </AppBottomSheet>

      {/* All-items search sheet */}
      <AppBottomSheet
        visible={showAllItems}
        onDismiss={() => setShowAllItems(false)}
        scrollable={false}
      >
        <AllItemsSheet
          controller={controller}
          onItemSelected={(item) => {
            setShowAllItems(false);
            setSaleItem(item);
          }}
        />
      </AppBottomSheet>
    </View>
  );
});

function HomeAppBar({
  hasItems,
  onSearchTap,
  onCartTap,
  l10n,
  colors,
  text
}: {
  hasItems: boolean;
  onSearchTap: () => void;
  onCartTap: () => void;
  l10n: ReturnType<typeof useL10n>;
  colors: ReturnType<typeof useTheme>['colors'];
  text: ReturnType<typeof useTheme>['text'];
}) {
  const now = new Date();
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ];
  const todayLabel = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <View style={styles.appBar}>
      <View style={styles.appBarLeft}>
        <Text style={text.labelSmall}>{todayLabel}</Text>
        <Text style={text.headlineSmall}>{hasItems ? l10n('quickRecord') : '—'}</Text>
      </View>
      <View style={styles.appBarActions}>
        <PressScale
          onPress={onCartTap}
          accessibilityRole="button"
          accessibilityLabel="Record batch sale"
          style={[styles.iconBtn, { backgroundColor: colors.primaryLight }]}
        >
          <MaterialIcons name="add-shopping-cart" size={22} color={colors.primary} />
        </PressScale>
        <PressScale
          onPress={onSearchTap}
          accessibilityRole="button"
          accessibilityLabel={l10n('searchAllItemsSemantic')}
          style={[styles.iconBtn, { backgroundColor: colors.primaryLight }]}
        >
          <MaterialIcons name="search" size={22} color={colors.primary} />
        </PressScale>
      </View>
    </View>
  );
}

function EmptyState({
  l10n,
  colors,
  text
}: {
  l10n: ReturnType<typeof useL10n>;
  colors: ReturnType<typeof useTheme>['colors'];
  text: ReturnType<typeof useTheme>['text'];
}) {
  return (
    <View style={styles.center}>
      <MaterialIcons name="storefront" size={48} color={colors.textDisabled} />
      <Text style={text.bodyMedium}>{l10n('noItemsYet')}</Text>
      <Text style={text.labelSmall}>{l10n('addItemsHint')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8
  },
  appBarLeft: { flex: 1, gap: 2 },
  appBarActions: { flexDirection: 'row', gap: 10 },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  grid: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 },
  gridRow: { gap: 12, marginBottom: 12 },
  gridCell: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  fab: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center'
  },
  fabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4
  }
});
