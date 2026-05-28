import React from 'react';
import {View, Text, ScrollView, StyleSheet} from 'react-native';
import {colors, fontSize, radius, shadows, spacing} from '../theme';
import {MARKETS, type MarketCode} from '../data/markets';
import {useMarket} from '../context/MarketContext';
import PressableScale from './ui/PressableScale';

const MarketSelector = () => {
  const {countryCode, setCountryCode} = useMarket();

  return (
    <View style={styles.bar}>
      <Text style={styles.label}>Market</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chips}>
          {MARKETS.map(m => (
            <PressableScale
              key={m.code}
              style={[
                styles.chip,
                countryCode === m.code && styles.chipSelected,
              ]}
              onPress={() => setCountryCode(m.code as MarketCode)}>
              <Text
                style={[
                  styles.chipText,
                  countryCode === m.code && styles.chipTextSelected,
                ]}>
                {m.label}
              </Text>
            </PressableScale>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
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
  chips: {flexDirection: 'row', gap: spacing.sm},
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
  chipTextSelected: {color: '#0B0B0B'},
});

export default MarketSelector;
