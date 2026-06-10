import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { AppBottomSheet } from '@/components/AppBottomSheet';
import { AppButton } from '@/components/AppButton';
import { localizedItemUnitLabel, useL10n } from '@/core/l10n/use-l10n';
import { useTheme } from '@/core/theme';
import { formatQty } from '@/core/utils/format';
import type { TransactionController } from '@/features/transactions/controllers/TransactionController';
import type { Transaction } from '@/features/quick_record/models/transaction';

interface EditTransactionSheetProps {
  transaction: Transaction | null;
  controller: TransactionController;
  onDismiss: () => void;
}

export function EditTransactionSheet({
  transaction,
  controller,
  onDismiss
}: EditTransactionSheetProps) {
  return (
    <AppBottomSheet visible={transaction !== null} onDismiss={onDismiss} scrollable={false}>
      {transaction && (
        <SheetContent transaction={transaction} controller={controller} onDismiss={onDismiss} />
      )}
    </AppBottomSheet>
  );
}

function SheetContent({
  transaction,
  controller,
  onDismiss
}: {
  transaction: Transaction;
  controller: TransactionController;
  onDismiss: () => void;
}) {
  const { colors, text } = useTheme();
  const l10n = useL10n();
  const unit = localizedItemUnitLabel(transaction.itemUnit, l10n);
  const [loading, setLoading] = useState(false);
  const qtyRef = useRef(formatQty(transaction.quantity));
  const priceRef = useRef(String(transaction.sellingPriceAtTime.toFixed(2)));
  const [qty, setQty] = useState(qtyRef.current);
  const [price, setPrice] = useState(priceRef.current);

  async function onSave() {
    const qtyVal = parseFloat(qty.trim());
    const priceVal = parseFloat(price.trim());
    if (!qtyVal || qtyVal <= 0 || !priceVal || priceVal <= 0) {
      Alert.alert('', l10n('enterValidPrice'));
      return;
    }
    setLoading(true);
    try {
      controller.editTransaction(transaction, { newQuantity: qtyVal, newSellingPrice: priceVal });
      onDismiss();
    } catch {
      Alert.alert('', l10n('genericError'));
    } finally {
      setLoading(false);
    }
  }

  function onDelete() {
    Alert.alert(l10n('deleteSaleTitle'), l10n('deleteSaleBody'), [
      { text: l10n('cancel'), style: 'cancel' },
      {
        text: l10n('delete'),
        style: 'destructive',
        onPress: () => {
          setLoading(true);
          try {
            controller.deleteTransaction(transaction);
            onDismiss();
          } catch {
            Alert.alert('', l10n('genericError'));
          } finally {
            setLoading(false);
          }
        }
      }
    ]);
  }

  return (
    <View style={styles.content}>
      <View style={[styles.handle, { backgroundColor: colors.border }]} />
      <Text style={text.headlineSmall}>{l10n('editSale')}</Text>
      <Text style={[text.bodyMedium, { color: colors.textSecondary }]}>{transaction.itemName}</Text>
      <View style={styles.fields}>
        <View style={styles.fieldCol}>
          <View style={styles.labelRow}>
            <MaterialIcons
              name="format-list-numbered"
              size={14}
              color={colors.textSecondary}
              style={styles.labelIcon}
            />
            <Text style={text.labelSmall}>{l10n('quantity')}</Text>
          </View>
          <TextInput
            style={[
              styles.input,
              text.bodyMedium,
              { borderColor: colors.border, color: colors.textPrimary }
            ]}
            value={qty}
            onChangeText={setQty}
            keyboardType="decimal-pad"
            returnKeyType="done"
          />
          <Text style={[text.labelSmall, { color: colors.textSecondary }]}>{unit}</Text>
        </View>
        <View style={styles.fieldCol}>
          <View style={styles.labelRow}>
            <MaterialIcons
              name="sell"
              size={14}
              color={colors.textSecondary}
              style={styles.labelIcon}
            />
            <Text style={text.labelSmall}>{l10n('sellingPrice')}</Text>
          </View>
          <TextInput
            style={[
              styles.input,
              text.bodyMedium,
              { borderColor: colors.border, color: colors.textPrimary }
            ]}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            returnKeyType="done"
          />
          <Text style={[text.labelSmall, { color: colors.textSecondary }]}>₹ / {unit}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <View style={styles.actionBtn}>
          <TouchableOpacity
            onPress={onDelete}
            disabled={loading}
            style={[styles.deleteBtn, { borderColor: colors.danger }]}
            accessibilityRole="button"
            accessibilityLabel={l10n('delete')}
          >
            <MaterialIcons name="delete-outline" size={16} color={colors.danger} />
            <Text style={[text.labelMedium, { color: colors.danger, marginLeft: 6 }]}>
              {l10n('delete')}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.actionBtn}>
          <AppButton
            label={l10n('saveChanges')}
            onPress={onSave}
            isLoading={loading}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center'
  },
  fields: {
    flexDirection: 'row',
    gap: 12
  },
  fieldCol: {
    flex: 1,
    gap: 6
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  labelIcon: {
    marginRight: 5
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4
  },
  actionBtn: {
    flex: 1
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderWidth: 1.5,
    borderRadius: 12
  }
});
