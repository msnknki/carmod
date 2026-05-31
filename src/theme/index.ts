import {Platform, TextStyle, ViewStyle} from 'react-native';
import {darkColors} from './colors';
import type {ColorPalette} from './colors';

export {darkColors, lightColors, getColors} from './colors';
export type {ColorPalette} from './colors';

export const colors = darkColors;

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

export type AppShadows = {
  card: ViewStyle;
  soft: ViewStyle;
  glow: ViewStyle;
  aiGlow: ViewStyle;
};

export const createShadows = (palette: ColorPalette): AppShadows => ({
  card: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 8},
      shadowOpacity: palette.background === '#FFFFFF' ? 0.12 : 0.35,
      shadowRadius: 16,
    },
    android: {elevation: palette.background === '#FFFFFF' ? 4 : 8},
    default: {},
  }),
  soft: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: palette.background === '#FFFFFF' ? 0.08 : 0.25,
      shadowRadius: 10,
    },
    android: {elevation: palette.background === '#FFFFFF' ? 2 : 4},
    default: {},
  }),
  glow: Platform.select<ViewStyle>({
    ios: {
      shadowColor: palette.primary,
      shadowOffset: {width: 0, height: 0},
      shadowOpacity: 0.45,
      shadowRadius: 12,
    },
    android: {elevation: 6},
    default: {},
  }),
  aiGlow: Platform.select<ViewStyle>({
    ios: {
      shadowColor: palette.aiAssistant,
      shadowOffset: {width: 0, height: 0},
      shadowOpacity: 0.45,
      shadowRadius: 12,
    },
    android: {elevation: 8},
    default: {},
  }),
});

export const shadows = createShadows(darkColors);

export type AppTypography = ReturnType<typeof createTypography>;

export const createTypography = (palette: ColorPalette) => ({
  hero: {
    fontSize: fontSize.hero,
    fontWeight: '700' as const,
    color: palette.text,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: '700' as const,
    color: palette.text,
    letterSpacing: -0.3,
  },
  section: {
    fontSize: fontSize.xl,
    fontWeight: '600' as const,
    color: palette.text,
  },
  body: {
    fontSize: fontSize.lg,
    fontWeight: '400' as const,
    color: palette.textSecondary,
    lineHeight: 22,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '500' as const,
    color: palette.textMuted,
    letterSpacing: 0.4,
    textTransform: 'uppercase' as const,
  },
  caption: {
    fontSize: fontSize.xs,
    fontWeight: '400' as const,
    color: palette.textMuted,
  },
});

export const typography = createTypography(darkColors);

export const fontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

export type AppSharedStyles = ReturnType<typeof createSharedStyles>;

export const createSharedStyles = (palette: ColorPalette, themeShadows: AppShadows) => ({
  screen: {
    flex: 1,
    backgroundColor: palette.background,
  } as ViewStyle,
  card: {
    backgroundColor: palette.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    ...themeShadows.card,
  } as ViewStyle,
  cardElevated: {
    backgroundColor: palette.cardElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    ...themeShadows.soft,
  } as ViewStyle,
  input: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    color: palette.text,
    fontSize: fontSize.lg,
  } as TextStyle,
  primaryButton: {
    backgroundColor: palette.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    paddingHorizontal: spacing.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...themeShadows.glow,
  } as ViewStyle,
  primaryButtonText: {
    color: palette.onPrimary,
    fontSize: fontSize.lg,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  } as TextStyle,
  secondaryButton: {
    backgroundColor: palette.surfaceLight,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    alignItems: 'center' as const,
  } as ViewStyle,
});

export const sharedStyles = createSharedStyles(darkColors, shadows);
