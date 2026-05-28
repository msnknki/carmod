import React, {useState, useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {View, Text, StyleSheet, ActivityIndicator, Image} from 'react-native';

const appLogo = require('./src/assets/app-logo.png');
import AppNavigator from './src/navigation/AppNavigator';
import {CarProvider} from './src/context/CarContext';
import {MarketProvider} from './src/context/MarketContext';
import {AIAssistantProvider} from './src/context/AIAssistantContext';
import {api, setAuthToken} from './src/services/api';

// INTEGRATION STEP 2: Delete the three GUEST_* constants and the ensureGuestSession function
// below once the login screen is wired in. Replace with a stored-token restore:
//
//   import AsyncStorage from '@react-native-async-storage/async-storage';
//   // npm install @react-native-async-storage/async-storage
//
//   async function restoreSession() {
//     const token = await AsyncStorage.getItem('authToken');
//     if (token) setAuthToken(token);
//   }
//
// In LoginScreen.tsx, after a successful login also persist the token:
//   await AsyncStorage.setItem('authToken', res.token);
//
// For logout, call: AsyncStorage.removeItem('authToken') then setAuthToken('').

const GUEST_EMAIL = 'guest@carmodapp.local';
const GUEST_PASSWORD = 'guestpass123';
const GUEST_NAME = 'Guest';

async function ensureGuestSession() {
  try {
    const res = await api.post('/auth/register', {
      email: GUEST_EMAIL,
      password: GUEST_PASSWORD,
      displayName: GUEST_NAME,
    });
    setAuthToken(res.token);
  } catch {
    try {
      const res = await api.post('/auth/login', {
        email: GUEST_EMAIL,
        password: GUEST_PASSWORD,
      });
      setAuthToken(res.token);
    } catch {
      // backend unavailable — api.ts will auto-refresh on the first actual request
    }
  }
}

const SplashScreen = () => (
  <View style={splashStyles.container}>
    <Image source={appLogo} style={splashStyles.logo} resizeMode="contain" />
    <Text style={splashStyles.title}>Car Mod</Text>
    <Text style={splashStyles.subtitle}>Modify · Diagnose · Visualize</Text>
    <ActivityIndicator
      size="large"
      color="#FFD60A"
      style={splashStyles.loader}
    />
  </View>
);

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B0B0B',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {fontSize: 32, fontWeight: '700', color: '#ffffff', letterSpacing: -0.5},
  subtitle: {fontSize: 14, color: '#B3B3B3', marginTop: 6},
  loader: {marginTop: 32},
});

const App = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      const minSplashMs = 1200;
      const authTimeoutMs = 6000;

      await Promise.all([
        Promise.race([
          ensureGuestSession(), // INTEGRATION STEP 2: Replace with restoreSession() (see comment above)
          new Promise<void>(resolve => setTimeout(resolve, authTimeoutMs)),
        ]),
        new Promise<void>(resolve => setTimeout(resolve, minSplashMs)),
      ]);
      setReady(true);
    };
    init();
  }, []);

  return (
    <SafeAreaProvider>
      {!ready ? (
        <SplashScreen />
      ) : (
        <CarProvider>
          <MarketProvider>
            <AIAssistantProvider>
              <NavigationContainer>
                {/* INTEGRATION STEP 4: Wrap this with an auth check:
                      isAuthenticated ? <AppNavigator /> : <AuthNavigator />
                    Add `isAuthenticated` state to App (true when authToken is set).
                    AuthNavigator lives in src/navigation/AuthNavigator.tsx — see STEP 1. */}
                <AppNavigator />
              </NavigationContainer>
            </AIAssistantProvider>
          </MarketProvider>
        </CarProvider>
      )}
    </SafeAreaProvider>
  );
};

export default App;
