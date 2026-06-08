import { StyleSheet, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { render } from '@testing-library/react-native';

import { AppTopSafeArea } from './AppTopSafeArea';

describe('AppTopSafeArea', () => {
  it('pads the app content by the device top inset', async () => {
    const screen = await render(
      <SafeAreaProvider
        initialMetrics={{
          insets: { top: 37, right: 0, bottom: 0, left: 0 },
          frame: { x: 0, y: 0, width: 390, height: 844 }
        }}
      >
        <AppTopSafeArea backgroundColor="#ffffff">
          <Text>Content</Text>
        </AppTopSafeArea>
      </SafeAreaProvider>
    );

    const style = StyleSheet.flatten(screen.getByTestId('app-top-safe-area').props.style);

    expect(style.paddingTop).toBe(37);
  });
});
