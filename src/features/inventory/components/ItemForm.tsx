import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { AppButton } from '@/components/AppButton';
import { useL10n, localizedItemUnitLabel } from '@/core/l10n/use-l10n';
import { useTheme } from '@/core/theme';
import { formatInr } from '@/core/utils/format';
import { Item, ITEM_UNITS, type ItemUnit } from '@/features/inventory/models/item';

interface ItemFormProps {
  initial?: Item | null;
  onSave: (item: Item) => void;
}

type FieldName = 'name' | 'sellingPrice' | 'totalPurchasePrice' | 'purchasedQty';

function formatInput(value: number): string {
  return value === Math.trunc(value) ? String(value) : value.toFixed(2);
}

export function ItemForm({ initial = null, onSave }: ItemFormProps) {
  const { colors, text } = useTheme();
  const l10n = useL10n();
  const [name, setName] = useState(initial?.name ?? '');
  const [unit, setUnit] = useState<ItemUnit>(initial?.unit ?? 'piece');
  const [sellingPrice, setSellingPrice] = useState(
    initial ? formatInput(initial.sellingPrice) : ''
  );
  const [totalPurchasePrice, setTotalPurchasePrice] = useState(
    initial ? formatInput(initial.totalPurchasePrice) : ''
  );
  const [purchasedQty, setPurchasedQty] = useState(
    initial ? formatInput(initial.purchasedQty) : ''
  );
  const [lowStockThreshold, setLowStockThreshold] = useState(
    initial?.lowStockThreshold != null ? formatInput(initial.lowStockThreshold) : ''
  );
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [isSaving, setIsSaving] = useState(false);

  const unitLabel = localizedItemUnitLabel(unit, l10n);
  const derivedCostPerUnit = useMemo(() => {
    const cost = Number(totalPurchasePrice);
    const qty = Number(purchasedQty);
    return Number.isFinite(cost) && Number.isFinite(qty) && qty > 0 ? cost / qty : 0;
  }, [totalPurchasePrice, purchasedQty]);

  function clearError(field: FieldName) {
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function submit() {
    const nextErrors: Partial<Record<FieldName, string>> = {};
    const parsedSellingPrice = Number(sellingPrice);
    const parsedTotalPurchasePrice = Number(totalPurchasePrice);
    const parsedPurchasedQty = Number(purchasedQty);
    const parsedLowStockThreshold =
      lowStockThreshold.trim() === '' ? null : Number(lowStockThreshold);

    if (name.trim() === '') nextErrors.name = l10n('fieldRequired');
    if (!Number.isFinite(parsedSellingPrice)) nextErrors.sellingPrice = l10n('enterValidPrice');
    if (!Number.isFinite(parsedTotalPurchasePrice) || parsedTotalPurchasePrice < 0) {
      nextErrors.totalPurchasePrice = l10n('enterValidAmount');
    }
    if (!Number.isFinite(parsedPurchasedQty) || parsedPurchasedQty <= 0) {
      nextErrors.purchasedQty = l10n('enterQtyAboveZero');
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSaving(true);
    onSave(
      new Item({
        id: initial?.id,
        name: name.trim(),
        sellingPrice: parsedSellingPrice,
        totalPurchasePrice: parsedTotalPurchasePrice,
        purchasedQty: parsedPurchasedQty,
        currentStock: initial?.currentStock ?? parsedPurchasedQty,
        imagePath: initial?.imagePath ?? null,
        lowStockThreshold:
          parsedLowStockThreshold != null && Number.isFinite(parsedLowStockThreshold)
            ? parsedLowStockThreshold
            : null,
        unit,
        createdAt: initial?.createdAt ?? new Date(),
        updatedAt: initial?.updatedAt ?? null,
        deletedAt: initial?.deletedAt ?? null,
        isStarred: initial?.isStarred ?? false
      })
    );
    setIsSaving(false);
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <View
          style={[
            styles.photoBox,
            { backgroundColor: colors.surfaceElevated, borderColor: colors.border }
          ]}
        >
          <MaterialIcons name="add-photo-alternate" size={32} color={colors.textSecondary} />
          <Text style={text.labelSmall}>{l10n('photoOptional')}</Text>
        </View>

        <FormField
          label={l10n('itemName')}
          icon="inventory-2"
          value={name}
          placeholder={l10n('itemNameHint')}
          error={errors.name}
          onChangeText={(value) => {
            setName(value);
            clearError('name');
          }}
        />

        <View style={styles.group}>
          <Label icon="straighten" label={l10n('unit')} />
          <View style={styles.unitWrap}>
            {ITEM_UNITS.map((nextUnit) => {
              const selected = nextUnit === unit;
              return (
                <Pressable
                  key={nextUnit}
                  onPress={() => setUnit(nextUnit)}
                  accessibilityRole="button"
                  accessibilityLabel={`${l10n('unit')}: ${localizedItemUnitLabel(nextUnit, l10n)}`}
                  accessibilityState={{ selected }}
                  style={[
                    styles.unitChip,
                    {
                      backgroundColor: selected ? colors.primaryLight : colors.surface,
                      borderColor: selected ? colors.primary : colors.border
                    }
                  ]}
                >
                  <Text
                    style={[
                      text.labelMedium,
                      { color: selected ? colors.primary : colors.textSecondary }
                    ]}
                  >
                    {localizedItemUnitLabel(nextUnit, l10n)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <FormField
          label={`${l10n('sellingPrice')} (₹ / ${unitLabel})`}
          icon="sell"
          value={sellingPrice}
          placeholder="0"
          error={errors.sellingPrice}
          keyboardType="numeric"
          onChangeText={(value) => {
            setSellingPrice(value);
            clearError('sellingPrice');
          }}
        />

        <View style={styles.twoCol}>
          <View style={styles.flex}>
            <FormField
              label={`${l10n('totalPurchasePrice')} (₹)`}
              icon="shopping-cart"
              value={totalPurchasePrice}
              placeholder="0"
              error={errors.totalPurchasePrice}
              keyboardType="numeric"
              onChangeText={(value) => {
                setTotalPurchasePrice(value);
                clearError('totalPurchasePrice');
              }}
            />
          </View>
          <View style={styles.flex}>
            <FormField
              label={l10n('qtyPurchased')}
              icon="format-list-numbered"
              value={purchasedQty}
              placeholder="0"
              error={errors.purchasedQty}
              keyboardType="numeric"
              onChangeText={(value) => {
                setPurchasedQty(value);
                clearError('purchasedQty');
              }}
            />
          </View>
        </View>

        {derivedCostPerUnit > 0 && (
          <View style={[styles.hint, { backgroundColor: colors.primaryLight }]}>
            <MaterialIcons name="info-outline" size={16} color={colors.primary} />
            <Text style={[text.labelSmall, { color: colors.primary, flex: 1 }]}>
              {l10n('costPerUnitHint', { unit: unitLabel, amount: formatInr(derivedCostPerUnit) })}
            </Text>
          </View>
        )}

        <FormField
          label={l10n('lowStockThreshold')}
          icon="warning-amber"
          value={lowStockThreshold}
          placeholder="5"
          keyboardType="numeric"
          onChangeText={setLowStockThreshold}
        />

        <AppButton
          label={initial == null ? l10n('addItem') : l10n('saveChanges')}
          icon={initial == null ? 'add' : 'check'}
          isLoading={isSaving}
          onPress={submit}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Label({ icon, label }: { icon: keyof typeof MaterialIcons.glyphMap; label: string }) {
  const { colors, text } = useTheme();
  return (
    <View style={styles.labelRow}>
      <MaterialIcons name={icon} size={16} color={colors.textPrimary} accessibilityElementsHidden />
      <Text style={text.labelMedium}>{label}</Text>
    </View>
  );
}

function FormField({
  label,
  icon,
  value,
  placeholder,
  error,
  keyboardType,
  onChangeText
}: {
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  value: string;
  placeholder?: string;
  error?: string;
  keyboardType?: 'default' | 'numeric';
  onChangeText: (value: string) => void;
}) {
  const { colors, text } = useTheme();
  return (
    <View style={styles.group}>
      <Label icon={icon} label={label} />
      <TextInput
        value={value}
        placeholder={placeholder}
        placeholderTextColor={colors.textDisabled}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        accessibilityLabel={label}
        style={[
          styles.input,
          text.bodyMedium,
          {
            color: colors.textPrimary,
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : colors.border
          }
        ]}
      />
      {error && <Text style={[text.labelSmall, { color: colors.danger }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 20, paddingBottom: 36, gap: 18 },
  photoBox: {
    minHeight: 112,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  group: { gap: 8 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  input: { minHeight: 52, borderWidth: 1, borderRadius: 8, paddingHorizontal: 14 },
  unitWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  unitChip: {
    minHeight: 48,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  twoCol: { flexDirection: 'row', gap: 12 },
  hint: {
    minHeight: 44,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  }
});
