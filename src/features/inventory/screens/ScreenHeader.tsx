import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useTheme } from '@/core/theme';

export function ScreenHeader({ title }: { title: string }) {
  const router = useRouter();
  const { colors, text } = useTheme();
  return (
    <View
      style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
    >
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={styles.backButton}
      >
        <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
      </Pressable>
      <Text style={text.headlineSmall} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.backButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 60,
    borderBottomWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  backButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }
});
