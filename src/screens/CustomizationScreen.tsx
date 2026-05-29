import React, {useState, useRef, useEffect} from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Linking,
  Image,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRoute, RouteProp} from '@react-navigation/native';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import {colors} from '../theme';
import styles from './styles/CustomizationScreen.styles';
import {useCar} from '../context/CarContext';
import {useMarket} from '../context/MarketContext';
import {getMarket} from '../data/markets';
import {api, IMAGE_REQUEST_TIMEOUT_MS} from '../services/api';
import {imageUriToBase64DataUrl} from '../utils/imageUriToBase64';
import AppIcon from '../components/ui/AppIcon';
import PressableScale from '../components/ui/PressableScale';
import CarSelector from '../components/CarSelector';
import MarketSelector from '../components/MarketSelector';
import type {RootTabParamList} from '../types';

type PartResult = {
  id: string;
  title: string;
  price: number;
  currency: string;
  url: string;
  condition: string;
  source: string;
  imageUrl?: string;
};

type ShopResult = {
  id: string;
  name: string;
  address: string;
  rating: number | null;
  totalRatings: number;
  isOpen: boolean | null;
  source: string;
  latitude?: number;
  longitude?: number;
  mapsUrl?: string;
  imageUrl?: string | null;
  phone?: string | null;
  website?: string | null;
  hoursSummary?: string | null;
};

type AIPart = {
  id: string;
  name: string;
  price: number;
  currency: string;
  condition: string;
  source: string;
  purchaseUrl: string;
  imageUrl?: string;
};

type ChatMessage = {
  id: string;
  role: 'user' | 'ai';
  content: string;
  parts?: AIPart[];
};

const PART_CATEGORIES = [
  {id: 'wheels', label: 'Wheels', icon: 'tire', query: 'alloy wheels'},
  {id: 'exhaust', label: 'Exhaust', icon: 'pipe', query: 'performance exhaust'},
  {id: 'brakes', label: 'Brakes', icon: 'car-brake-abs', query: 'brake pads'},
  {id: 'lights', label: 'Lights', icon: 'car-light-dimmed', query: 'LED headlights'},
  {id: 'spoilers', label: 'Spoilers', icon: 'car-sports', query: 'rear spoiler'},
  {id: 'interior', label: 'Interior', icon: 'car-seat', query: 'interior trim kit'},
];

const TRENDING_MODS = [
  'Coilovers',
  'Cold air intake',
  'Cat-back exhaust',
  'Body kit',
  'Carbon fiber hood',
];

type Tab = 'parts' | 'shops' | 'preview';

const getSourceLabel = (source: string) => {
  switch (source) {
    case 'ebay': return 'eBay';
    case 'aliexpress': return 'AliExpress';
    case 'serper': return 'Google';
    default: return source.charAt(0).toUpperCase() + source.slice(1);
  }
};

const getSourceColor = (source: string) => {
  switch (source) {
    case 'ebay': return '#e53e3e';
    case 'aliexpress': return '#dd6b20';
    case 'serper': return '#1a73e8';
    default: return '#718096';
  }
};

const formatPartPrice = (price: number, currency: string) => {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    AED: 'AED ',
  };
  const sym = symbols[currency] || `${currency} `;
  return `${sym}${price.toFixed(2)}`;
};

const CustomizationScreen = () => {
  const route = useRoute<RouteProp<RootTabParamList, 'Customization'>>();
  const {selectedCar} = useCar();
  const {countryCode} = useMarket();
  const [activeTab, setActiveTab] = useState<Tab>('parts');

  // Parts state
  const [query, setQuery] = useState('');
  const [parts, setParts] = useState<PartResult[]>([]);
  const [selectedParts, setSelectedParts] = useState<Set<string>>(new Set());
  const [buildParts, setBuildParts] = useState<PartResult[]>([]);
  const [partsLoading, setPartsLoading] = useState(false);
  const [partsError, setPartsError] = useState('');
  const [partsSource, setPartsSource] = useState('');
  const [partsDiagnostic, setPartsDiagnostic] = useState('');
  const [optimizedQuery, setOptimizedQuery] = useState('');
  const [partsMarketLabel, setPartsMarketLabel] = useState('');
  const lastPartsQueryRef = useRef('');

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
  const [previewImageUri, setPreviewImageUri] = useState<string | undefined>();
  const [previewImageDataUrl, setPreviewImageDataUrl] = useState<string | undefined>();
  const [refinementText, setRefinementText] = useState('');
  const [refinementHistory, setRefinementHistory] = useState<string[]>([]);

  // Build modal state
  const [buildModalOpen, setBuildModalOpen] = useState(false);

  // Cost estimate state
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimate, setEstimate] = useState<any>(null);
  const [estimateError, setEstimateError] = useState('');

  // AI chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [detailPart, setDetailPart] = useState<AIPart | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatConversationId, setChatConversationId] = useState<number | null>(null);
  const chatListRef = useRef<FlatList>(null);

  const searchParts = async (searchQuery?: string) => {
    const q = (searchQuery ?? query).trim();
    if (!q) {
      return;
    }
    if (searchQuery) {
      setQuery(searchQuery);
    }
    lastPartsQueryRef.current = q;
    setPartsLoading(true);
    setPartsError('');
    setPartsDiagnostic('');
    try {
      const body: Record<string, string> = {query: q, countryCode};
      if (selectedCar) {
        body.carMake = selectedCar.make;
        body.carModel = selectedCar.model;
        body.carYear = String(selectedCar.year);
      }
      const data = await api.post('/parts/search', body);
      setParts(data.results || []);
      setPartsSource(data.source || '');
      setOptimizedQuery(data.query || '');
      setPartsMarketLabel(data.marketLabel || getMarket(countryCode).label);
      if (data.mockFallback) {
        setPartsDiagnostic(
          data.diagnostic ||
            'Sample parts only — configure SERPER_API_KEY on the server for real Google Shopping results.',
        );
      }
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
      const market = getMarket(countryCode);
      const data = await api.get(
        `/shops/nearby?latitude=${market.latitude}&longitude=${market.longitude}&countryCode=${countryCode}`,
      );
      setShops(data.results || []);
    } catch (err: any) {
      setShopsError(err.message || 'Search failed');
    } finally {
      setShopsLoading(false);
    }
  };

  useEffect(() => {
    if (route.params?.tab) {
      setActiveTab(route.params.tab);
    }
  }, [route.params?.tab]);

  useEffect(() => {
    if (
      route.params?.tab === 'shops' &&
      shops.length === 0 &&
      !shopsLoading
    ) {
      searchShops();
    }
  }, [route.params?.tab]);

  useEffect(() => {
    if (activeTab === 'shops') {
      searchShops();
    }
  }, [countryCode, activeTab]);

  useEffect(() => {
    if (activeTab === 'parts' && lastPartsQueryRef.current) {
      searchParts(lastPartsQueryRef.current);
    }
  }, [countryCode]);

  const getEstimate = async () => {
    const chosen = buildParts;
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

  const pickPreviewImage = () => {
    Alert.alert('Car Photo', 'Choose a photo for this preview', [
      {
        text: 'Camera',
        onPress: () =>
          launchCamera(
            {mediaType: 'photo', quality: 0.7, maxWidth: 1280, includeBase64: true},
            res => {
              const asset = res.assets?.[0];
              if (asset?.uri) {
                setPreviewImageUri(asset.uri);
                setPreviewImageDataUrl(
                  asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : undefined,
                );
              }
            },
          ),
      },
      {
        text: 'Photo Library',
        onPress: () =>
          launchImageLibrary(
            {mediaType: 'photo', quality: 0.7, maxWidth: 1280, includeBase64: true},
            res => {
              const asset = res.assets?.[0];
              if (asset?.uri) {
                setPreviewImageUri(asset.uri);
                setPreviewImageDataUrl(
                  asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : undefined,
                );
              }
            },
          ),
      },
      {text: 'Cancel', style: 'cancel'},
    ]);
  };

  const generatePreview = async () => {
    if (!selectedCar) {
      setImageError('Select a car on the Home tab first');
      return;
    }
    setImageLoading(true);
    setImageError('');
    setImageStatus('Generating preview — may take up to 2 minutes...');
    setGeneratedImageUrl(null);
    setRefinementHistory([]);
    try {
      const chosenParts = buildParts;

      let carImageUrl: string | undefined;
      const imageSource = previewImageUri || selectedCar.imageUri;
      if (previewImageDataUrl) {
        carImageUrl = previewImageDataUrl;
      } else if (imageSource) {
        setImageStatus('Processing car photo...');
        carImageUrl = (await imageUriToBase64DataUrl(imageSource)) ?? undefined;
      }

      if (imageSource && !carImageUrl) {
        setImageError(
          'Could not read your car photo. Tap the thumbnail and pick the photo again.',
        );
        return;
      }

      if (!carImageUrl) {
        setImageError('Add a car photo first — tap the camera thumbnail above the description.');
        return;
      }

      const data = await api.post(
        '/image/generate',
        {
          carMake: selectedCar.make,
          carModel: selectedCar.model,
          carYear: String(selectedCar.year),
          parts: chosenParts.map(p => p.title),
          description: imageDescription.trim() || undefined,
          imageUrl: carImageUrl,
        },
        {timeoutMs: IMAGE_REQUEST_TIMEOUT_MS},
      );
      if (data.status === 'succeeded' && data.imageUrl) {
        setGeneratedImageUrl(data.imageUrl);
        if (data.usedReferenceImage === false) {
          setImageStatus('Done (no reference photo was used — result may look different)');
        } else {
          setImageStatus(`Done! (${data.provider || 'AI edit'})`);
        }
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

  const refinePreview = async () => {
    if (!generatedImageUrl || !refinementText.trim() || imageLoading) return;

    const fix = refinementText.trim();
    setImageLoading(true);
    setImageError('');
    setImageStatus('Applying fix — may take up to 2 minutes...');

    try {
      const data = await api.post(
        '/image/generate',
        {
          carMake: selectedCar?.make,
          carModel: selectedCar?.model,
          carYear: String(selectedCar?.year),
          parts: [],
          description: fix,
          imageUrl: generatedImageUrl,
          refine: true,
        },
        {timeoutMs: IMAGE_REQUEST_TIMEOUT_MS},
      );
      if (data.status === 'succeeded' && data.imageUrl) {
        setGeneratedImageUrl(data.imageUrl);
        setRefinementHistory(prev => [...prev, fix]);
        setRefinementText('');
        setImageStatus('Fix applied!');
      }
    } catch (err: any) {
      setImageError(err.message || 'Refinement failed');
    } finally {
      setImageLoading(false);
    }
  };

  const togglePart = (id: string) => {
    setSelectedParts(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setBuildParts(bp => bp.filter(p => p.id !== id));
      } else {
        next.add(id);
        const part = parts.find(p => p.id === id);
        if (part) setBuildParts(bp => [...bp, part]);
      }
      return next;
    });
  };

  const addPartFromAI = (aiPart: AIPart) => {
    const mapped: PartResult = {
      id: aiPart.id,
      title: aiPart.name,
      price: aiPart.price,
      currency: aiPart.currency,
      url: aiPart.purchaseUrl,
      condition: aiPart.condition,
      source: aiPart.source,
    };
    setParts(prev => {
      if (prev.find(p => p.id === mapped.id)) return prev;
      return [mapped, ...prev];
    });
    setSelectedParts(prev => new Set([...prev, mapped.id]));
    setBuildParts(prev => {
      if (prev.find(p => p.id === mapped.id)) return prev;
      return [...prev, mapped];
    });
    setChatOpen(false);
    setActiveTab('parts');
  };

  const sendChatMessage = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;

    const userMsg: ChatMessage = {id: Date.now().toString(), role: 'user', content: text};
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const selectedPartNames = parts
        .filter(p => selectedParts.has(p.id))
        .map(p => p.title);

      const contextNote = selectedPartNames.length > 0
        ? ` (User already has these parts selected: ${selectedPartNames.join(', ')})`
        : '';

      const res = await api.post('/chat', {
        message: text + contextNote,
        conversationId: chatConversationId,
        carId: selectedCar?.id,
        countryCode,
      });

      if (res.conversationId && !chatConversationId) {
        setChatConversationId(res.conversationId);
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: res.response,
        parts: res.parts?.length > 0 ? res.parts : undefined,
      };
      setChatMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      setChatMessages(prev => [
        ...prev,
        {id: (Date.now() + 1).toString(), role: 'ai', content: `Error: ${err.message}`},
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const totalCost = buildParts.reduce((sum, p) => sum + p.price, 0);

  const renderPartItem = ({item}: {item: PartResult}) => {
    const selected = selectedParts.has(item.id);
    return (
      <TouchableOpacity
        style={[styles.card, selected && styles.cardSelected]}
        onPress={() => togglePart(item.id)}
        activeOpacity={0.7}>
        {item.imageUrl ? (
          <Image source={{uri: item.imageUrl}} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <AppIcon name="wrench" size={36} color={colors.textMuted} />
          </View>
        )}
        <View style={styles.cardHeader}>
          <Text style={styles.partTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View
            style={[
              styles.sourceBadge,
              {backgroundColor: getSourceColor(item.source)},
            ]}>
            <Text style={styles.sourceBadgeText}>
              {getSourceLabel(item.source)}
            </Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.price}>
            {formatPartPrice(item.price, item.currency)}{' '}
            <Text style={styles.condition}>{item.condition}</Text>
          </Text>
          {selected && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <TouchableOpacity
          onPress={() => setDetailPart({id: item.id, name: item.title, price: item.price, currency: item.currency, condition: item.condition, source: item.source, purchaseUrl: item.url, imageUrl: item.imageUrl})}
          style={styles.linkBtn}>
          <Text style={styles.linkText}>View details →</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const openShopOnMaps = (item: ShopResult) => {
    const {latitude, longitude} = item;
    const url =
      latitude != null &&
      longitude != null &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude)
        ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
        : item.mapsUrl ||
          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${item.name} ${item.address}`)}`;
    Linking.openURL(url);
  };

  const openShopWebsite = (url: string) => {
    const withScheme = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    Linking.openURL(withScheme);
  };

  const renderShopInfoRow = (
    icon: string,
    text: string,
    onPress?: () => void,
  ) => {
    const content = (
      <View style={styles.shopInfoRow}>
        <AppIcon name={icon} size={16} color={colors.primary} />
        <Text
          style={[styles.shopInfoText, onPress ? styles.shopInfoLink : null]}
          numberOfLines={4}>
          {text}
        </Text>
      </View>
    );
    if (onPress) {
      return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
          {content}
        </TouchableOpacity>
      );
    }
    return content;
  };

  const formatShopRating = (rating: ShopResult['rating']) => {
    if (rating == null) {
      return null;
    }
    const n = typeof rating === 'number' ? rating : parseFloat(String(rating));
    return Number.isFinite(n) ? n.toFixed(1) : String(rating);
  };

  const renderShopCard = (item: ShopResult) => {
    const ratingLabel = formatShopRating(item.rating);
    return (
      <View key={item.id} style={styles.shopCardWrap}>
        <View style={styles.shopCard}>
          {item.imageUrl ? (
            <Image source={{uri: item.imageUrl}} style={styles.shopCardImage} />
          ) : (
            <View style={[styles.shopCardImage, styles.shopCardImagePlaceholder]}>
              <AppIcon name="storefront-outline" size={40} color={colors.textMuted} />
            </View>
          )}

          <View style={styles.shopCardBody}>
            {item.isOpen !== null && (
              <View
                style={[
                  styles.shopStatusBadge,
                  {backgroundColor: item.isOpen ? colors.accent : colors.danger},
                ]}>
                <Text style={styles.shopStatusText}>
                  {item.isOpen ? 'Open now' : 'Closed'}
                </Text>
              </View>
            )}

            <Text style={styles.shopCardTitle}>{item.name}</Text>

            {renderShopInfoRow('map-marker-radius', item.address)}

            {ratingLabel != null &&
              renderShopInfoRow(
                'star',
                `${ratingLabel} · ${item.totalRatings} reviews`,
              )}

            {item.phone ? renderShopInfoRow('phone', item.phone) : null}

            {item.hoursSummary
              ? renderShopInfoRow('clock-outline', item.hoursSummary)
              : null}

            {item.website
              ? renderShopInfoRow('web', item.website, () =>
                  openShopWebsite(item.website!),
                )
              : null}

            <TouchableOpacity
              style={styles.shopMapsBtn}
              onPress={() => openShopOnMaps(item)}
              activeOpacity={0.85}>
              <AppIcon name="map-marker-radius" size={18} color="#0B0B0B" />
              <Text style={styles.shopMapsBtnText}>Open in Google Maps</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Customization</Text>
      <Text style={styles.titleSub}>Premium parts marketplace</Text>

      <CarSelector style={styles.carBannerSpacing} />

      {/* Tab bar */}
      <View style={styles.tabBar}>
        <PressableScale
          style={[styles.tab, activeTab === 'parts' && styles.tabActive]}
          onPress={() => setActiveTab('parts')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'parts' && styles.tabTextActive,
            ]}>
            Parts
          </Text>
        </PressableScale>
        <PressableScale
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
            Shops
          </Text>
        </PressableScale>
        <PressableScale
          style={[styles.tab, activeTab === 'preview' && styles.tabActive]}
          onPress={() => setActiveTab('preview')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'preview' && styles.tabTextActive,
            ]}>
            Preview
          </Text>
        </PressableScale>
      </View>

      {/* Parts tab */}
      {activeTab === 'parts' && (
        <View style={styles.content}>
          <MarketSelector />
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search parts (e.g. brake pads, spoiler)"
              placeholderTextColor={colors.textSecondary}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => searchParts()}
              returnKeyType="search"
            />
            <PressableScale
              style={styles.searchBtn}
              onPress={() => searchParts()}
              disabled={partsLoading}>
              {partsLoading ? (
                <ActivityIndicator color="#0B0B0B" size="small" />
              ) : (
                <AppIcon name="magnify" size={24} color="#0B0B0B" />
              )}
            </PressableScale>
          </View>

          {partsSource !== '' && parts.length > 0 && (
            <>
              <Text style={styles.sourceLabel}>
                {partsMarketLabel
                  ? `Market: ${partsMarketLabel} · `
                  : ''}
                Source: {getSourceLabel(partsSource)} · {parts.length} results
              </Text>
              {optimizedQuery ? (
                <Text style={styles.optimizedQueryLabel} numberOfLines={2}>
                  Searched: "{optimizedQuery}"
                </Text>
              ) : null}
            </>
          )}

          {partsDiagnostic !== '' && (
            <Text style={styles.warningText}>{partsDiagnostic}</Text>
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
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.emptyState}>
                <View style={styles.emptyIconWrap}>
                  <AppIcon name="storefront-outline" size={36} color={colors.primary} />
                </View>
                <Text style={styles.emptyText}>
                  Discover premium modifications
                </Text>
                {!selectedCar && (
                  <Text style={styles.emptyHint}>
                    Select a car on Home for personalized results
                  </Text>
                )}
              </View>
              <View style={styles.categorySection}>
                <Text style={styles.categorySectionTitle}>Featured categories</Text>
                <View style={styles.categoryGrid}>
                  {PART_CATEGORIES.map(cat => (
                    <PressableScale
                      key={cat.id}
                      style={styles.categoryCard}
                      onPress={() => searchParts(cat.query)}>
                      <View style={styles.categoryIcon}>
                        <AppIcon name={cat.icon} size={22} color={colors.primary} />
                      </View>
                      <Text style={styles.categoryLabel}>{cat.label}</Text>
                    </PressableScale>
                  ))}
                </View>
              </View>
              <View style={styles.trendingRow}>
                <Text style={styles.categorySectionTitle}>Trending modifications</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {TRENDING_MODS.map(mod => (
                    <PressableScale
                      key={mod}
                      style={styles.trendingChip}
                      onPress={() => searchParts(mod)}>
                      <Text style={styles.trendingText}>{mod}</Text>
                    </PressableScale>
                  ))}
                </ScrollView>
              </View>
            </ScrollView>
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
                  {/* Selected parts tray */}
                  <View style={styles.cartTray}>
                    <View style={styles.cartTrayHeader}>
                      <Text style={styles.cartTrayTitle}>
                        Build ({selectedParts.size})
                      </Text>
                      <Text style={styles.cartTrayTotal}>
                        ${totalCost.toFixed(2)}
                      </Text>
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.cartTrayScroll}>
                      {buildParts.map(p => (
                        <View key={p.id} style={styles.cartCard}>
                          {p.imageUrl ? (
                            <Image
                              source={{uri: p.imageUrl}}
                              style={styles.cartCardImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={[styles.cartCardImage, styles.cartCardImagePlaceholder]}>
                              <AppIcon name="wrench" size={18} color={colors.textMuted} />
                            </View>
                          )}
                          <View style={styles.cartCardInfo}>
                            <Text style={styles.cartCardName} numberOfLines={2}>
                              {p.title}
                            </Text>
                            <Text style={styles.cartCardPrice}>
                              ${p.price.toFixed(0)}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={styles.cartCardRemove}
                            onPress={() => togglePart(p.id)}>
                            <AppIcon name="close-circle" size={18} color={colors.textMuted} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
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
                      {estimateLoading ? 'Estimating...' : 'Get Full Cost Estimate'}
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
                          <View style={styles.estimateCostLine}>
                            <Text style={styles.estimateCostLabel}>Parts</Text>
                            <Text style={styles.estimateItemCost}>
                              ${item.partsCostLow} – ${item.partsCostHigh}
                            </Text>
                          </View>
                          <View style={styles.estimateCostLine}>
                            <Text style={styles.estimateCostLabel}>Labor</Text>
                            <Text style={styles.estimateItemCost}>
                              ${item.laborCostLow} – ${item.laborCostHigh}
                              {item.laborHours ? ` · ${item.laborHours}h` : ''}
                            </Text>
                          </View>
                          {item.notes ? (
                            <Text style={styles.estimateNote}>{item.notes}</Text>
                          ) : null}
                        </View>
                      ))}
                      <View style={styles.estimateTotalRow}>
                        <Text style={styles.estimateTotalLabel}>Grand total</Text>
                        <Text style={styles.estimateTotalValue}>
                          ${estimate.grandTotalLow} – ${estimate.grandTotalHigh}
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
        <View style={styles.shopsTab}>
          <View style={styles.shopsTabHeader}>
            <MarketSelector />
            <Text style={styles.shopsTabSubtitle}>
              Auto parts & service near you · {getMarket(countryCode).label}
            </Text>
          </View>
          {shopsError !== '' && (
            <Text style={styles.errorText}>{shopsError}</Text>
          )}
          {shopsLoading ? (
            <View style={styles.shopsCentered}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.shopsLoadingText}>Finding shops…</Text>
            </View>
          ) : shops.length === 0 ? (
            <View style={styles.shopsCentered}>
              <View style={styles.emptyIconWrap}>
                <AppIcon name="map-marker-radius" size={36} color={colors.primary} />
              </View>
              <Text style={[styles.emptyText, styles.shopsEmptyTitle]}>
                No shops loaded yet
              </Text>
              <Text style={styles.emptyHint}>
                Search for mechanics and parts stores in {getMarket(countryCode).label}
              </Text>
              <TouchableOpacity
                style={styles.refreshShopsBtn}
                onPress={searchShops}
                activeOpacity={0.85}>
                <Text style={styles.refreshShopsText}>Search shops</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              style={styles.shopsScroll}
              contentContainerStyle={styles.shopsList}
              showsVerticalScrollIndicator={false}>
              {shops.map(renderShopCard)}
            </ScrollView>
          )}
        </View>
      )}
      {/* Preview tab */}
      {activeTab === 'preview' && (
        <ScrollView style={styles.content} contentContainerStyle={styles.previewContent}>
          <Text style={styles.previewHeading}>AI Mod Preview</Text>

          {/* Selected parts summary — taps to open modal */}
          {selectedParts.size > 0 ? (
            <TouchableOpacity style={styles.previewCart} onPress={() => setBuildModalOpen(true)} activeOpacity={0.75}>
              <View style={styles.previewCartRow}>
                <View style={styles.previewCartIconWrap}>
                  <AppIcon name="wrench" size={18} color={colors.primary} />
                </View>
                <View style={styles.previewCartMeta}>
                  <Text style={styles.previewCartTitle}>
                    Parts in your build ({selectedParts.size})
                  </Text>
                  <Text style={styles.previewCartPrice}>
                    Total: ${totalCost.toFixed(2)}
                  </Text>
                </View>
                <AppIcon name="chevron-right" size={20} color={colors.textMuted} />
              </View>
              <Text style={styles.previewCartHint}>Tap to view or remove parts</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.previewSubtext}>
              Select parts in the Online Parts tab or via the AI assistant, then generate a preview
            </Text>
          )}

          <View style={styles.descRow}>
            <TouchableOpacity style={styles.descAttachBtn} onPress={pickPreviewImage}>
              {previewImageUri || selectedCar?.imageUri ? (
                <Image
                  source={{uri: previewImageUri || selectedCar?.imageUri}}
                  style={styles.descAttachThumb}
                  resizeMode="cover"
                />
              ) : (
                <AppIcon name="camera-plus-outline" size={22} color={colors.textMuted} />
              )}
            </TouchableOpacity>
            <TextInput
              style={[styles.descInput, styles.descInputFlex]}
              placeholder="Describe changes only (e.g. change paint to black — keeps same photo & background)"
              placeholderTextColor={colors.textSecondary}
              value={imageDescription}
              onChangeText={setImageDescription}
              multiline
              numberOfLines={3}
            />
          </View>

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

          {generatedImageUrl && (
            <View style={styles.refineSection}>
              <Text style={styles.refineTitle}>Refine this preview</Text>
              {refinementHistory.length > 0 && (
                <View style={styles.refineHistory}>
                  {refinementHistory.map((r, i) => (
                    <Text key={i} style={styles.refineHistoryItem}>✓ {r}</Text>
                  ))}
                </View>
              )}
              <TextInput
                style={styles.descInput}
                placeholder="Small edits only (e.g. change paint to black, gold wheels — keeps same scene)"
                placeholderTextColor={colors.textSecondary}
                value={refinementText}
                onChangeText={setRefinementText}
                multiline
              />
              <TouchableOpacity
                style={[
                  styles.generateBtn,
                  styles.refineBtn,
                  (!refinementText.trim() || imageLoading) && styles.generateBtnDisabled,
                ]}
                onPress={refinePreview}
                disabled={!refinementText.trim() || imageLoading}>
                {imageLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.generateBtnText}>Apply Fix</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {!selectedCar && (
            <Text style={styles.emptyHint}>
              Tip: Select a car on the Home tab to get accurate previews
            </Text>
          )}
        </ScrollView>
      )}
      {/* Build Parts Modal */}
      <Modal visible={buildModalOpen} animationType="slide" transparent onRequestClose={() => setBuildModalOpen(false)}>
        <View style={styles.detailOverlay}>
          <View style={styles.buildPanel}>
            <View style={styles.buildModalHeader}>
              <Text style={styles.buildModalTitle}>Parts in your build</Text>
              <TouchableOpacity onPress={() => setBuildModalOpen(false)} style={styles.chatCloseBtn}>
                <AppIcon name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.buildModalList} showsVerticalScrollIndicator={false}>
              {buildParts.map(p => (
                <View key={p.id} style={styles.buildModalItem}>
                  {p.imageUrl ? (
                    <Image source={{uri: p.imageUrl}} style={styles.buildModalThumb} resizeMode="cover" />
                  ) : (
                    <View style={[styles.buildModalThumb, styles.buildModalThumbPlaceholder]}>
                      <AppIcon name="wrench" size={20} color={colors.textMuted} />
                    </View>
                  )}
                  <View style={styles.buildModalInfo}>
                    <Text style={styles.buildModalItemName} numberOfLines={2}>{p.title}</Text>
                    <View style={styles.buildModalItemMeta}>
                      <View style={[styles.sourceBadge, {backgroundColor: getSourceColor(p.source)}]}>
                        <Text style={styles.sourceBadgeText}>{getSourceLabel(p.source)}</Text>
                      </View>
                      <Text style={styles.buildModalItemPrice}>${p.price.toFixed(2)}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.buildModalRemove} onPress={() => togglePart(p.id)}>
                    <AppIcon name="trash-can-outline" size={22} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            <View style={styles.buildModalFooter}>
              <Text style={styles.buildModalTotal}>
                {selectedParts.size} part{selectedParts.size !== 1 ? 's' : ''} · ${totalCost.toFixed(2)}
              </Text>
              <TouchableOpacity style={styles.buildModalCloseBtn} onPress={() => setBuildModalOpen(false)}>
                <Text style={styles.buildModalCloseBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Part Detail Modal */}
      {detailPart && (
        <Modal visible animationType="slide" transparent onRequestClose={() => setDetailPart(null)}>
          <View style={styles.detailOverlay}>
            <View style={styles.detailPanel}>
              {detailPart.imageUrl ? (
                <Image source={{uri: detailPart.imageUrl}} style={styles.detailImage} resizeMode="cover" />
              ) : (
                <View style={styles.detailImagePlaceholder}>
                  <AppIcon name="wrench" size={48} color={colors.textMuted} />
                </View>
              )}
              <View style={styles.detailBody}>
                <View style={styles.detailSourceRow}>
                  <Text style={styles.detailSource}>{getSourceLabel(detailPart.source)}</Text>
                  <Text style={styles.detailCondition}>{detailPart.condition}</Text>
                </View>
                <Text style={styles.detailName}>{detailPart.name}</Text>
                <Text style={styles.detailPrice}>{detailPart.currency} {detailPart.price.toFixed(2)}</Text>
                <TouchableOpacity
                  style={styles.detailAddBtn}
                  onPress={() => { addPartFromAI(detailPart); setDetailPart(null); }}>
                  <Text style={styles.detailAddBtnText}>+ Add to build</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.detailBuyBtn}
                  onPress={() => { Linking.openURL(detailPart.purchaseUrl); setDetailPart(null); }}>
                  <Text style={styles.detailBuyBtnText}>Buy on {getSourceLabel(detailPart.source)} →</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.detailCloseBtn} onPress={() => setDetailPart(null)}>
                  <Text style={styles.detailCloseBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Floating AI button */}
      <PressableScale
        style={[styles.aiFab, {alignSelf: 'auto'}]}
        onPress={() => setChatOpen(true)}>
        <AppIcon name="robot-outline" size={28} color="#0B0B0B" />
      </PressableScale>

      {/* AI Chat Modal */}
      <Modal
        visible={chatOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setChatOpen(false)}>
        <View style={styles.chatModal}>
          <KeyboardAvoidingView
            style={styles.chatPanel}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

            {/* Header */}
            <View style={styles.chatHeader}>
              <Text style={styles.chatHeaderTitle}>AI Customization Assistant</Text>
              <TouchableOpacity style={styles.chatCloseBtn} onPress={() => setChatOpen(false)}>
                <AppIcon name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Messages */}
            <FlatList
              ref={chatListRef}
              data={chatMessages}
              keyExtractor={item => item.id}
              contentContainerStyle={chatMessages.length === 0 ? undefined : styles.chatMessageList}
              onContentSizeChange={() => chatListRef.current?.scrollToEnd({animated: true})}
              ListEmptyComponent={
                <View style={styles.chatEmptyState}>
                  <AppIcon name="chat-outline" size={40} color={colors.primary} />
                  <Text style={styles.chatEmptyText}>
                    Ask me anything about mods or parts
                    {selectedCar ? ` for your ${selectedCar.year} ${selectedCar.make} ${selectedCar.model}` : ''}.
                    {'\n\n'}I'll suggest parts you can add directly to your list.
                  </Text>
                </View>
              }
              renderItem={({item}) => (
                <View style={[styles.chatBubbleWrapper, {alignItems: item.role === 'user' ? 'flex-end' : 'flex-start'}]}>
                  <View style={[styles.chatBubble, item.role === 'user' ? styles.chatUserBubble : styles.chatAiBubble]}>
                    <Text style={styles.chatRoleLabel}>
                      {item.role === 'user' ? 'You' : 'CarMod AI'}
                    </Text>
                    <Text style={styles.chatMessageText}>{item.content}</Text>
                  </View>
                  {item.parts && (
                    <View style={styles.chatPartsSection}>
                      <Text style={styles.chatPartsSectionTitle}>
                        Suggested parts — tap to add
                      </Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {item.parts.map((part: AIPart) => (
                          <TouchableOpacity
                            key={part.id}
                            style={styles.chatPartCard}
                            onPress={() => setDetailPart(part)}
                            activeOpacity={0.85}>
                            {part.imageUrl ? (
                              <Image source={{uri: part.imageUrl}} style={styles.chatPartImage} resizeMode="cover" />
                            ) : (
                              <View style={styles.chatPartImagePlaceholder}>
                                <AppIcon name="wrench" size={28} color={colors.textMuted} />
                              </View>
                            )}
                            <Text style={styles.chatPartSource}>{part.source}</Text>
                            <Text style={styles.chatPartName} numberOfLines={2}>{part.name}</Text>
                            <Text style={styles.chatPartPrice}>{part.currency} {part.price.toFixed(2)}</Text>
                            <TouchableOpacity
                              style={styles.chatPartAddBtn}
                              onPress={() => addPartFromAI(part)}>
                              <Text style={styles.chatPartAddBtnText}>+ Add to list</Text>
                            </TouchableOpacity>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              )}
            />

            {chatLoading && (
              <View style={styles.chatLoadingRow}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.chatLoadingText}>Thinking...</Text>
              </View>
            )}

            {/* Input bar */}
            <View style={styles.chatInputBar}>
              <TextInput
                style={styles.chatInput}
                placeholder="Ask about mods, parts, upgrades..."
                placeholderTextColor={colors.textSecondary}
                value={chatInput}
                onChangeText={setChatInput}
                multiline
                maxLength={500}
                editable={!chatLoading}
              />
              <TouchableOpacity
                style={[styles.chatSendBtn, (!chatInput.trim() || chatLoading) && styles.chatSendDisabled]}
                onPress={sendChatMessage}
                disabled={!chatInput.trim() || chatLoading}>
                <Text style={styles.chatSendText}>Send</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default CustomizationScreen;
