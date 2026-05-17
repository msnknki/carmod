import React from 'react';
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';
import PressableScale from './PressableScale';
import {colors, fontSize, radius, shadows} from '../../theme';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'ghost' | 'outline';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

const PrimaryButton = ({
  label,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  style,
  textStyle,
}: Props) => {
  const isDisabled = disabled || loading;

  return (
    <PressableScale
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'outline' && styles.outline,
        variant === 'ghost' && styles.ghost,
        isDisabled && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? '#0B0B0B' : colors.primary}
        />
      ) : (
        <Text
          style={[
            variant === 'primary' && styles.primaryText,
            variant === 'outline' && styles.outlineText,
            variant === 'ghost' && styles.ghostText,
            textStyle,
          ]}>
          {label}
        </Text>
      )}
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.primary,
    ...shadows.glow,
  },
  ghost: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  primaryText: {
    color: '#0B0B0B',
    fontSize: fontSize.lg,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  ghostText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  outlineText: {
    color: colors.primary,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  disabled: {opacity: 0.45},
});

export default PrimaryButton;
