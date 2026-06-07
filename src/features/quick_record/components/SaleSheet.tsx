import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useTheme } from '@/core/theme';
import { useL10n, localizedItemUnitLabel } from '@/core/l10n/use-l10n';
import { formatInr, formatQty } from '@/core/utils/format';
import { AppButton } from '@/components/AppButton';
import { QuantityStepper } from '@/components/QuantityStepper';
import type { Item } from '@/features/inventory/models/item';

interface SaleSheetProps {
  item: Item;
  loadTopQuantities: () => number[];
  onConfirm: (qty: number) => void;
}

export function SaleSheet({ item, loadTopQuantities, onConfirm }: SaleSheetProps) {
  const { colors, text } = useTheme();
  const l10n = useL10n();
  const unitLabel = localizedItemUnitLabel(item.unit, l10n);

  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [topQuantities] = useState<number[]>(() => loadTopQuantities());
  const [activeChip, setActiveChip] = useState<number | null>(null);

  function handleConfirm() {
    setLoading(true);
    onConfirm(quantity);
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[text.headlineSmall, styles.flex]} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={text.bodyMedium}>
          ₹{formatInr(item.sellingPrice)} / {unitLabel}
        </Text>
      </View>

      {/* Quick-quantity chips */}
      {topQuantities.length > 0 && (
        <View style={styles.chips}>
          {topQuantities.map((qty, i) => {
            const isActive = activeChip === i;
            const label = `${formatQty(qty)} ${unitLabel}`;
            return (
              <Pressable
                key={i}
                onPress={() => {
                  setQuantity(qty);
                  setActiveChip(i);
                }}
                accessibilityRole="button"
                accessibilityLabel={l10n('quickQuantityChip', { label })}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isActive ? colors.primary : 'transparent',
                    borderColor: isActive ? colors.primary : colors.border
                  }
                ]}
              >
                <Text
                  style={[
                    text.labelMedium,
                    { color: isActive ? colors.onPrimary : colors.textPrimary }
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Quantity row */}
      <View style={styles.qtyRow}>
        <View style={styles.flex}>
          <View style={styles.labelRow}>
            <MaterialIcons
              name="format-list-numbered"
              size={16}
              color={colors.textPrimary}
              accessibilityElementsHidden
            />
            <Text style={[text.labelMedium, styles.labelText]}>{l10n('quantity')}</Text>
          </View>
          <Text style={text.labelSmall}>
            {l10n('inStockCount', { qty: formatQty(item.currentStock) })}
          </Text>
        </View>
        <QuantityStepper
          value={quantity}
          onChanged={(v) => {
            setQuantity(v);
            setActiveChip(null);
          }}
          max={item.currentStock > 0 ? item.currentStock : 999}
          editable
        />
      </View>

      {/* Total row */}
      <View style={styles.totalRow}>
        <View style={styles.labelRow}>
          <MaterialIcons
            name="receipt-long"
            size={16}
            color={colors.textPrimary}
            accessibilityElementsHidden
          />
          <Text style={[text.labelMedium, styles.labelText]}>{l10n('total')}</Text>
        </View>
        <Text style={[text.numericMedium, { color: colors.primary }]}>
          ₹{formatInr(item.sellingPrice * quantity)}
        </Text>
      </View>

      <AppButton label={l10n('recordSale')} onPress={handleConfirm} isLoading={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 20 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  qtyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  labelText: { marginLeft: 0 }
});
