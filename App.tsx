import React, {useState, useEffect} from 'react';
import {NavigationContainer, DefaultTheme, DarkTheme} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {View, Text, StyleSheet, ActivityIndicator, Image} from 'react-native';

const appLogo = require('./src/assets/app-logo.png');
import AppNavigator from './src/navigation/AppNavigator';
import {CarProvider} from './src/context/CarContext';
import {MarketProvider} from './src/context/MarketContext';
import {AIAssistantProvider} from './src/context/AIAssistantContext';
import {ThemeProvider, useTheme} from './src/context/ThemeContext';
import {ensureAuthenticated} from './src/services/api';

const SplashScreen = () => {
  const {colors} = useTheme();

  return (
    <View style={[splashStyles.container, {backgroundColor: colors.background}]}>
      <Image source={appLogo} style={splashStyles.logo} resizeMode="contain" />
      <Text style={[splashStyles.title, {color: colors.text}]}>Car Mod</Text>
      <Text style={[splashStyles.subtitle, {color: colors.textSecondary}]}>
        Modify · Diagnose · Visualize
      </Text>
      <ActivityIndicator
        size="large"
        color={colors.primary}
        style={splashStyles.loader}
      />
    </View>
  );
};

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {fontSize: 32, fontWeight: '700', letterSpacing: -0.5},
  subtitle: {fontSize: 14, marginTop: 6},
  loader: {marginTop: 32},
});

const AppShell = () => {
  const [ready, setReady] = useState(false);
  const {colors, isDark} = useTheme();

  useEffect(() => {
    const init = async () => {
      const minSplashMs = 1200;
      await Promise.all([
        ensureAuthenticated(),
        new Promise<void>(resolve => setTimeout(resolve, minSplashMs)),
      ]);
      setReady(true);
    };
    init();
  }, []);

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      notification: colors.primary,
    },
  };

  if (!ready) {
    return <SplashScreen />;
  }

  return (
    <CarProvider>
      <MarketProvider>
        <AIAssistantProvider>
          <NavigationContainer theme={navigationTheme}>
            <AppNavigator />
          </NavigationContainer>
        </AIAssistantProvider>
      </MarketProvider>
    </CarProvider>
  );
};

const App = () => (
  <SafeAreaProvider>
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  </SafeAreaProvider>
);

export default App;
