export type ColorPalette = {
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceLight: string;
  card: string;
  cardElevated: string;

  primary: string;
  primaryDark: string;
  primaryMuted: string;
  onPrimary: string;
  onAiAssistant: string;

  text: string;
  textSecondary: string;
  textMuted: string;

  border: string;
  borderStrong: string;

  accent: string;
  danger: string;
  warning: string;

  overlay: string;
  glass: string;
  glow: string;

  aiAssistant: string;
  aiAssistantDark: string;
  aiAssistantGlow: string;
};

export const darkColors: ColorPalette = {
  background: '#0B0B0B',
  backgroundSecondary: '#111111',
  surface: '#1A1A1A',
  surfaceLight: '#222222',
  card: '#1A1A1A',
  cardElevated: '#222222',

  primary: '#FFD60A',
  primaryDark: '#FFB800',
  primaryMuted: 'rgba(255, 214, 10, 0.15)',
  onPrimary: '#0B0B0B',
  onAiAssistant: '#FFFFFF',

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

  aiAssistant: '#7C3AED',
  aiAssistantDark: '#6D28D9',
  aiAssistantGlow: 'rgba(124, 58, 237, 0.45)',
};

export const lightColors: ColorPalette = {
  background: '#FFFFFF',
  backgroundSecondary: '#F8F8F8',
  surface: '#F3F3F3',
  surfaceLight: '#ECECEC',
  card: '#FFFFFF',
  cardElevated: '#FAFAFA',

  primary: '#FFD60A',
  primaryDark: '#E6C200',
  primaryMuted: 'rgba(255, 214, 10, 0.22)',
  onPrimary: '#0B0B0B',
  onAiAssistant: '#FFFFFF',

  text: '#0B0B0B',
  textSecondary: '#525252',
  textMuted: '#737373',

  border: 'rgba(0,0,0,0.08)',
  borderStrong: 'rgba(0,0,0,0.12)',

  accent: '#16A34A',
  danger: '#DC2626',
  warning: '#CA8A04',

  overlay: 'rgba(0,0,0,0.45)',
  glass: 'rgba(255,255,255,0.85)',
  glow: 'rgba(255, 214, 10, 0.4)',

  aiAssistant: '#7C3AED',
  aiAssistantDark: '#6D28D9',
  aiAssistantGlow: 'rgba(124, 58, 237, 0.35)',
};

export const getColors = (scheme: 'light' | 'dark' | null | undefined): ColorPalette =>
  scheme === 'light' ? lightColors : darkColors;
