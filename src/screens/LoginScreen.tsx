import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {colors} from '../theme';
import {api, setAuthToken} from '../services/api';
import styles from './styles/LoginScreen.styles';

// INTEGRATION STEP 3: Replace `any` below with the typed prop once AuthNavigator exists:
//   import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
//   import type { AuthStackParamList } from '../navigation/AuthNavigator';
//   type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'> };
interface Props {
  navigation?: any;
}

const LoginScreen = ({navigation}: Props) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      Alert.alert('Missing Info', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/login', {
        email: trimmedEmail,
        password,
      });
      setAuthToken(res.token);
      // INTEGRATION STEP 4: Uncomment the line below and delete the Alert.
      // App.tsx will detect the token and swap to the main tab navigator automatically.
      // navigation.navigate('Home');
      Alert.alert('Success', `Welcome back, ${res.user.displayName}!`);
    } catch (err: any) {
      Alert.alert('Login Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* Logo */}
          <View style={styles.logoSection}>
            <Text style={styles.logoIcon}>🚗</Text>
            <Text style={styles.logoTitle}>CarMod</Text>
            <Text style={styles.logoSubtitle}>Modify · Diagnose · Visualize</Text>
          </View>

          {/* Login card */}
          <View style={styles.card}>
            <Text style={styles.heading}>Welcome Back</Text>
            <Text style={styles.subheading}>Sign in to your account</Text>

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Your password"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginBtnText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Registration options */}
          <View style={styles.footer}>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>new here?</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* INTEGRATION STEP 3: navigation.navigate('MechanicRegister') works once
                AuthNavigator lists MechanicRegisterScreen as a stack screen (see AuthNavigator.tsx). */}
            <TouchableOpacity
              style={styles.mechanicBtn}
              onPress={() => navigation?.navigate('MechanicRegister')}
              activeOpacity={0.85}>
              <Text style={styles.mechanicBtnIcon}>🔧</Text>
              <Text style={styles.mechanicBtnText}>Register as a Mechanic</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
