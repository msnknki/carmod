import React, {useMemo} from 'react';
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import {radius} from '../../theme';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
  glow?: boolean;
};

const PremiumCard = ({children, style, elevated, glow}: Props) => {
  const {colors, shadows} = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: 'hidden',
          ...shadows.card,
        },
        elevated: {
          backgroundColor: colors.cardElevated,
          borderColor: colors.borderStrong,
        },
        glow: {
          borderColor: colors.glow,
          ...shadows.glow,
        },
      }),
    [colors, shadows],
  );

  return (
    <View
      style={[
        styles.card,
        elevated && styles.elevated,
        glow && styles.glow,
        style,
      ]}>
      {children}
    </View>
  );
};

export default PremiumCard;
