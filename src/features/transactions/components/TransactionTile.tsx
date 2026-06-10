import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { localizedItemUnitLabel, useL10n } from '@/core/l10n/use-l10n';
import { useTheme } from '@/core/theme';
import { formatInr, formatQty } from '@/core/utils/format';
import type { Transaction } from '@/features/quick_record/models/transaction';

interface TransactionTileProps {
  transaction: Transaction;
  selected: boolean;
  selectionActive: boolean;
  isDeleting?: boolean;
  onTap: () => void;
  onLongPress: () => void;
}

function formatTime(date: Date): string {
  const hour = date.getHours();
  const minute = String(date.getMinutes()).padStart(2, '0');
  const period = hour < 12 ? 'AM' : 'PM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minute} ${period}`;
}

export function TransactionTile({
  transaction,
  selected,
  selectionActive,
  isDeleting = false,
  onTap,
  onLongPress
}: TransactionTileProps) {
  const { colors, text } = useTheme();
  const l10n = useL10n();
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isDeleting) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.88, duration: 200, useNativeDriver: true })
      ]).start();
    }
  }, [isDeleting, opacity, scale]);

  const time = formatTime(transaction.soldAt);
  const unit = localizedItemUnitLabel(transaction.itemUnit, l10n);
  const iconName: keyof typeof MaterialIcons.glyphMap = selectionActive
    ? selected
      ? 'check-circle'
      : 'radio-button-unchecked'
    : 'sell';

  return (
    <Animated.View style={{ opacity, transform: [{ scale }] }}>
      <Pressable
        onPress={onTap}
        onLongPress={onLongPress}
        accessibilityRole="button"
        accessibilityLabel={`${transaction.itemName}, ₹${formatInr(transaction.revenue)}`}
        accessibilityState={{ selected }}
      >
        <View
          style={[
            styles.tile,
            {
              backgroundColor: selected ? colors.primaryLight : colors.surface,
              borderColor: selected ? colors.primary : colors.border
            }
          ]}
        >
          <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}>
            <MaterialIcons name={iconName} size={20} color={colors.primary} />
          </View>
          <View style={styles.middle}>
            <Text style={text.labelMedium} numberOfLines={1}>
              {transaction.itemName}
            </Text>
            <View style={styles.row}>
              <MaterialIcons name="receipt" size={13} color={colors.textSecondary} />
              <Text style={[text.labelSmall, styles.ml4]} numberOfLines={1}>
                {formatQty(transaction.quantity)} {unit} × ₹{formatInr(transaction.sellingPriceAtTime)}
              </Text>
            </View>
          </View>
          <View style={styles.right}>
            <Text style={[text.labelMedium, { color: colors.primary, fontWeight: '700' }]}>
              ₹{formatInr(transaction.revenue)}
            </Text>
            <View style={styles.row}>
              <MaterialIcons name="access-time" size={12} color={colors.textSecondary} />
              <Text style={[text.labelSmall, styles.ml3]}>{time}</Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
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
  right: {
    alignItems: 'flex-end',
    gap: 4
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  ml4: { marginLeft: 4 },
  ml3: { marginLeft: 3 }
});
