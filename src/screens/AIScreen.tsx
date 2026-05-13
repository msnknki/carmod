import React, {useState, useRef} from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
  Image,
  Modal,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {colors} from '../theme';
import styles from './styles/AIScreen.styles';
import {useCar} from '../context/CarContext';
import {api} from '../services/api';

type Part = {
  id: string;
  name: string;
  price: number;
  currency: string;
  condition: string;
  source: string;
  purchaseUrl: string;
  imageUrl?: string;
};

type Message = {
  id: string;
  role: 'user' | 'ai';
  content: string;
  parts?: Part[];
};

const COUNTRIES = [
  {code: 'LB', label: '🇱🇧 Lebanon'},
  {code: 'AE', label: '🇦🇪 UAE'},
  {code: 'US', label: '🇺🇸 USA'},
  {code: 'GB', label: '🇬🇧 UK'},
  {code: 'DE', label: '🇩🇪 Germany'},
];

const AIScreen = () => {
  const {selectedCar} = useCar();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [country, setCountry] = useState('LB');
  const [detailPart, setDetailPart] = useState<Part | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) {
      return;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chat', {
        message: text,
        conversationId,
        carId: selectedCar?.id,
        countryCode: country,
      });

      if (res.conversationId && !conversationId) {
        setConversationId(res.conversationId);
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: res.response,
        parts: res.parts?.length > 0 ? res.parts : undefined,
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: `Error: ${err.message || 'Failed to get response. Make sure the backend is running.'}`,
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const renderParts = (parts: Part[]) => (
    <View style={styles.partsSection}>
      <Text style={styles.partsSectionTitle}>🛒 Parts found near you</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.partsScroll}>
        {parts.map(part => (
          <TouchableOpacity
            key={part.id}
            style={styles.partCard}
            onPress={() => setDetailPart(part)}
            activeOpacity={0.8}>
            {part.imageUrl ? (
              <Image source={{uri: part.imageUrl}} style={styles.partImage} resizeMode="cover" />
            ) : (
              <View style={styles.partImagePlaceholder}>
                <Text style={styles.partImagePlaceholderText}>🔧</Text>
              </View>
            )}
            <Text style={styles.partSource}>{part.source}</Text>
            <Text style={styles.partName} numberOfLines={2}>{part.name}</Text>
            <Text style={styles.partPrice}>
              {part.currency} {part.price.toFixed(2)}
            </Text>
            <View style={styles.partViewBtn}>
              <Text style={styles.partViewBtnText}>View →</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderMessage = ({item}: {item: Message}) => (
    <View style={item.role === 'user' ? {alignItems: 'flex-end'} : {alignItems: 'flex-start'}}>
      <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
        <Text style={styles.roleLabel}>
          {item.role === 'user' ? 'You' : '🤖 CarMod AI'}
        </Text>
        <Text style={styles.messageText}>{item.content}</Text>
      </View>
      {item.parts && renderParts(item.parts)}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}>

        {selectedCar && (
          <View style={styles.carBanner}>
            <Text style={styles.carBannerText}>
              🚗 {selectedCar.year} {selectedCar.make} {selectedCar.model}
            </Text>
          </View>
        )}

        {/* Market / country selector */}
        <View style={styles.locationBar}>
          <Text style={styles.locationLabel}>Market:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.locationChips}>
              {COUNTRIES.map(c => (
                <TouchableOpacity
                  key={c.code}
                  style={[styles.locationChip, country === c.code && styles.locationChipSelected]}
                  onPress={() => setCountry(c.code)}
                  activeOpacity={0.7}>
                  <Text style={[styles.locationChipText, country === c.code && styles.locationChipTextSelected]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {messages.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🤖</Text>
            <Text style={styles.emptyTitle}>CarMod AI Assistant</Text>
            <Text style={styles.emptySubtitle}>
              Ask about parts, repairs, or modifications
              {selectedCar
                ? ` for your ${selectedCar.year} ${selectedCar.make} ${selectedCar.model}`
                : ''}.
            </Text>
          </View>
        )}

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({animated: true})
          }
        />

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Thinking...</Text>
          </View>
        )}

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Ask about your car..."
            placeholderTextColor={colors.textSecondary}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={1000}
            editable={!loading}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!input.trim() || loading) && styles.sendDisabled]}
            onPress={sendMessage}
            disabled={!input.trim() || loading}>
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      {/* Part Detail Modal */}
      {detailPart && (
        <Modal visible animationType="slide" transparent onRequestClose={() => setDetailPart(null)}>
          <View style={styles.detailOverlay}>
            <View style={styles.detailPanel}>
              {detailPart.imageUrl ? (
                <Image source={{uri: detailPart.imageUrl}} style={styles.detailImage} resizeMode="cover" />
              ) : (
                <View style={styles.detailImagePlaceholder}>
                  <Text style={styles.detailImagePlaceholderText}>🔧</Text>
                </View>
              )}
              <View style={styles.detailBody}>
                <View style={styles.detailSourceRow}>
                  <Text style={styles.detailSource}>{detailPart.source}</Text>
                  <Text style={styles.detailCondition}>{detailPart.condition}</Text>
                </View>
                <Text style={styles.detailName}>{detailPart.name}</Text>
                <Text style={styles.detailPrice}>{detailPart.currency} {detailPart.price.toFixed(2)}</Text>
                <TouchableOpacity
                  style={styles.detailBuyBtn}
                  onPress={() => { Linking.openURL(detailPart.purchaseUrl); setDetailPart(null); }}>
                  <Text style={styles.detailBuyBtnText}>Buy on {detailPart.source === 'ebay' ? 'eBay' : 'AliExpress'} →</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.detailCloseBtn} onPress={() => setDetailPart(null)}>
                  <Text style={styles.detailCloseBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

export default AIScreen;
