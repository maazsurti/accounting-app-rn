/* eslint-disable @typescript-eslint/no-require-imports */
import React from 'react';
import { Text, type StyleProp, type ViewStyle } from 'react-native';
import { render } from '@testing-library/react-native';

import { createMemoryStorage } from '@/core/storage/test-utils/memory-storage';
import { AppThemeController, AppThemeProvider } from '@/core/theme';

import { AppBottomSheet } from './AppBottomSheet';

const mockPresent = jest.fn();
const mockDismiss = jest.fn();

jest.mock('@gorhom/bottom-sheet', () => {
  const ReactNS = require('react');
  const { ScrollView: MockScrollView, View: MockView } = require('react-native');

  const BottomSheetModal = ReactNS.forwardRef(
    (
      {
        backdropComponent,
        children,
        ...props
      }: {
        backdropComponent?: (props: Record<string, unknown>) => React.ReactNode;
        children: React.ReactNode;
      },
      ref: React.Ref<{ present: () => void; dismiss: () => void }>
    ) => {
      ReactNS.useImperativeHandle(ref, () => ({
        present: mockPresent,
        dismiss: mockDismiss
      }));
      return (
        <MockView testID="gorhom-bottom-sheet-modal" {...props}>
          {backdropComponent?.({ animatedIndex: 0, animatedPosition: 0 })}
          {children}
        </MockView>
      );
    }
  );
  BottomSheetModal.displayName = 'MockBottomSheetModal';

  function BottomSheetBackdrop(props: Record<string, unknown>) {
    return <MockView testID="gorhom-bottom-sheet-backdrop" {...props} />;
  }

  function BottomSheetModalProvider({ children }: { children: React.ReactNode }) {
    return <MockView testID="gorhom-bottom-sheet-provider">{children}</MockView>;
  }

  function BottomSheetScrollView({
    children,
    contentContainerStyle,
    ...props
  }: {
    children: React.ReactNode;
    contentContainerStyle?: StyleProp<ViewStyle>;
  }) {
    return (
      <MockScrollView
        testID="gorhom-bottom-sheet-scroll-view"
        contentContainerStyle={contentContainerStyle}
        {...props}
      >
        {children}
      </MockScrollView>
    );
  }

  function BottomSheetView({
    children,
    style,
    ...props
  }: {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
  }) {
    return (
      <MockView testID="gorhom-bottom-sheet-view" style={style} {...props}>
        {children}
      </MockView>
    );
  }

  return {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetModalProvider,
    BottomSheetScrollView,
    BottomSheetView
  };
});

function renderSheet({
  isDismissible = true,
  scrollable = true,
  visible = true
}: {
  isDismissible?: boolean;
  scrollable?: boolean;
  visible?: boolean;
} = {}) {
  return render(
    <AppThemeProvider controller={new AppThemeController(createMemoryStorage())}>
      <AppBottomSheet
        visible={visible}
        onDismiss={() => {}}
        isDismissible={isDismissible}
        scrollable={scrollable}
      >
        <Text>Sheet content</Text>
      </AppBottomSheet>
    </AppThemeProvider>
  );
}

describe('AppBottomSheet', () => {
  beforeEach(() => {
    mockPresent.mockClear();
    mockDismiss.mockClear();
  });

  it('uses Gorhom ScrollView by default for regular sheet content', async () => {
    const screen = await renderSheet();

    expect(screen.getByTestId('gorhom-bottom-sheet-scroll-view')).toBeTruthy();
  });

  it('can disable the internal scroll view for VirtualizedList children', async () => {
    const screen = await renderSheet({ scrollable: false });

    expect(screen.queryByTestId('gorhom-bottom-sheet-scroll-view')).toBeNull();
    expect(screen.getByTestId('gorhom-bottom-sheet-view')).toBeTruthy();
  });

  it('uses Gorhom backdrop dimming and backdrop-close behavior', async () => {
    const screen = await renderSheet();
    const backdrop = screen.getByTestId('gorhom-bottom-sheet-backdrop');

    expect(backdrop.props.opacity).toBe(0.32);
    expect(backdrop.props.pressBehavior).toBe('close');
  });

  it('disables backdrop close and pan-down close when sheet is not dismissible', async () => {
    const screen = await renderSheet({ isDismissible: false });
    const modal = screen.getByTestId('gorhom-bottom-sheet-modal');
    const backdrop = screen.getByTestId('gorhom-bottom-sheet-backdrop');

    expect(modal.props.enablePanDownToClose).toBe(false);
    expect(backdrop.props.pressBehavior).toBe('none');
  });

  it('presents and dismisses the Gorhom modal from the visible prop', async () => {
    const screen = await renderSheet();

    await new Promise((resolve) => requestAnimationFrame(resolve));

    expect(mockPresent).toHaveBeenCalledTimes(1);

    await screen.rerender(
      <AppThemeProvider controller={new AppThemeController(createMemoryStorage())}>
        <AppBottomSheet visible={false} onDismiss={() => {}}>
          <Text>Sheet content</Text>
        </AppBottomSheet>
      </AppThemeProvider>
    );

    expect(mockDismiss).toHaveBeenCalledTimes(1);
  });
});
