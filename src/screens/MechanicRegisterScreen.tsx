import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {colors} from '../theme';
import {api} from '../services/api';
import styles from './styles/MechanicRegisterScreen.styles';

// INTEGRATION STEP 3: Replace `any` in the Props interface below with the typed prop:
//   import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
//   import type { AuthStackParamList } from '../navigation/AuthNavigator';
//   type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'MechanicRegister'> };

const SPECIALIZATIONS = [
  {key: 'electrical', label: 'Electrical Issues', icon: '⚡'},
  {key: 'mechanical', label: 'Mechanical Issues', icon: '⚙️'},
  {key: 'both', label: 'Both', icon: '🔧'},
] as const;

type Specialization = 'electrical' | 'mechanical' | 'both';

const CAR_BRANDS: {category: string; brands: string[]}[] = [
  {
    category: 'German',
    brands: ['Mercedes-Benz', 'BMW', 'Audi', 'Volkswagen', 'Porsche'],
  },
  {
    category: 'Japanese',
    brands: ['Toyota', 'Honda', 'Nissan', 'Mazda', 'Subaru', 'Lexus', 'Mitsubishi'],
  },
  {
    category: 'American',
    brands: ['Ford', 'Chevrolet', 'Dodge', 'Jeep', 'Cadillac'],
  },
  {
    category: 'Korean',
    brands: ['Hyundai', 'Kia', 'Genesis'],
  },
  {
    category: 'Italian',
    brands: ['Ferrari', 'Lamborghini', 'Alfa Romeo', 'Maserati'],
  },
  {
    category: 'British',
    brands: ['Land Rover', 'Jaguar', 'Bentley', 'Rolls-Royce'],
  },
  {
    category: 'French',
    brands: ['Peugeot', 'Renault', 'Citroën'],
  },
  {
    category: 'Other',
    brands: ['All Brands'],
  },
];

interface Props {
  navigation?: any;
}

const MechanicRegisterScreen = ({navigation}: Props) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [specialization, setSpecialization] = useState<Specialization | null>(null);
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => {
      const next = new Set(prev);
      if (next.has(brand)) {
        next.delete(brand);
      } else {
        next.add(brand);
      }
      return next;
    });
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password || !phone.trim() || !location.trim()) {
      Alert.alert('Missing Info', 'Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    if (!specialization) {
      Alert.alert('Missing Specialization', 'Please select your area of specialization.');
      return;
    }
    if (selectedBrands.size === 0) {
      Alert.alert('Missing Car Brands', 'Please select at least one car brand you work on.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/mechanics/register', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim(),
        location: location.trim(),
        specialization,
        carBrands: Array.from(selectedBrands),
      });
      Alert.alert(
        'Registered!',
        'Your mechanic profile has been created. You can now log in.',
        // INTEGRATION STEP 3: goBack() works automatically once this screen is in the Auth stack.
        [{text: 'OK', onPress: () => navigation?.goBack()}],
      );
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message);
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

          {/* INTEGRATION STEP 3: goBack() works automatically once this screen is in the Auth stack. */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation?.goBack()}
            activeOpacity={0.7}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.screenTitle}>Register as Mechanic</Text>
          <Text style={styles.screenSubtitle}>
            Create your mechanic profile so customers can find you
          </Text>

          {/* Personal Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="John Smith"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="john@example.com"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>Password *</Text>
            <TextInput
              style={styles.input}
              placeholder="Min. 6 characters"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Text style={styles.label}>Confirm Password *</Text>
            <TextInput
              style={[
                styles.input,
                confirmPassword.length > 0 && confirmPassword !== password
                  ? styles.inputError
                  : null,
              ]}
              placeholder="Repeat your password"
              placeholderTextColor={colors.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="+1 555 000 0000"
              placeholderTextColor={colors.textSecondary}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Location / City *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Beirut, Lebanon"
              placeholderTextColor={colors.textSecondary}
              value={location}
              onChangeText={setLocation}
              autoCapitalize="words"
            />
          </View>

          {/* Specialization */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Specialization *</Text>
            <Text style={styles.sectionHint}>What type of issues do you handle?</Text>
            <View style={styles.specializationRow}>
              {SPECIALIZATIONS.map(spec => {
                const selected = specialization === spec.key;
                return (
                  <TouchableOpacity
                    key={spec.key}
                    style={[styles.specCard, selected && styles.specCardSelected]}
                    onPress={() => setSpecialization(spec.key)}
                    activeOpacity={0.8}>
                    <Text style={styles.specIcon}>{spec.icon}</Text>
                    <Text style={[styles.specLabel, selected && styles.specLabelSelected]}>
                      {spec.label}
                    </Text>
                    <View style={[styles.radio, selected && styles.radioSelected]}>
                      {selected && <View style={styles.radioDot} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Car Brands */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Car Brands You Work On *</Text>
            <Text style={styles.sectionHint}>
              Select all that apply ({selectedBrands.size} selected)
            </Text>

            {CAR_BRANDS.map(group => (
              <View key={group.category} style={styles.brandGroup}>
                <Text style={styles.brandCategory}>{group.category}</Text>
                <View style={styles.chipsRow}>
                  {group.brands.map(brand => {
                    const selected = selectedBrands.has(brand);
                    return (
                      <TouchableOpacity
                        key={brand}
                        style={[styles.chip, selected && styles.chipSelected]}
                        onPress={() => toggleBrand(brand)}
                        activeOpacity={0.8}>
                        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                          {brand}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.registerBtn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerBtnText}>Create Mechanic Profile</Text>
            )}
          </TouchableOpacity>

          <View style={styles.bottomPad} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default MechanicRegisterScreen;
