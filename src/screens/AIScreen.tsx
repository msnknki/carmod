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
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {colors} from '../theme';
import styles from './styles/AIScreen.styles';
import {useCar} from '../context/CarContext';
import {api} from '../services/api';

type Message = {
  id: string;
  role: 'user' | 'ai';
  content: string;
};

const AIScreen = () => {
  const {selectedCar} = useCar();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
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
      });

      if (res.conversationId && !conversationId) {
        setConversationId(res.conversationId);
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: res.response,
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

  const renderMessage = ({item}: {item: Message}) => (
    <View
      style={[
        styles.bubble,
        item.role === 'user' ? styles.userBubble : styles.aiBubble,
      ]}>
      <Text style={styles.roleLabel}>
        {item.role === 'user' ? 'You' : '🤖 CarMod AI'}
      </Text>
      <Text style={styles.messageText}>{item.content}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}>
        {/* Car context banner */}
        {selectedCar && (
          <View style={styles.carBanner}>
            <Text style={styles.carBannerText}>
              🚗 {selectedCar.year} {selectedCar.make} {selectedCar.model}
            </Text>
          </View>
        )}

        {/* Empty state */}
        {messages.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🤖</Text>
            <Text style={styles.emptyTitle}>CarMod AI Assistant</Text>
            <Text style={styles.emptySubtitle}>
              Ask me anything about car modifications, repairs, or maintenance
              {selectedCar
                ? ` for your ${selectedCar.year} ${selectedCar.make} ${selectedCar.model}`
                : ''}
              .
            </Text>
          </View>
        )}

        {/* Messages */}
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

        {/* Loading indicator */}
        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Thinking...</Text>
          </View>
        )}

        {/* Input bar */}
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
    </SafeAreaView>
  );
};


export default AIScreen;
