import React, {useRef} from 'react';
import {
  Animated,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from 'react-native';

type Props = PressableProps & {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  scaleTo?: number;
};

const PressableScale = ({
  style,
  children,
  scaleTo = 0.97,
  disabled,
  onPressIn,
  onPressOut,
  ...rest
}: Props) => {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) => {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  return (
    <Pressable
      {...rest}
      disabled={disabled}
      onPressIn={e => {
        if (!disabled) {
          animateTo(scaleTo);
        }
        onPressIn?.(e);
      }}
      onPressOut={e => {
        animateTo(1);
        onPressOut?.(e);
      }}>
      <Animated.View style={[style, {transform: [{scale}]}]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

export default PressableScale;
