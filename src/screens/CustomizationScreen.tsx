import React, {useState} from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Linking,
  Image,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {colors} from '../theme';
import styles from './styles/CustomizationScreen.styles';
import {useCar} from '../context/CarContext';
import {api} from '../services/api';

type PartResult = {
  id: string;
  title: string;
  price: number;
  currency: string;
  url: string;
  condition: string;
  source: string;
};

type ShopResult = {
  id: string;
  name: string;
  address: string;
  rating: number | null;
  totalRatings: number;
  isOpen: boolean | null;
  source: string;
};

type Tab = 'parts' | 'shops' | 'preview';

const CustomizationScreen = () => {
  const {selectedCar} = useCar();
  const [activeTab, setActiveTab] = useState<Tab>('parts');

  // Parts state
  const [query, setQuery] = useState('');
  const [parts, setParts] = useState<PartResult[]>([]);
  const [selectedParts, setSelectedParts] = useState<Set<string>>(new Set());
  const [partsLoading, setPartsLoading] = useState(false);
  const [partsError, setPartsError] = useState('');
  const [partsSource, setPartsSource] = useState('');

  // Shops state
  const [shops, setShops] = useState<ShopResult[]>([]);
  const [shopsLoading, setShopsLoading] = useState(false);
  const [shopsError, setShopsError] = useState('');

  // Image gen state
  const [imageDescription, setImageDescription] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState('');
  const [imageStatus, setImageStatus] = useState('');

  // Cost estimate state
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimate, setEstimate] = useState<any>(null);
  const [estimateError, setEstimateError] = useState('');

  const searchParts = async () => {
    if (!query.trim()) {
      return;
    }
    setPartsLoading(true);
    setPartsError('');
    try {
      const body: Record<string, string> = {query: query.trim()};
      if (selectedCar) {
        body.carMake = selectedCar.make;
        body.carModel = selectedCar.model;
        body.carYear = String(selectedCar.year);
      }
      const data = await api.post('/parts/search', body);
      setParts(data.results || []);
      setPartsSource(data.source || '');
    } catch (err: any) {
      setPartsError(err.message || 'Search failed');
    } finally {
      setPartsLoading(false);
    }
  };

  const searchShops = async () => {
    setShopsLoading(true);
    setShopsError('');
    try {
      // Use placeholder coords — real app would use Geolocation API
      const data = await api.get('/shops/nearby?latitude=37.7749&longitude=-122.4194');
      setShops(data.results || []);
    } catch (err: any) {
      setShopsError(err.message || 'Search failed');
    } finally {
      setShopsLoading(false);
    }
  };

  const getEstimate = async () => {
    const chosen = parts.filter(p => selectedParts.has(p.id));
    if (chosen.length === 0) {
      return;
    }
    setEstimateLoading(true);
    setEstimateError('');
    setEstimate(null);
    try {
      const body: Record<string, any> = {
        modifications: chosen.map(p => p.title),
      };
      if (selectedCar) {
        body.carMake = selectedCar.make;
        body.carModel = selectedCar.model;
        body.carYear = String(selectedCar.year);
      }
      const data = await api.post('/estimate', body);
      setEstimate(data);
    } catch (err: any) {
      setEstimateError(err.message || 'Estimate failed');
    } finally {
      setEstimateLoading(false);
    }
  };

  const uriToBase64DataUrl = async (uri: string): Promise<string | null> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  const generatePreview = async () => {
    if (!selectedCar) {
      setImageError('Select a car on the Home tab first');
      return;
    }
    setImageLoading(true);
    setImageError('');
    setImageStatus('Generating preview — this may take up to 60 seconds...');
    setGeneratedImageUrl(null);
    try {
      const chosenParts = parts.filter(p => selectedParts.has(p.id));

      let carImageUrl: string | undefined;
      if (selectedCar.imageUri) {
        setImageStatus('Processing car photo...');
        carImageUrl = (await uriToBase64DataUrl(selectedCar.imageUri)) ?? undefined;
      }

      const data = await api.post('/image/generate', {
        carMake: selectedCar.make,
        carModel: selectedCar.model,
        carYear: String(selectedCar.year),
        parts: chosenParts.map(p => p.title),
        description: imageDescription.trim() || undefined,
        imageUrl: carImageUrl,
      });
      if (data.status === 'succeeded' && data.imageUrl) {
        setGeneratedImageUrl(data.imageUrl);
        setImageStatus('Done!');
      } else if (data.status === 'mock') {
        setImageStatus(data.message || 'Mock mode — no Replicate token configured');
      } else {
        setImageStatus(`Status: ${data.status}`);
      }
    } catch (err: any) {
      setImageError(err.message || 'Image generation failed');
    } finally {
      setImageLoading(false);
    }
  };

  const togglePart = (id: string) => {
    setSelectedParts(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const totalCost = parts
    .filter(p => selectedParts.has(p.id))
    .reduce((sum, p) => sum + p.price, 0);

  const renderPartItem = ({item}: {item: PartResult}) => {
    const selected = selectedParts.has(item.id);
    return (
      <TouchableOpacity
        style={[styles.card, selected && styles.cardSelected]}
        onPress={() => togglePart(item.id)}
        activeOpacity={0.7}>
        <View style={styles.cardHeader}>
          <Text style={styles.partTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View
            style={[
              styles.sourceBadge,
              {
                backgroundColor:
                  item.source === 'ebay' ? '#e53e3e' : '#dd6b20',
              },
            ]}>
            <Text style={styles.sourceBadgeText}>
              {item.source === 'ebay' ? 'eBay' : 'AliExpress'}
            </Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.price}>
            ${item.price.toFixed(2)}{' '}
            <Text style={styles.condition}>{item.condition}</Text>
          </Text>
          {selected && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <TouchableOpacity
          onPress={() => item.url && Linking.openURL(item.url)}
          style={styles.linkBtn}>
          <Text style={styles.linkText}>View listing →</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderShopItem = ({item}: {item: ShopResult}) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.partTitle}>{item.name}</Text>
        {item.isOpen !== null && (
          <View
            style={[
              styles.sourceBadge,
              {backgroundColor: item.isOpen ? colors.accent : colors.danger},
            ]}>
            <Text style={styles.sourceBadgeText}>
              {item.isOpen ? 'Open' : 'Closed'}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.shopAddress}>{item.address}</Text>
      {item.rating !== null && (
        <Text style={styles.shopRating}>
          ⭐ {item.rating} ({item.totalRatings} reviews)
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>🎨 Customization</Text>

      {selectedCar && (
        <View style={styles.carBanner}>
          <Text style={styles.carBannerText}>
            {selectedCar.year} {selectedCar.make} {selectedCar.model}
          </Text>
        </View>
      )}

      {/* Tab bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'parts' && styles.tabActive]}
          onPress={() => setActiveTab('parts')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'parts' && styles.tabTextActive,
            ]}>
            🛒 Online Parts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'shops' && styles.tabActive]}
          onPress={() => {
            setActiveTab('shops');
            if (shops.length === 0 && !shopsLoading) {
              searchShops();
            }
          }}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'shops' && styles.tabTextActive,
            ]}>
            📍 Local Shops
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'preview' && styles.tabActive]}
          onPress={() => setActiveTab('preview')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'preview' && styles.tabTextActive,
            ]}>
            🖼️ Preview
          </Text>
        </TouchableOpacity>
      </View>

      {/* Parts tab */}
      {activeTab === 'parts' && (
        <View style={styles.content}>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search parts (e.g. brake pads, spoiler)"
              placeholderTextColor={colors.textSecondary}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={searchParts}
              returnKeyType="search"
            />
            <TouchableOpacity
              style={styles.searchBtn}
              onPress={searchParts}
              disabled={partsLoading}>
              <Text style={styles.searchBtnText}>
                {partsLoading ? '...' : '🔍'}
              </Text>
            </TouchableOpacity>
          </View>

          {partsSource !== '' && parts.length > 0 && (
            <Text style={styles.sourceLabel}>
              Source: {partsSource === 'ebay' ? 'eBay' : 'AliExpress'} ·{' '}
              {parts.length} results
            </Text>
          )}

          {partsError !== '' && (
            <Text style={styles.errorText}>{partsError}</Text>
          )}

          {partsLoading ? (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={styles.loader}
            />
          ) : parts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔧</Text>
              <Text style={styles.emptyText}>
                Search for parts to get started
              </Text>
              {!selectedCar && (
                <Text style={styles.emptyHint}>
                  Tip: Select a car on the Home tab for personalized results
                </Text>
              )}
            </View>
          ) : (
            <>
              <FlatList
                data={parts}
                renderItem={renderPartItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
              />
              {selectedParts.size > 0 && (
                <View>
                  <View style={styles.totalBar}>
                    <Text style={styles.totalText}>
                      {selectedParts.size} part
                      {selectedParts.size > 1 ? 's' : ''} selected
                    </Text>
                    <Text style={styles.totalPrice}>
                      Total: ${totalCost.toFixed(2)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.estimateBtn}
                    onPress={getEstimate}
                    disabled={estimateLoading}>
                    <Text style={styles.estimateBtnText}>
                      {estimateLoading ? 'Estimating...' : '💰 Get Full Cost Estimate'}
                    </Text>
                  </TouchableOpacity>
                  {estimateError !== '' && (
                    <Text style={styles.errorText}>{estimateError}</Text>
                  )}
                  {estimate && (
                    <View style={styles.estimateCard}>
                      <Text style={styles.estimateTitle}>Cost Breakdown</Text>
                      {estimate.items?.map((item: any, i: number) => (
                        <View key={i} style={styles.estimateRow}>
                          <Text style={styles.estimateItemName}>{item.name}</Text>
                          <Text style={styles.estimateItemCost}>
                            Parts: ${item.partsCostLow}-${item.partsCostHigh}
                          </Text>
                          <Text style={styles.estimateItemCost}>
                            Labor: ${item.laborCostLow}-${item.laborCostHigh} ({item.laborHours}h)
                          </Text>
                          {item.notes ? (
                            <Text style={styles.estimateNote}>{item.notes}</Text>
                          ) : null}
                        </View>
                      ))}
                      <View style={styles.estimateTotalRow}>
                        <Text style={styles.estimateTotalLabel}>Grand Total</Text>
                        <Text style={styles.estimateTotalValue}>
                          ${estimate.grandTotalLow} - ${estimate.grandTotalHigh}
                        </Text>
                      </View>
                      {estimate.disclaimer ? (
                        <Text style={styles.estimateDisclaimer}>{estimate.disclaimer}</Text>
                      ) : null}
                    </View>
                  )}
                </View>
              )}
            </>
          )}
        </View>
      )}

      {/* Shops tab */}
      {activeTab === 'shops' && (
        <View style={styles.content}>
          {shopsError !== '' && (
            <Text style={styles.errorText}>{shopsError}</Text>
          )}
          {shopsLoading ? (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={styles.loader}
            />
          ) : shops.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📍</Text>
              <Text style={styles.emptyText}>Finding nearby shops...</Text>
            </View>
          ) : (
            <FlatList
              data={shops}
              renderItem={renderShopItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      )}
      {/* Preview tab */}
      {activeTab === 'preview' && (
        <ScrollView style={styles.content} contentContainerStyle={styles.previewContent}>
          <Text style={styles.previewHeading}>AI Mod Preview</Text>
          <Text style={styles.previewSubtext}>
            {selectedParts.size > 0
              ? `${selectedParts.size} part${selectedParts.size > 1 ? 's' : ''} selected`
              : 'Select parts in the Online Parts tab, or describe your mods below'}
          </Text>

          <TextInput
            style={styles.descInput}
            placeholder="Describe your mods (e.g. matte black wrap, lowered suspension)"
            placeholderTextColor={colors.textSecondary}
            value={imageDescription}
            onChangeText={setImageDescription}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity
            style={[
              styles.generateBtn,
              imageLoading && styles.generateBtnDisabled,
            ]}
            onPress={generatePreview}
            disabled={imageLoading}>
            {imageLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.generateBtnText}>Generate Preview</Text>
            )}
          </TouchableOpacity>

          {imageError !== '' && (
            <Text style={styles.errorText}>{imageError}</Text>
          )}

          {imageStatus !== '' && !imageError && (
            <View style={styles.statusCard}>
              <Text style={styles.statusText}>{imageStatus}</Text>
            </View>
          )}

          {generatedImageUrl && (
            <View style={styles.imageContainer}>
              <Text style={styles.imageLabel}>Generated Preview</Text>
              <Image
                source={{uri: generatedImageUrl}}
                style={styles.generatedImage}
                resizeMode="contain"
              />
            </View>
          )}

          {!selectedCar && (
            <Text style={styles.emptyHint}>
              Tip: Select a car on the Home tab to get accurate previews
            </Text>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default CustomizationScreen;
