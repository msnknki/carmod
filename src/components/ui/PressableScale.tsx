import React, {useRef} from 'react';
import {
  Animated,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';

type Props = PressableProps & {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  scaleTo?: number;

  centerContent?: boolean;
};

const PressableScale = ({
  style,
  children,
  scaleTo = 0.97,
  centerContent = true,
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
      style={({pressed}) => [
        styles.pressable,
        style,
        pressed && !disabled && styles.pressed,
      ]}
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
      <Animated.View
        pointerEvents="none"
        style={[
          styles.content,
          centerContent && styles.contentCentered,
          {transform: [{scale}]},
        ]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: {
    alignSelf: 'auto',
  },
  pressed: {
    opacity: 0.92,
  },
  content: {
    width: '100%',
  },
  contentCentered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PressableScale;
