import React, {useMemo} from 'react';
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';
import PressableScale from './PressableScale';
import {useTheme} from '../../context/ThemeContext';
import {fontSize, radius} from '../../theme';

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
  const {colors, shadows} = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        base: {
          alignSelf: 'stretch',
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
          color: colors.onPrimary,
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
      }),
    [colors, shadows],
  );

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
          color={variant === 'primary' ? colors.onPrimary : colors.primary}
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

export default PrimaryButton;
