import type { ReactNode } from 'react';
import { useState } from 'react';
import { Animated, Pressable, type PressableProps } from 'react-native';

interface PressScaleProps extends Omit<PressableProps, 'children'> {
  children?: ReactNode;
  scale?: number;
  duration?: number;
}

export function PressScale({
  scale = 0.95,
  duration = 100,
  children,
  style,
  ...rest
}: PressScaleProps) {
  const [anim] = useState(() => new Animated.Value(1));

  const onPressIn = () =>
    Animated.timing(anim, { toValue: scale, duration, useNativeDriver: true }).start();

  const onPressOut = () =>
    Animated.timing(anim, { toValue: 1, duration, useNativeDriver: true }).start();

  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut} style={style} {...rest}>
      <Animated.View style={{ transform: [{ scale: anim }] }}>{children}</Animated.View>
    </Pressable>
  );
}
