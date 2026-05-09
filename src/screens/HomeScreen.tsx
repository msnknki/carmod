import React, {useState} from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  View,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import {colors} from '../theme';
import {useCar} from '../context/CarContext';
import styles from './styles/HomeScreen.styles';

const currentYear = new Date().getFullYear();

const HomeScreen = () => {
  const {cars, selectedCar, addCar, removeCar, selectCar} = useCar();
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [showForm, setShowForm] = useState(false);

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
    const trimmedMake = make.trim();
    const trimmedModel = model.trim();
    const parsedYear = parseInt(year, 10);

    if (!trimmedMake || !trimmedModel || !year) {
      Alert.alert('Missing Info', 'Please fill in make, model, and year.');
      return;
    }

    if (isNaN(parsedYear) || parsedYear < 1900 || parsedYear > currentYear + 1) {
      Alert.alert('Invalid Year', `Year must be between 1900 and ${currentYear + 1}.`);
      return;
    }

    addCar({make: trimmedMake, model: trimmedModel, year: parsedYear, imageUri});

    setMake('');
    setModel('');
    setYear('');
    setImageUri(undefined);
    setShowForm(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Car Mod App 🚗</Text>
          <Text style={styles.subtitle}>Your car modification assistant</Text>

          {selectedCar && (
            <View style={styles.selectedCard}>
              {selectedCar.imageUri && (
                <Image source={{uri: selectedCar.imageUri}} style={styles.selectedImage} />
              )}
              <Text style={styles.selectedLabel}>Selected Car</Text>
              <Text style={styles.selectedCar}>
                {selectedCar.year} {selectedCar.make} {selectedCar.model}
              </Text>
            </View>
          )}

          {!showForm ? (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowForm(true)}>
              <Text style={styles.addButtonText}>+ Add a Car</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.form}>
              <Text style={styles.formTitle}>Add Your Car</Text>
              <TextInput
                style={styles.input}
                placeholder="Make (e.g. BMW, Toyota)"
                placeholderTextColor={colors.textSecondary}
                value={make}
                onChangeText={setMake}
              />
              <TextInput
                style={styles.input}
                placeholder="Model (e.g. 320i, Camry)"
                placeholderTextColor={colors.textSecondary}
                value={model}
                onChangeText={setModel}
              />
              <TextInput
                style={styles.input}
                placeholder="Year (e.g. 2015)"
                placeholderTextColor={colors.textSecondary}
                value={year}
                onChangeText={setYear}
                keyboardType="numeric"
                maxLength={4}
              />

              <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                {imageUri ? (
                  <Image source={{uri: imageUri}} style={styles.photoPreview} />
                ) : (
                  <Text style={styles.photoButtonText}>📷 Add Car Photo (optional)</Text>
                )}
              </TouchableOpacity>

              <View style={styles.formButtons}>
                <TouchableOpacity style={styles.saveButton} onPress={handleAddCar}>
                  <Text style={styles.saveButtonText}>Save Car</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowForm(false);
                    setImageUri(undefined);
                  }}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {cars.length > 0 && (
            <View style={styles.carsSection}>
              <Text style={styles.sectionTitle}>Your Cars</Text>
              <FlatList
                data={cars}
                scrollEnabled={false}
                keyExtractor={item => item.id}
                renderItem={({item}) => (
                  <TouchableOpacity
                    style={[
                      styles.carCard,
                      selectedCar?.id === item.id && styles.carCardSelected,
                    ]}
                    onPress={() => selectCar(item)}
                    onLongPress={() =>
                      Alert.alert(
                        'Remove Car',
                        `Remove ${item.year} ${item.make} ${item.model}?`,
                        [
                          {text: 'Cancel', style: 'cancel'},
                          {
                            text: 'Remove',
                            style: 'destructive',
                            onPress: () => removeCar(item.id),
                          },
                        ],
                      )
                    }>
                    {item.imageUri && (
                      <Image source={{uri: item.imageUri}} style={styles.cardThumb} />
                    )}
                    <View style={styles.cardInfo}>
                      <Text style={styles.carName}>
                        {item.year} {item.make} {item.model}
                      </Text>
                      {selectedCar?.id === item.id && (
                        <Text style={styles.activeLabel}>Active</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default HomeScreen;
