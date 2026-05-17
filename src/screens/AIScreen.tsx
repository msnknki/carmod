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
import AppIcon from '../components/ui/AppIcon';
import PressableScale from '../components/ui/PressableScale';

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
  {code: 'LB', label: 'Lebanon'},
  {code: 'AE', label: 'UAE'},
  {code: 'US', label: 'USA'},
  {code: 'GB', label: 'UK'},
  {code: 'DE', label: 'Germany'},
];

const SUGGESTIONS = [
  'Best mods for my car',
  'Why is my engine vibrating?',
  'Compare brake pads',
  'Best exhaust upgrade',
  'Find parts in Lebanon',
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

  const sendMessage = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
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
      <Text style={styles.partsSectionTitle}>Parts near you</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {parts.map(part => (
          <PressableScale
            key={part.id}
            style={styles.partCard}
            onPress={() => setDetailPart(part)}>
            {part.imageUrl ? (
              <Image source={{uri: part.imageUrl}} style={styles.partImage} resizeMode="cover" />
            ) : (
              <View style={styles.partImagePlaceholder}>
                <AppIcon name="car-turbocharger" size={32} color={colors.textMuted} />
              </View>
            )}
            <Text style={styles.partSource}>{part.source}</Text>
            <Text style={styles.partName} numberOfLines={2}>
              {part.name}
            </Text>
            <Text style={styles.partPrice}>
              {part.currency} {part.price.toFixed(2)}
            </Text>
            <View style={styles.partViewBtn}>
              <Text style={styles.partViewBtnText}>View details</Text>
            </View>
          </PressableScale>
        ))}
      </ScrollView>
    </View>
  );

  const renderMessage = ({item}: {item: Message}) => {
    const isUser = item.role === 'user';
    return (
      <View style={{alignItems: isUser ? 'flex-end' : 'flex-start'}}>
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
          <Text style={[styles.roleLabel, isUser && styles.userRoleLabel]}>
            {isUser ? 'You' : 'CarMod AI'}
          </Text>
          <Text style={[styles.messageText, isUser && styles.userMessageText]}>
            {item.content}
          </Text>
        </View>
        {item.parts && renderParts(item.parts)}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            <AppIcon name="robot-outline" size={28} color={colors.primary} />
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.headerTitle}>AI Assistant</Text>
            <Text style={styles.headerSubtitle}>
              Smart automotive guidance
            </Text>
          </View>
        </View>
        {selectedCar && (
          <View style={styles.carBanner}>
            <AppIcon name="car-sports" size={18} color={colors.primary} />
            <Text style={styles.carBannerText}>
              {selectedCar.year} {selectedCar.make} {selectedCar.model}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.locationBar}>
        <Text style={styles.locationLabel}>Market</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.locationChips}>
            {COUNTRIES.map(c => (
              <PressableScale
                key={c.code}
                style={[
                  styles.locationChip,
                  country === c.code && styles.locationChipSelected,
                ]}
                onPress={() => setCountry(c.code)}>
                <Text
                  style={[
                    styles.locationChipText,
                    country === c.code && styles.locationChipTextSelected,
                  ]}>
                  {c.label}
                </Text>
              </PressableScale>
            ))}
          </View>
        </ScrollView>
      </View>

      {messages.length === 0 && (
        <>
          <View style={styles.emptyState}>
            <AppIcon name="chat-processing-outline" size={48} color={colors.primary} />
            <Text style={styles.emptyTitle}>How can I help?</Text>
            <Text style={styles.emptySubtitle}>
              Ask about parts, repairs, or modifications
              {selectedCar
                ? ` for your ${selectedCar.year} ${selectedCar.make} ${selectedCar.model}`
                : ''}
              .
            </Text>
          </View>
          <View style={styles.suggestionsWrap}>
            <Text style={styles.suggestionsLabel}>Suggestions</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {SUGGESTIONS.map(s => (
                <PressableScale
                  key={s}
                  style={styles.suggestionChip}
                  onPress={() => sendMessage(s)}>
                  <Text style={styles.suggestionText}>{s}</Text>
                </PressableScale>
              ))}
            </ScrollView>
          </View>
        </>
      )}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>
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
            placeholderTextColor={colors.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={1000}
            editable={!loading}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!input.trim() || loading) && styles.sendDisabled]}
            onPress={() => sendMessage()}
            disabled={!input.trim() || loading}>
            <AppIcon name="send" size={22} color="#0B0B0B" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {detailPart && (
        <Modal visible animationType="slide" transparent onRequestClose={() => setDetailPart(null)}>
          <View style={styles.detailOverlay}>
            <View style={styles.detailPanel}>
              {detailPart.imageUrl ? (
                <Image source={{uri: detailPart.imageUrl}} style={styles.detailImage} resizeMode="cover" />
              ) : (
                <View style={styles.detailImagePlaceholder}>
                  <AppIcon name="car-turbocharger" size={48} color={colors.textMuted} />
                </View>
              )}
              <View style={styles.detailBody}>
                <View style={styles.detailSourceRow}>
                  <Text style={styles.detailSource}>{detailPart.source}</Text>
                  <Text style={styles.detailCondition}>{detailPart.condition}</Text>
                </View>
                <Text style={styles.detailName}>{detailPart.name}</Text>
                <Text style={styles.detailPrice}>
                  {detailPart.currency} {detailPart.price.toFixed(2)}
                </Text>
                <TouchableOpacity
                  style={styles.detailBuyBtn}
                  onPress={() => {
                    Linking.openURL(detailPart.purchaseUrl);
                    setDetailPart(null);
                  }}>
                  <Text style={styles.detailBuyBtnText}>
                    Buy on {detailPart.source === 'ebay' ? 'eBay' : 'AliExpress'}
                  </Text>
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
