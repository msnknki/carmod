import {Platform, TextStyle, ViewStyle} from 'react-native';

export const colors = {
  background: '#0B0B0B',
  backgroundSecondary: '#111111',
  surface: '#1A1A1A',
  surfaceLight: '#222222',
  card: '#1A1A1A',
  cardElevated: '#222222',

  primary: '#FFD60A',
  primaryDark: '#FFB800',
  primaryMuted: 'rgba(255, 214, 10, 0.15)',

  text: '#FFFFFF',
  textSecondary: '#B3B3B3',
  textMuted: '#7A7A7A',

  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.14)',

  accent: '#4ADE80',
  danger: '#FF453A',
  warning: '#FFB800',

  overlay: 'rgba(0,0,0,0.65)',
  glass: 'rgba(26,26,26,0.72)',
  glow: 'rgba(255, 214, 10, 0.35)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const radius = {
  sm: 12,
  md: 18,
  lg: 22,
  xl: 24,
  pill: 999,
};

export const fontSize = {
  xs: 12,
  sm: 13,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  title: 30,
  hero: 32,
};

export const typography = {
  hero: {
    fontSize: fontSize.hero,
    fontWeight: '700' as const,
    color: colors.text,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: '700' as const,
    color: colors.text,
    letterSpacing: -0.3,
  },
  section: {
    fontSize: fontSize.xl,
    fontWeight: '600' as const,
    color: colors.text,
  },
  body: {
    fontSize: fontSize.lg,
    fontWeight: '400' as const,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '500' as const,
    color: colors.textMuted,
    letterSpacing: 0.4,
    textTransform: 'uppercase' as const,
  },
  caption: {
    fontSize: fontSize.xs,
    fontWeight: '400' as const,
    color: colors.textMuted,
  },
};

export const fontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

export const shadows = {
  card: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 8},
      shadowOpacity: 0.35,
      shadowRadius: 16,
    },
    android: {elevation: 8},
    default: {},
  }),
  soft: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.25,
      shadowRadius: 10,
    },
    android: {elevation: 4},
    default: {},
  }),
  glow: Platform.select<ViewStyle>({
    ios: {
      shadowColor: colors.primary,
      shadowOffset: {width: 0, height: 0},
      shadowOpacity: 0.45,
      shadowRadius: 12,
    },
    android: {elevation: 6},
    default: {},
  }),
};

export const sharedStyles = {
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  } as ViewStyle,
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  } as ViewStyle,
  cardElevated: {
    backgroundColor: colors.cardElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    ...shadows.soft,
  } as ViewStyle,
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    color: colors.text,
    fontSize: fontSize.lg,
  } as TextStyle,
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    paddingHorizontal: spacing.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...shadows.glow,
  } as ViewStyle,
  primaryButtonText: {
    color: '#0B0B0B',
    fontSize: fontSize.lg,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  } as TextStyle,
  secondaryButton: {
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    alignItems: 'center' as const,
  } as ViewStyle,
};
