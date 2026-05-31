import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
} from 'react';
import {useColorScheme, StatusBar} from 'react-native';
import {
  ColorPalette,
  darkColors,
  getColors,
} from '../theme/colors';
import {
  spacing,
  radius,
  fontSize,
  fontFamily,
  createShadows,
  createTypography,
  createSharedStyles,
  type AppShadows,
  type AppTypography,
  type AppSharedStyles,
} from '../theme';

export type ThemeMode = 'light' | 'dark';

type ThemeContextValue = {
  colors: ColorPalette;
  shadows: AppShadows;
  typography: AppTypography;
  sharedStyles: AppSharedStyles;
  isDark: boolean;
  colorScheme: ThemeMode;
};

const ThemeContext = createContext<ThemeContextValue>({
  colors: darkColors,
  shadows: createShadows(darkColors),
  typography: createTypography(darkColors),
  sharedStyles: createSharedStyles(darkColors, createShadows(darkColors)),
  isDark: true,
  colorScheme: 'dark',
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({children}: {children: React.ReactNode}) => {
  const systemScheme = useColorScheme();
  const [scheme, setScheme] = useState<ThemeMode>(
    systemScheme === 'light' ? 'light' : 'dark',
  );

  useEffect(() => {
    setScheme(systemScheme === 'light' ? 'light' : 'dark');
  }, [systemScheme]);

  const value = useMemo(() => {
    const colors = getColors(scheme);
    const shadows = createShadows(colors);
    const typography = createTypography(colors);
    const sharedStyles = createSharedStyles(colors, shadows);
    return {
      colors,
      shadows,
      typography,
      sharedStyles,
      isDark: scheme === 'dark',
      colorScheme: scheme,
    };
  }, [scheme]);

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar
        barStyle={value.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={value.colors.background}
      />
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemedStyles = <T,>(
  factory: (theme: ThemeContextValue) => T,
): T => {
  const theme = useTheme();
  return useMemo(() => factory(theme), [theme, factory]);
};
