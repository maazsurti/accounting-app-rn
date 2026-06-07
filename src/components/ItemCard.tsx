import { Image, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useTheme } from '@/core/theme';
import { formatInr } from '@/core/utils/format';
import { PressScale } from './PressScale';

interface ItemCardProps {
  name: string;
  price: number;
  unit: string;
  imagePath?: string | null;
  isOutOfStock?: boolean;
  onPress: () => void;
  stockFraction?: number | null;
}

export function ItemCard({
  name,
  price,
  unit,
  imagePath,
  isOutOfStock = false,
  onPress,
  stockFraction
}: ItemCardProps) {
  const { colors, text } = useTheme();

  const priceColor = isOutOfStock ? colors.textDisabled : colors.primary;

  return (
    <PressScale
      onPress={isOutOfStock ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={
        isOutOfStock ? `${name} — out of stock` : `${name}, ₹${formatInr(price)} per ${unit}`
      }
      accessibilityHint={isOutOfStock ? undefined : 'Double-tap to record a sale'}
      accessibilityState={{ disabled: isOutOfStock }}
    >
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <ItemImage
          imagePath={imagePath}
          placeholderColor={colors.surfaceElevated}
          iconColor={colors.textDisabled}
        />
        <View style={styles.info}>
          <Text
            style={[
              text.labelMedium,
              { color: isOutOfStock ? colors.textDisabled : colors.textPrimary }
            ]}
            numberOfLines={2}
          >
            {name}
          </Text>
          <View style={styles.meta}>
            <View style={styles.metaRow}>
              <MaterialIcons name="sell" size={12} color={priceColor} />
              <Text
                style={[text.numericMedium, styles.metaText, { color: priceColor, fontSize: 14 }]}
              >
                ₹{formatInr(price)}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <MaterialIcons
                name={isOutOfStock ? 'remove-circle-outline' : 'inventory-2'}
                size={12}
                color={isOutOfStock ? colors.danger : colors.textSecondary}
              />
              <Text
                style={[
                  text.labelSmall,
                  styles.metaText,
                  { color: isOutOfStock ? colors.danger : colors.textSecondary }
                ]}
              >
                {isOutOfStock ? 'Out of stock' : `per ${unit}`}
              </Text>
            </View>
          </View>
        </View>
        {stockFraction != null && (
          <View style={styles.ringWrap} accessibilityElementsHidden>
            <StockRing fraction={stockFraction} colors={colors} />
          </View>
        )}
      </View>
    </PressScale>
  );
}

function ItemImage({
  imagePath,
  placeholderColor,
  iconColor
}: {
  imagePath?: string | null;
  placeholderColor: string;
  iconColor: string;
}) {
  if (imagePath) {
    const isAsset = imagePath.startsWith('assets/') || imagePath.startsWith('@/');
    if (isAsset) {
      return <Image source={{ uri: imagePath }} style={styles.image} resizeMode="cover" />;
    }
    return (
      <Image source={{ uri: `file://${imagePath}` }} style={styles.image} resizeMode="cover" />
    );
  }
  return (
    <View
      style={[
        styles.image,
        { backgroundColor: placeholderColor, alignItems: 'center', justifyContent: 'center' }
      ]}
    >
      <MaterialIcons name="storefront" size={28} color={iconColor} />
    </View>
  );
}

function StockRing({
  fraction,
  colors
}: {
  fraction: number;
  colors: { danger: string; primary: string };
}) {
  const color = fraction <= 0.25 ? colors.danger : fraction <= 0.5 ? '#F97316' : colors.primary;
  const SIZE = 22;
  const STROKE = 2.5;

  return (
    <View style={{ width: SIZE, height: SIZE }}>
      {/* Static background ring */}
      <View
        style={{
          position: 'absolute',
          width: SIZE,
          height: SIZE,
          borderRadius: SIZE / 2,
          borderWidth: STROKE,
          borderColor: 'rgba(0,0,0,0.12)'
        }}
      />
      {/* Foreground arc approximated with a clip + rotation — SVG not available in base RN */}
      <View
        style={{
          position: 'absolute',
          width: SIZE,
          height: SIZE,
          borderRadius: SIZE / 2,
          borderWidth: STROKE,
          borderColor: color,
          borderRightColor: fraction < 0.75 ? 'transparent' : color,
          borderBottomColor: fraction < 0.5 ? 'transparent' : color,
          borderLeftColor: fraction < 0.25 ? 'transparent' : color
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    flex: 1
  },
  image: {
    height: 72,
    width: '100%'
  },
  info: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between'
  },
  meta: {
    gap: 2
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3
  },
  metaText: {
    marginLeft: 2
  },
  ringWrap: {
    position: 'absolute',
    bottom: 8,
    right: 8
  }
});
