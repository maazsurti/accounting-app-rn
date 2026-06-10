import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LayoutAnimation, Pressable, StyleSheet, Text, View } from 'react-native';

import { localizedItemUnitLabel, useL10n } from '@/core/l10n/use-l10n';
import { useTheme } from '@/core/theme';
import { formatInr, formatQty } from '@/core/utils/format';
import type { BatchEntry } from '@/features/transactions/models/transaction-list-entry';
import type { Transaction } from '@/features/quick_record/models/transaction';

interface BatchCardProps {
  entry: BatchEntry;
  isExpanded: boolean;
  selected: boolean;
  partiallySelected: boolean;
  selectionActive: boolean;
  onToggleExpand: () => void;
  onToggleSelect: () => void;
  onItemTap: (tx: Transaction) => void;
}

function formatTime(date: Date): string {
  const hour = date.getHours();
  const minute = String(date.getMinutes()).padStart(2, '0');
  const period = hour < 12 ? 'AM' : 'PM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minute} ${period}`;
}

function headerIcon(
  selectionActive: boolean,
  selected: boolean,
  partiallySelected: boolean
): keyof typeof MaterialIcons.glyphMap {
  if (!selectionActive) return 'receipt-long';
  if (selected) return 'check-circle';
  if (partiallySelected) return 'indeterminate-check-box';
  return 'radio-button-unchecked';
}

export function BatchCard({
  entry,
  isExpanded,
  selected,
  partiallySelected,
  selectionActive,
  onToggleExpand,
  onToggleSelect,
  onItemTap
}: BatchCardProps) {
  const { colors, text } = useTheme();
  const l10n = useL10n();
  const time = formatTime(entry.transactions[0]?.soldAt ?? new Date());
  const hasCustomer = entry.customerName != null && entry.customerName.length > 0;
  const headerLabel = hasCustomer ? entry.customerName! : 'Batch Sale';
  const isSelectedState = selectionActive && selected;
  const isPartialState = selectionActive && partiallySelected;
  const itemCount = entry.transactions.length;

  function handlePress() {
    if (selectionActive) {
      onToggleSelect();
    } else {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      onToggleExpand();
    }
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isSelectedState ? colors.primaryLight : colors.surface,
          borderColor: isSelectedState || isPartialState ? colors.primary : colors.border
        }
      ]}
    >
      <Pressable
        onPress={handlePress}
        onLongPress={onToggleSelect}
        accessibilityRole="button"
        accessibilityLabel={`${headerLabel}, ${itemCount} items, ₹${formatInr(entry.transactions.reduce((s, t) => s + t.revenue, 0))}`}
        accessibilityState={{ selected: isSelectedState, expanded: isExpanded }}
      >
        <View style={styles.header}>
          <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}>
            <MaterialIcons
              name={headerIcon(selectionActive, selected, partiallySelected)}
              size={20}
              color={colors.primary}
            />
          </View>
          <View style={styles.middle}>
            <View style={styles.row}>
              {hasCustomer && (
                <MaterialIcons
                  name="person-outline"
                  size={13}
                  color={colors.textPrimary}
                  style={styles.mr4}
                />
              )}
              <Text style={text.labelMedium} numberOfLines={1}>
                {headerLabel}
              </Text>
            </View>
            <View style={styles.row}>
              <MaterialIcons
                name="add-shopping-cart"
                size={13}
                color={colors.textSecondary}
                style={styles.mr4}
              />
              <Text style={text.labelSmall}>
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </Text>
            </View>
          </View>
          <View style={styles.rightCol}>
            <Text style={[text.labelMedium, { color: colors.primary, fontWeight: '700' }]}>
              ₹{formatInr(entry.transactions.reduce((s, t) => s + t.revenue, 0))}
            </Text>
            <View style={styles.row}>
              <MaterialIcons
                name="access-time"
                size={12}
                color={colors.textSecondary}
                style={styles.mr3}
              />
              <Text style={text.labelSmall}>{time}</Text>
              <MaterialIcons
                name={isExpanded ? 'expand-less' : 'expand-more'}
                size={16}
                color={colors.textSecondary}
                style={styles.ml3}
              />
            </View>
          </View>
        </View>
      </Pressable>
      {isExpanded && (
        <View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {entry.transactions.map((tx) => (
            <BatchItemRow
              key={tx.id ?? tx.itemId}
              transaction={tx}
              onTap={() => onItemTap(tx)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function BatchItemRow({ transaction, onTap }: { transaction: Transaction; onTap: () => void }) {
  const { colors, text } = useTheme();
  const l10n = useL10n();
  const unit = localizedItemUnitLabel(transaction.itemUnit, l10n);

  return (
    <Pressable onPress={onTap} accessibilityRole="button">
      <View style={styles.itemRow}>
        <View style={styles.middle}>
          <Text
            style={[text.labelSmall, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {transaction.itemName}
          </Text>
          <Text style={text.labelSmall}>
            {formatQty(transaction.quantity)} {unit} × ₹{formatInr(transaction.sellingPriceAtTime)}
          </Text>
        </View>
        <Text style={[text.labelSmall, { color: colors.primary, fontWeight: '600' }]}>
          ₹{formatInr(transaction.revenue)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  middle: {
    flex: 1,
    gap: 3
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: 4
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  divider: {
    height: 1
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8
  },
  mr4: { marginRight: 4 },
  mr3: { marginRight: 3 },
  ml3: { marginLeft: 3 }
});
