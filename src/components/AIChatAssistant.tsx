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
  Alert,
} from 'react-native';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import {colors} from '../theme';
import styles from '../screens/styles/AIScreen.styles';
import {useCar} from '../context/CarContext';
import {useMarket} from '../context/MarketContext';
import {api} from '../services/api';
import AppIcon from './ui/AppIcon';
import PressableScale from './ui/PressableScale';

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
  imageUri?: string;
};

const SUGGESTIONS = [
  'Best mods for my car',
  'Why is my engine vibrating?',
  'Compare brake pads',
  'Best exhaust upgrade',
  'How do I lower my car safely?',
];

type Props = {
  onClose?: () => void;
  embedded?: boolean;
};

const AIChatAssistant = ({onClose, embedded = false}: Props) => {
  const {selectedCar} = useCar();
  const {countryCode} = useMarket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [detailPart, setDetailPart] = useState<Part | null>(null);
  const [attachedImageUri, setAttachedImageUri] = useState<string | undefined>();
  const flatListRef = useRef<FlatList>(null);

  const pickAttachImage = () => {
    Alert.alert('Attach Photo', 'Send a photo with your message', [
      {
        text: 'Camera',
        onPress: () =>
          launchCamera({mediaType: 'photo', quality: 0.6}, res => {
            if (res.assets?.[0]?.uri) setAttachedImageUri(res.assets[0].uri);
          }),
      },
      {
        text: 'Photo Library',
        onPress: () =>
          launchImageLibrary({mediaType: 'photo', quality: 0.6}, res => {
            if (res.assets?.[0]?.uri) setAttachedImageUri(res.assets[0].uri);
          }),
      },
      {text: 'Cancel', style: 'cancel'},
    ]);
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

  const sendMessage = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || loading) {
      return;
    }

    const imageUri = attachedImageUri;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      imageUri,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setAttachedImageUri(undefined);
    setLoading(true);

    try {
      let imageData: string | null = null;
      if (imageUri) {
        imageData = await uriToBase64DataUrl(imageUri);
      }

      const res = await api.post('/chat', {
        message: text,
        conversationId,
        carId: selectedCar?.id,
        countryCode,
        imageData: imageData || undefined,
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
      <Text style={styles.partsSectionTitle}>Suggested parts</Text>
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
          {item.imageUri && (
            <Image source={{uri: item.imageUri}} style={styles.msgImage} resizeMode="cover" />
          )}
          <Text style={[styles.messageText, isUser && styles.userMessageText]}>
            {item.content}
          </Text>
        </View>
        {item.parts && renderParts(item.parts)}
      </View>
    );
  };

  return (
    <View style={[styles.container, embedded && {flex: 1}]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            <AppIcon name="robot-outline" size={28} color={colors.primary} />
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.headerTitle}>AI Assistant</Text>
            <Text style={styles.headerSubtitle}>Smart automotive guidance</Text>
          </View>
          {onClose && (
            <TouchableOpacity onPress={onClose} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <AppIcon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          )}
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

        {attachedImageUri && (
          <View style={styles.attachPreviewRow}>
            <View style={styles.attachThumbWrap}>
              <Image source={{uri: attachedImageUri}} style={styles.attachThumb} resizeMode="cover" />
              <TouchableOpacity
                style={styles.attachRemoveBtn}
                onPress={() => setAttachedImageUri(undefined)}>
                <AppIcon name="close-circle" size={18} color={colors.danger} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.attachBtn} onPress={pickAttachImage} disabled={loading}>
            <AppIcon
              name="image-plus"
              size={22}
              color={attachedImageUri ? colors.primary : colors.textMuted}
            />
          </TouchableOpacity>
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
                  <Text style={styles.detailBuyBtnText}>Open product link</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.detailCloseBtn} onPress={() => setDetailPart(null)}>
                  <Text style={styles.detailCloseBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

export default AIChatAssistant;
