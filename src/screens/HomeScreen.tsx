import React, {useMemo, useState} from 'react';
import {
  Text,
  FlatList,
  View,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import {colors, spacing} from '../theme';
import {useCar} from '../context/CarContext';
import {useAIAssistant} from '../context/AIAssistantContext';
import styles from './styles/HomeScreen.styles';
import AppIcon from '../components/ui/AppIcon';
import PressableScale from '../components/ui/PressableScale';
import PrimaryButton from '../components/ui/PrimaryButton';
import DropdownPicker from '../components/ui/DropdownPicker';
import {
  CAR_MAKES,
  CAR_MODELS,
  YEAR_OPTIONS,
  type CarMake,
} from '../data/carCatalog';
import type {RootTabParamList} from '../types';

const QUICK_ACTIONS = [
  {
    id: 'diy',
    title: 'Diagnose Problem',
    subtitle: 'AI-powered repair guide',
    icon: 'stethoscope' as const,
    tab: 'DIY' as const,
  },
  {
    id: 'parts',
    title: 'Find Parts',
    subtitle: 'Search mods & upgrades',
    icon: 'cart-outline' as const,
    tab: 'Customization' as const,
    params: {tab: 'parts' as const},
  },
  {
    id: 'ai',
    title: 'AI Assistant',
    subtitle: 'Ask anything about your car',
    icon: 'robot-outline' as const,
    action: 'ai' as const,
  },
  {
    id: 'shops',
    title: 'Nearby Shops',
    subtitle: 'Local mechanics & stores',
    icon: 'map-marker-radius' as const,
    tab: 'Customization' as const,
    params: {tab: 'shops' as const},
  },
];

const HomeScreen = () => {
  const navigation =
    useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const {openAssistant} = useAIAssistant();
  const {cars, selectedCar, addCar, removeCar, resetGarage, selectCar, updateCarImage} =
    useCar();
  const [make, setMake] = useState<CarMake | ''>('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<number | ''>('');
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [showForm, setShowForm] = useState(false);

  const modelOptions = useMemo(
    () => (make ? CAR_MODELS[make] : []),
    [make],
  );

  const pickHeroImage = () => {
    if (!selectedCar) return;
    Alert.alert('Car Photo', 'Choose a photo of your car', [
      {
        text: 'Camera',
        onPress: () =>
          launchCamera({mediaType: 'photo', quality: 0.7}, res => {
            if (res.assets?.[0]?.uri) {
              updateCarImage(selectedCar.id, res.assets[0].uri);
            }
          }),
      },
      {
        text: 'Photo Library',
        onPress: () =>
          launchImageLibrary({mediaType: 'photo', quality: 0.7}, res => {
            if (res.assets?.[0]?.uri) {
              updateCarImage(selectedCar.id, res.assets[0].uri);
            }
          }),
      },
      {text: 'Cancel', style: 'cancel'},
    ]);
  };

  const pickImage = () => {
    Alert.alert('Add Photo', 'Choose a photo of your car', [
      {
        text: 'Camera',
        onPress: () =>
          launchCamera({mediaType: 'photo', quality: 0.7}, res => {
            if (res.assets?.[0]?.uri) {
              setImageUri(res.assets[0].uri);
            }
          }),
      },
      {
        text: 'Photo Library',
        onPress: () =>
          launchImageLibrary({mediaType: 'photo', quality: 0.7}, res => {
            if (res.assets?.[0]?.uri) {
              setImageUri(res.assets[0].uri);
            }
          }),
      },
      {text: 'Cancel', style: 'cancel'},
    ]);
  };

  const handleAddCar = () => {
    if (!make || !model || year === '') {
      Alert.alert('Missing Info', 'Please select make, model, and year.');
      return;
    }

    addCar({
      make,
      model,
      year: year as number,
      imageUri,
    });

    setMake('');
    setModel('');
    setYear('');
    setImageUri(undefined);
    setShowForm(false);
  };

  const confirmRemoveCar = (item: {id: string; year: number; make: string; model: string}) => {
    Alert.alert(
      'Remove Car',
      `Remove ${item.year} ${item.make} ${item.model} from your garage?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeCar(item.id),
        },
      ],
    );
  };

  const confirmResetGarage = () => {
    Alert.alert(
      'Reset Garage',
      'Delete all cars and clear saved projects on this device? This cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Reset All',
          style: 'destructive',
          onPress: () => resetGarage(),
        },
      ],
    );
  };

  const navigateQuick = (action: (typeof QUICK_ACTIONS)[number]) => {
    if ('action' in action && action.action === 'ai') {
      openAssistant();
      return;
    }
    if ('params' in action && action.params) {
      navigation.navigate(action.tab, action.params);
    } else if ('tab' in action) {
      navigation.navigate(action.tab);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.title}>Car Mod</Text>
            <Text style={styles.subtitle}>
              Your premium automotive companion
            </Text>
          </View>

          <View style={styles.carsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Garage</Text>
              {cars.length > 0 && (
                <PressableScale onPress={confirmResetGarage}>
                  <Text style={styles.resetLink}>Reset all</Text>
                </PressableScale>
              )}
            </View>
            {cars.length === 0 ? (
              <View style={[styles.heroCard, styles.emptyHero]}>
                <View style={styles.emptyHeroIcon}>
                  <AppIcon name="garage-open" size={36} color={colors.primary} />
                </View>
                <Text style={styles.emptyHeroTitle}>Build your garage</Text>
                <Text style={styles.emptyHeroText}>
                  Add your first vehicle to unlock diagnostics, parts search, and
                  AI help tailored to your car.
                </Text>
                {!showForm && (
                  <PrimaryButton
                    label="Add Your Car"
                    onPress={() => setShowForm(true)}
                    style={{width: '100%'}}
                  />
                )}
              </View>
            ) : (
              <>
                <Text style={styles.garageHint}>Tap a car to select · trash to remove</Text>
                <FlatList
                  data={cars}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={item => item.id}
                  contentContainerStyle={styles.garageList}
                  renderItem={({item}) => (
                    <PressableScale
                      centerContent={false}
                      style={[
                        styles.garageCard,
                        selectedCar?.id === item.id && styles.garageCardSelected,
                      ]}
                      onPress={() => selectCar(item)}>
                      <View style={styles.garageThumbWrap}>
                        {item.imageUri ? (
                          <Image source={{uri: item.imageUri}} style={styles.garageThumb} />
                        ) : (
                          <View style={[styles.garageThumb, styles.heroImagePlaceholder]}>
                            <AppIcon name="car" size={32} color={colors.textMuted} />
                          </View>
                        )}
                        <PressableScale
                          style={styles.garageDeleteBtn}
                          onPress={() => confirmRemoveCar(item)}>
                          <AppIcon name="trash-can-outline" size={18} color={colors.danger} />
                        </PressableScale>
                      </View>
                      <Text style={styles.garageCarName} numberOfLines={2}>
                        {item.year} {item.make}
                      </Text>
                      <Text style={styles.garageCarModel} numberOfLines={1}>
                        {item.model}
                      </Text>
                      {selectedCar?.id === item.id && (
                        <View style={styles.activeBadge}>
                          <Text style={styles.activeLabel}>ACTIVE</Text>
                        </View>
                      )}
                    </PressableScale>
                  )}
                />
              </>
            )}
          </View>

          {selectedCar && (
            <View style={styles.heroCard}>
              <TouchableOpacity onPress={pickHeroImage} activeOpacity={0.85}>
                {selectedCar.imageUri ? (
                  <Image
                    source={{uri: selectedCar.imageUri}}
                    style={styles.heroImage}
                  />
                ) : (
                  <View style={styles.heroImagePlaceholder}>
                    <AppIcon name="car-sports" size={56} color={colors.textMuted} />
                  </View>
                )}
                <View style={styles.heroImageEditBtn}>
                  <AppIcon name="camera-plus-outline" size={16} color="#fff" />
                </View>
              </TouchableOpacity>
              <View style={styles.heroOverlay}>
                <Text style={styles.heroLabel}>Selected vehicle</Text>
                <Text style={styles.heroCarName}>
                  {selectedCar.year} {selectedCar.make} {selectedCar.model}
                </Text>
                <View style={styles.statsRow}>
                  <View style={styles.statPill}>
                    <Text style={styles.statValue}>—</Text>
                    <Text style={styles.statLabel}>Mileage</Text>
                  </View>
                  <View style={styles.statPill}>
                    <Text style={styles.statValue}>Good</Text>
                    <Text style={styles.statLabel}>Health</Text>
                  </View>
                  <View style={styles.statPill}>
                    <Text style={styles.statValue}>{cars.length}</Text>
                    <Text style={styles.statLabel}>In garage</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {cars.length > 0 && !showForm && (
            <PrimaryButton
              label="Add Another Car"
              variant="outline"
              onPress={() => setShowForm(true)}
              style={{marginBottom: spacing.lg}}
            />
          )}

          {showForm && (
            <View style={styles.form}>
              <Text style={styles.formTitle}>Add Your Car</Text>
              <DropdownPicker
                label="Make"
                value={make}
                options={[...CAR_MAKES]}
                placeholder="Select make"
                onSelect={value => {
                  setMake(value);
                  setModel('');
                }}
              />
              <DropdownPicker
                label="Model"
                value={model}
                options={modelOptions}
                placeholder={make ? 'Select model' : 'Select make first'}
                disabled={!make}
                onSelect={setModel}
              />
              <DropdownPicker
                label="Year"
                value={year}
                options={YEAR_OPTIONS}
                placeholder="Select year"
                onSelect={setYear}
              />
              <PressableScale style={styles.photoButton} onPress={pickImage}>
                {imageUri ? (
                  <Image source={{uri: imageUri}} style={styles.photoPreview} />
                ) : (
                  <>
                    <AppIcon name="camera-plus-outline" size={22} color={colors.primary} />
                    <Text style={styles.photoButtonText}>Add car photo (optional)</Text>
                  </>
                )}
              </PressableScale>
              <View style={styles.formButtons}>
                <View style={{flex: 1}}>
                  <PrimaryButton label="Save Car" onPress={handleAddCar} />
                </View>
                <View style={{flex: 1}}>
                  <PrimaryButton
                    label="Cancel"
                    variant="ghost"
                    onPress={() => {
                      setShowForm(false);
                      setImageUri(undefined);
                    }}
                  />
                </View>
              </View>
            </View>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          <View style={styles.quickGrid}>
            {QUICK_ACTIONS.map(action => (
              <PressableScale
                key={action.id}
                style={styles.quickCard}
                onPress={() => navigateQuick(action)}>
                <View style={styles.quickIconWrap}>
                  <AppIcon name={action.icon} size={22} color={colors.primary} />
                </View>
                <Text style={styles.quickTitle}>{action.title}</Text>
                <Text style={styles.quickSubtitle}>{action.subtitle}</Text>
              </PressableScale>
            ))}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default HomeScreen;
