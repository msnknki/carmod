import React, {useMemo} from 'react';
import {View, Text, ScrollView, StyleSheet, TouchableOpacity} from 'react-native';
import {useTheme} from '../context/ThemeContext';
import {fontSize, radius, spacing} from '../theme';
import {MARKETS, type MarketCode} from '../data/markets';
import {useMarket} from '../context/MarketContext';

const MarketSelector = () => {
  const {countryCode, setCountryCode} = useMarket();
  const {colors, shadows} = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        bar: {
          width: '100%',
          paddingVertical: spacing.sm,
          marginBottom: spacing.sm,
        },
        label: {
          fontSize: fontSize.xs,
          color: colors.textMuted,
          fontWeight: '600',
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          marginBottom: spacing.sm,
        },
        scroll: {
          flexGrow: 0,
          maxHeight: 48,
        },
        chips: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingRight: spacing.sm,
        },
        chip: {
          paddingHorizontal: spacing.md,
          paddingVertical: 8,
          borderRadius: radius.pill,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
        },
        chipSelected: {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
          ...shadows.glow,
        },
        chipText: {
          fontSize: fontSize.sm,
          color: colors.textSecondary,
          fontWeight: '600',
        },
        chipTextSelected: {color: colors.onPrimary},
      }),
    [colors, shadows],
  );

  return (
    <View style={styles.bar}>
      <Text style={styles.label}>Market</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.chips}>
        {MARKETS.map(m => {
          const selected = countryCode === m.code;
          return (
            <TouchableOpacity
              key={m.code}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => setCountryCode(m.code as MarketCode)}
              activeOpacity={0.8}>
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default MarketSelector;
