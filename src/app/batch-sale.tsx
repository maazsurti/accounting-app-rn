import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { observer } from 'mobx-react-lite';
import { runInAction } from 'mobx';

import { useDeps } from '@/core/di/app-dependencies';
import { useL10n } from '@/core/l10n/use-l10n';
import { useTheme } from '@/core/theme';
import { formatInr } from '@/core/utils/format';
import { AppButton } from '@/components/AppButton';
import { PressScale } from '@/components/PressScale';
import { BatchItemRow } from '@/features/quick_record/components/BatchItemRow';
import type { RecentCustomer } from '@/core/db/daos/sale-batch-dao';
import type { Item } from '@/features/inventory/models/item';

export default observer(function BatchSaleScreen() {
  const { colors, text } = useTheme();
  const l10n = useL10n();
  const deps = useDeps();
  const router = useRouter();

  const ctrl = deps.batchSale;
  const loadedRef = useRef(false);

  const [nameFocused, setNameFocused] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      ctrl.loadAllItems();
      ctrl.loadRecentCustomers();
    }
  }, [ctrl]);

  // React to success/failure from confirm()
  const confirmState = ctrl.confirmState;
  useEffect(() => {
    if (confirmState.kind === 'loaded') {
      runInAction(() => {
        ctrl.confirmState = { kind: 'initial' };
      });
      Alert.alert(l10n('batchSaleRecorded'), '', [
        { text: l10n('startNewSale'), style: 'default' },
        { text: 'Done', style: 'cancel', onPress: () => router.back() }
      ]);
    } else if (confirmState.kind === 'failed') {
      runInAction(() => {
        ctrl.confirmState = { kind: 'initial' };
      });
      Alert.alert('', l10n('genericError'));
    }
  }, [confirmState]);

  // Customer name suggestions
  const nameQuery = ctrl.customerName.trim().toLowerCase();
  const nameSuggestions: RecentCustomer[] = nameFocused
    ? ctrl.recentCustomers
        .filter((c) => nameQuery === '' || c.name.toLowerCase().startsWith(nameQuery))
        .slice(0, 5)
    : [];

  // Customer phone suggestions
  const phoneQuery = ctrl.customerPhone.trim();
  const phoneSuggestions: RecentCustomer[] =
    phoneFocused && phoneQuery.length > 0
      ? ctrl.recentCustomers.filter((c) => c.phone.startsWith(phoneQuery)).slice(0, 5)
      : [];

  function selectCustomer(c: RecentCustomer) {
    runInAction(() => {
      ctrl.customerName = c.name;
      ctrl.customerPhone = c.phone;
    });
    setNameFocused(false);
    setPhoneFocused(false);
  }

  const isConfirming = ctrl.confirmState.kind === 'loading';
  const cartCount = ctrl.cartCount;
  const cartTotal = ctrl.cartTotal;
  const filteredItems = ctrl.filteredItems;
  const allItemsLoading = ctrl.allItemsState.kind === 'loading';

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* App bar */}
      <View style={[styles.appBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <PressScale
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backBtn}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
        </PressScale>
        <Text style={[text.headlineSmall, styles.appBarTitle]}>{l10n('batchSale')}</Text>
        {cartCount > 0 && (
          <View style={[styles.cartBadge, { backgroundColor: colors.primaryLight }]}>
            <MaterialIcons name="add-shopping-cart" size={16} color={colors.primary} />
            <Text style={[text.labelMedium, { color: colors.primary, marginLeft: 4 }]}>
              {cartCount}
            </Text>
          </View>
        )}
      </View>

      {/* Customer section */}
      <View style={[styles.customerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.customerHeader}>
          <MaterialIcons name="person-outline" size={16} color={colors.textSecondary} />
          <Text style={[text.labelMedium, { color: colors.textSecondary, marginLeft: 6 }]}>
            {l10n('customerOptional')}
          </Text>
        </View>

        {/* Name field + suggestions */}
        <View style={styles.fieldWrap}>
          <TextInput
            value={ctrl.customerName}
            onChangeText={(t) => {
              ctrl.customerName = t;
            }}
            onFocus={() => setNameFocused(true)}
            onBlur={() => setTimeout(() => setNameFocused(false), 200)}
            placeholder="Name"
            placeholderTextColor={colors.textDisabled}
            returnKeyType="next"
            style={[text.bodyMedium, styles.textInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}
          />
          {nameSuggestions.length > 0 && (
            <CustomerSuggestions
              suggestions={nameSuggestions}
              primaryKey="name"
              subtitleKey="phone"
              onSelect={selectCustomer}
              colors={colors}
              text={text}
            />
          )}
        </View>

        {/* Phone field + suggestions */}
        <View style={styles.fieldWrap}>
          <TextInput
            value={ctrl.customerPhone}
            onChangeText={(t) => {
              ctrl.customerPhone = t;
            }}
            onFocus={() => setPhoneFocused(true)}
            onBlur={() => setTimeout(() => setPhoneFocused(false), 200)}
            placeholder="Phone"
            placeholderTextColor={colors.textDisabled}
            keyboardType="phone-pad"
            returnKeyType="done"
            style={[text.bodyMedium, styles.textInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}
          />
          {phoneSuggestions.length > 0 && (
            <CustomerSuggestions
              suggestions={phoneSuggestions}
              primaryKey="phone"
              subtitleKey="name"
              onSelect={selectCustomer}
              colors={colors}
              text={text}
            />
          )}
        </View>
      </View>

      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.surfaceElevated }]}>
        <MaterialIcons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          value={ctrl.searchQuery}
          onChangeText={(t) => {
            ctrl.searchQuery = t;
          }}
          placeholder={l10n('searchItemsHint')}
          placeholderTextColor={colors.textDisabled}
          style={[text.bodyMedium, styles.searchInput, { color: colors.textPrimary }]}
        />
      </View>

      {/* Item list */}
      {allItemsLoading ? (
        <View style={styles.center}>
          <Text style={[text.labelSmall, { color: colors.textSecondary }]}>Loading…</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item: Item) => String(item.id)}
          renderItem={({ item }: { item: Item }) => (
            <BatchItemRow
              item={item}
              isInCart={ctrl.isInCart(item.id!)}
              qty={ctrl.qtyFor(item.id!)}
              onAdd={() => ctrl.addItem(item)}
              onRemove={() => ctrl.removeItem(item.id!)}
              onQtyChanged={(qty) => ctrl.setQty(item.id!, qty)}
            />
          )}
          ItemSeparatorComponent={() => (
            <View style={{ height: 1, backgroundColor: colors.border }} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[text.bodyMedium, { color: colors.textSecondary }]}>
                {l10n('noItemsMatchSearch')}
              </Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: cartCount > 0 ? 88 : 24 }}
          keyboardShouldPersistTaps="handled"
        />
      )}

      {/* Sticky bottom confirm bar */}
      {cartCount > 0 && (
        <View
          style={[
            styles.bottomBar,
            { backgroundColor: colors.surface, borderTopColor: colors.border }
          ]}
        >
          <View style={styles.bottomLeft}>
            <Text style={text.labelSmall}>
              {cartCount === 1 ? '1 item' : `${cartCount} items`}
            </Text>
            <Text style={[text.numericMedium, { color: colors.primary }]}>
              ₹{formatInr(cartTotal)}
            </Text>
          </View>
          <View style={styles.bottomRight}>
            <AppButton
              label={l10n('recordAllSale')}
              onPress={() => ctrl.confirm()}
              isLoading={isConfirming}
            />
          </View>
        </View>
      )}
    </View>
  );
});

function CustomerSuggestions({
  suggestions,
  primaryKey,
  subtitleKey,
  onSelect,
  colors,
  text
}: {
  suggestions: RecentCustomer[];
  primaryKey: 'name' | 'phone';
  subtitleKey: 'name' | 'phone';
  onSelect: (c: RecentCustomer) => void;
  colors: ReturnType<typeof useTheme>['colors'];
  text: ReturnType<typeof useTheme>['text'];
}) {
  return (
    <View style={[styles.suggestions, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {suggestions.map((c, i) => {
        const primary = c[primaryKey];
        const sub = c[subtitleKey];
        return (
          <TouchableOpacity
            key={i}
            onPress={() => onSelect(c)}
            style={[
              styles.suggestion,
              i < suggestions.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
            ]}
            accessibilityRole="button"
            accessibilityLabel={primary}
          >
            <Text style={text.labelMedium}>{primary}</Text>
            {sub !== '' && (
              <Text style={[text.labelSmall, { color: colors.textSecondary }]}>{sub}</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center'
  },
  appBarTitle: { flex: 1, marginLeft: 4 },
  cartBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20
  },
  customerCard: {
    margin: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10
  },
  customerHeader: { flexDirection: 'row', alignItems: 'center' },
  fieldWrap: { gap: 4 },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12
  },
  suggestions: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  suggestion: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 2
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8
  },
  searchInput: { flex: 1, height: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { paddingVertical: 40, alignItems: 'center' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    gap: 16
  },
  bottomLeft: { flex: 1, gap: 2 },
  bottomRight: { flex: 1 }
});
