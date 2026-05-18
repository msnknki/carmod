import React, {useState, useRef, useEffect} from 'react';
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
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRoute, RouteProp} from '@react-navigation/native';
import {colors} from '../theme';
import styles from './styles/CustomizationScreen.styles';
import {useCar} from '../context/CarContext';
import {api} from '../services/api';
import AppIcon from '../components/ui/AppIcon';
import PressableScale from '../components/ui/PressableScale';
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

const COUNTRIES = [
  {code: 'LB', label: 'Lebanon'},
  {code: 'AE', label: 'UAE'},
  {code: 'US', label: 'USA'},
  {code: 'GB', label: 'UK'},
  {code: 'DE', label: 'Germany'},
];

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

const CustomizationScreen = () => {
  const route = useRoute<RouteProp<RootTabParamList, 'Customization'>>();
  const {selectedCar} = useCar();
  const [activeTab, setActiveTab] = useState<Tab>('parts');

  // Parts state
  const [query, setQuery] = useState('');
  const [parts, setParts] = useState<PartResult[]>([]);
  const [selectedParts, setSelectedParts] = useState<Set<string>>(new Set());
  const [partsLoading, setPartsLoading] = useState(false);
  const [partsError, setPartsError] = useState('');
  const [partsSource, setPartsSource] = useState('');
  const [optimizedQuery, setOptimizedQuery] = useState('');

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

  // AI chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [detailPart, setDetailPart] = useState<AIPart | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatConversationId, setChatConversationId] = useState<number | null>(null);
  const [country, setCountry] = useState('LB');
  const chatListRef = useRef<FlatList>(null);

  const searchParts = async (searchQuery?: string) => {
    const q = (searchQuery ?? query).trim();
    if (!q) {
      return;
    }
    if (searchQuery) {
      setQuery(searchQuery);
    }
    setPartsLoading(true);
    setPartsError('');
    try {
      const body: Record<string, string> = {query: q};
      if (selectedCar) {
        body.carMake = selectedCar.make;
        body.carModel = selectedCar.model;
        body.carYear = String(selectedCar.year);
      }
      const data = await api.post('/parts/search', body);
      setParts(data.results || []);
      setPartsSource(data.source || '');
      setOptimizedQuery(data.query || '');
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
        countryCode: country,
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
            ${item.price.toFixed(2)}{' '}
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
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4}}>
          <AppIcon name="star" size={14} color={colors.primary} />
          <Text style={styles.shopRating}>
            {item.rating} ({item.totalRatings} reviews)
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Customization</Text>
      <Text style={styles.titleSub}>Premium parts marketplace</Text>

      {selectedCar && (
        <View style={styles.carBanner}>
          <AppIcon name="car-sports" size={18} color={colors.primary} />
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
            Parts
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
            Shops
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
            Preview
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
                Source: {getSourceLabel(partsSource)} · {parts.length} results
              </Text>
              {optimizedQuery ? (
                <Text style={styles.optimizedQueryLabel} numberOfLines={2}>
                  Searched: "{optimizedQuery}"
                </Text>
              ) : null}
            </>
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
              <View style={styles.emptyIconWrap}>
                <AppIcon name="map-marker-radius" size={36} color={colors.primary} />
              </View>
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

          {/* Selected parts cart */}
          {selectedParts.size > 0 ? (
            <View style={styles.previewCart}>
              <Text style={styles.previewCartTitle}>
                Parts in your build ({selectedParts.size})
              </Text>
              {parts.filter(p => selectedParts.has(p.id)).map(p => (
                <View key={p.id} style={styles.previewCartItem}>
                  <Text style={styles.previewCartBullet}>•</Text>
                  <Text style={styles.previewCartName} numberOfLines={1}>{p.title}</Text>
                  <Text style={styles.previewCartPrice}>${p.price.toFixed(0)}</Text>
                </View>
              ))}
              <Text style={styles.previewCartHint}>These parts will be included in the generated image</Text>
            </View>
          ) : (
            <Text style={styles.previewSubtext}>
              Select parts in the Online Parts tab or via the AI assistant, then generate a preview
            </Text>
          )}

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
      <TouchableOpacity
        style={styles.aiFab}
        onPress={() => setChatOpen(true)}
        activeOpacity={0.85}>
        <AppIcon name="robot-outline" size={28} color="#0B0B0B" />
      </TouchableOpacity>

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

            {/* Market selector */}
            <View style={styles.chatLocationBar}>
              <Text style={styles.chatLocationLabel}>Market:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chatLocationChips}>
                  {COUNTRIES.map(c => (
                    <TouchableOpacity
                      key={c.code}
                      style={[styles.chatLocationChip, country === c.code && styles.chatLocationChipSelected]}
                      onPress={() => setCountry(c.code)}
                      activeOpacity={0.7}>
                      <Text style={[styles.chatLocationChipText, country === c.code && styles.chatLocationChipTextSelected]}>
                        {c.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
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
