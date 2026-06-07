import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useTheme } from '@/core/theme';
import { formatQty } from '@/core/utils/format';
import { PressScale } from './PressScale';

interface QuantityStepperProps {
  value: number;
  onChanged: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  editable?: boolean;
}

export function QuantityStepper({
  value,
  onChanged,
  min = 1,
  max = 999,
  step = 1,
  editable = false
}: QuantityStepperProps) {
  const { colors, text } = useTheme();
  const [inputText, setInputText] = useState(formatQty(value));
  const isFocused = useRef(false);

  useEffect(() => {
    if (!isFocused.current) setInputText(formatQty(value));
  }, [value]);

  const canDecrement = value - step >= min;
  const canIncrement = value + step <= max;

  function commit(raw: string) {
    const parsed = parseFloat(raw.replace(/,/g, ''));
    if (isNaN(parsed) || parsed < min) {
      setInputText(formatQty(value));
      return;
    }
    const clamped = Math.min(Math.max(parsed, min), max);
    onChanged(clamped);
    setInputText(formatQty(clamped));
  }

  return (
    <View
      style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}
      accessibilityLabel={`Quantity: ${formatQty(value)}`}
    >
      <StepButton
        icon="remove"
        label="Decrease quantity"
        enabled={canDecrement}
        onPress={() => {
          onChanged(value - step);
          setInputText(formatQty(value - step));
        }}
        color={canDecrement ? colors.primary : colors.textDisabled}
      />
      <View style={styles.valueWrap} accessibilityElementsHidden>
        {editable ? (
          <TextInput
            value={inputText}
            onChangeText={(t) => {
              setInputText(t);
              const parsed = parseFloat(t.replace(/,/g, ''));
              if (!isNaN(parsed) && parsed >= min) onChanged(Math.min(parsed, max));
            }}
            onFocus={() => {
              isFocused.current = true;
            }}
            onBlur={() => {
              isFocused.current = false;
              commit(inputText);
            }}
            onSubmitEditing={() => commit(inputText)}
            keyboardType="decimal-pad"
            textAlign="center"
            style={[text.numericMedium, { color: colors.textPrimary }]}
          />
        ) : (
          <Text style={[text.numericMedium, { color: colors.textPrimary, textAlign: 'center' }]}>
            {formatQty(value)}
          </Text>
        )}
      </View>
      <StepButton
        icon="add"
        label="Increase quantity"
        enabled={canIncrement}
        onPress={() => {
          onChanged(value + step);
          setInputText(formatQty(value + step));
        }}
        color={canIncrement ? colors.primary : colors.textDisabled}
      />
    </View>
  );
}

function StepButton({
  icon,
  label,
  enabled,
  onPress,
  color
}: {
  icon: 'add' | 'remove';
  label: string;
  enabled: boolean;
  onPress: () => void;
  color: string;
}) {
  return (
    <PressScale
      onPress={enabled ? onPress : undefined}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !enabled }}
    >
      <View style={styles.stepBtn}>
        <MaterialIcons name={icon} size={22} color={color} />
      </View>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1
  },
  valueWrap: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepBtn: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
