import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function AppTopSafeArea({
  children,
  backgroundColor
}: {
  children: React.ReactNode;
  backgroundColor: string;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      testID="app-top-safe-area"
      style={[styles.root, { backgroundColor, paddingTop: insets.top } satisfies ViewStyle]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 }
});
