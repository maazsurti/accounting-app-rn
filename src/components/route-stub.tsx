import { StyleSheet, Text, View } from 'react-native';

/**
 * Placeholder screen for routes not yet ported. Each phase replaces its
 * stubs with the real screen — see docs/rn_port/PLAN.md.
 */
export function RouteStub({ label }: { label: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  text: {
    fontSize: 16
  }
});
