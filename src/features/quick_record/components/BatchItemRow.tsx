import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useL10n, localizedItemUnitLabel } from '@/core/l10n/use-l10n';
import { useTheme } from '@/core/theme';
import { formatInr } from '@/core/utils/format';
import { QuantityStepper } from '@/components/QuantityStepper';
import type { Item } from '@/features/inventory/models/item';

interface BatchItemRowProps {
  item: Item;
  isInCart: boolean;
  qty: number;
  onAdd: () => void;
  onRemove: () => void;
  onQtyChanged: (qty: number) => void;
}

export function BatchItemRow({
  item,
  isInCart,
  qty,
  onAdd,
  onRemove,
  onQtyChanged
}: BatchItemRowProps) {
  const { colors, text } = useTheme();
  const l10n = useL10n();

  const outOfStock = item.isOutOfStock;
  const unitLabel = localizedItemUnitLabel(item.unit, l10n);
  const nameFg = outOfStock ? colors.textDisabled : colors.textPrimary;
  const priceFg = outOfStock ? colors.textDisabled : colors.primary;

  return (
    <View
      style={[
        styles.row,
        { backgroundColor: isInCart ? colors.primaryLight : colors.surface }
      ]}
    >
      {/* Left: name + price + stock */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[text.labelMedium, { color: nameFg, flexShrink: 1 }]} numberOfLines={2}>
            {item.name}
          </Text>
          {item.isLowStock && (
            <MaterialIcons
              name="warning"
              size={14}
              color={colors.danger}
              accessibilityElementsHidden
            />
          )}
        </View>
        <View style={styles.priceRow}>
          <MaterialIcons
            name="sell"
            size={13}
            color={priceFg}
            accessibilityElementsHidden
          />
          <Text style={[text.labelSmall, { color: priceFg, marginLeft: 4 }]}>
            ₹{formatInr(item.sellingPrice)} / {unitLabel}
          </Text>
          {!outOfStock && !isInCart && (
            <>
              <MaterialIcons
                name="inventory-2"
                size={13}
                color={colors.textDisabled}
                style={styles.ml8}
                accessibilityElementsHidden
              />
              <Text style={[text.labelSmall, { marginLeft: 4 }]}>
                {item.currentStock} {unitLabel}
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Right: action area */}
      <View style={styles.action}>
        {isInCart ? (
          <>
            <QuantityStepper
              value={qty}
              onChanged={onQtyChanged}
              min={0.5}
              max={item.currentStock > 0 ? item.currentStock : 999}
              editable
            />
            <TouchableOpacity
              onPress={onRemove}
              accessibilityRole="button"
              accessibilityLabel={l10n('removeFromCartSemantic', { itemName: item.name })}
              style={styles.removeBtn}
            >
              <MaterialIcons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </>
        ) : outOfStock ? (
          <View style={[styles.outOfStockBadge, { backgroundColor: colors.dangerLight }]}>
            <Text style={[text.labelSmall, { color: colors.danger }]}>
              {l10n('outOfStock')}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={onAdd}
            accessibilityRole="button"
            accessibilityLabel={l10n('addToCartSemantic', { itemName: item.name })}
            style={[styles.addBtn, { borderColor: colors.primary }]}
          >
            <Text style={[text.labelSmall, { color: colors.primary }]}>
              {l10n('addToCart')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingLeft: 16,
    paddingRight: 4
  },
  info: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  priceRow: { flexDirection: 'row', alignItems: 'center' },
  ml8: { marginLeft: 8 },
  action: { flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
  removeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center'
  },
  addBtn: {
    minWidth: 72,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  outOfStockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 12
  }
});
