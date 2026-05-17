import React from 'react';
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native';
import {colors, radius, shadows} from '../../theme';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
  glow?: boolean;
};

const PremiumCard = ({children, style, elevated, glow}: Props) => (
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

const styles = StyleSheet.create({
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
    borderColor: 'rgba(255, 214, 10, 0.25)',
    ...shadows.glow,
  },
});

export default PremiumCard;
