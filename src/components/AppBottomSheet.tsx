import { type ReactNode, useCallback, useEffect, useRef } from 'react';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
  type BottomSheetBackdropProps
} from '@gorhom/bottom-sheet';
import { StyleSheet } from 'react-native';

import { useTheme } from '@/core/theme';

interface AppBottomSheetProps {
  visible: boolean;
  onDismiss: () => void;
  children: ReactNode;
  isDismissible?: boolean;
  scrollable?: boolean;
}

export function AppBottomSheet({
  visible,
  onDismiss,
  children,
  isDismissible = true,
  scrollable = true
}: AppBottomSheetProps) {
  const { colors } = useTheme();
  const sheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (visible) {
      const frame = requestAnimationFrame(() => {
        sheetRef.current?.present();
      });
      return () => cancelAnimationFrame(frame);
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.32}
        pressBehavior={isDismissible ? 'close' : 'none'}
      />
    ),
    [isDismissible]
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      backgroundStyle={{ backgroundColor: colors.surface }}
      backdropComponent={renderBackdrop}
      enablePanDownToClose={isDismissible}
      handleIndicatorStyle={{ backgroundColor: colors.border }}
      onDismiss={onDismiss}
    >
      {scrollable ? (
        <BottomSheetScrollView
          bounces={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          {children}
        </BottomSheetScrollView>
      ) : (
        <BottomSheetView style={styles.content}>{children}</BottomSheetView>
      )}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingBottom: 28
  }
});
