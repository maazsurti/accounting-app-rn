import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useTheme } from '@/core/theme';
import { PressScale } from './PressScale';

export type AppButtonVariant = 'primary' | 'ghost' | 'destructive';

interface AppButtonProps {
  label: string;
  onPress?: () => void;
  variant?: AppButtonVariant;
  isLoading?: boolean;
  icon?: keyof typeof MaterialIcons.glyphMap;
  disabled?: boolean;
}

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  isLoading = false,
  icon,
  disabled = false
}: AppButtonProps) {
  const { colors, text } = useTheme();

  const backgroundColor =
    variant === 'primary'
      ? colors.primary
      : variant === 'destructive'
        ? colors.dangerLight
        : 'transparent';

  const foregroundColor =
    variant === 'primary'
      ? colors.onPrimary
      : variant === 'destructive'
        ? colors.danger
        : colors.textPrimary;

  const borderColor = variant === 'ghost' ? colors.border : 'transparent';

  return (
    <PressScale
      onPress={isLoading || disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isLoading || disabled }}
    >
      <View
        style={[
          styles.button,
          { backgroundColor: isLoading || disabled ? colors.border : backgroundColor, borderColor },
          variant === 'ghost' && styles.ghostBorder
        ]}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={foregroundColor} />
        ) : (
          <View style={styles.row}>
            {icon && (
              <MaterialIcons name={icon} size={18} color={foregroundColor} style={styles.icon} />
            )}
            <Text style={[text.labelLarge, { color: foregroundColor }]}>{label}</Text>
          </View>
        )}
      </View>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    width: '100%',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  ghostBorder: {
    borderWidth: 1.5
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  icon: {
    marginRight: 8
  }
});
