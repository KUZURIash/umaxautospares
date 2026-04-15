import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Animated,
  PanResponder,
} from 'react-native';
import { MessageCircle, Send, X, RotateCcw } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

// ✅ IMPORT SCALING (like your wishlist)
import {
  horizontalScale,
  verticalScale,
  moderateScale,
} from './components/scaling';

const BASE_URL = 'https://backend.umaxautospares.com';

const INITIAL_MESSAGE = {
  id: 'init',
  role: 'assistant',
  content: "नमस्ते! 👋 I'm your MotoParts AI Assistant. Ask me anything 🚀",
};

const MotoPartsAssistant = () => {
  const navigation = useNavigation();

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);

  const flatListRef = useRef(null);

  // ✅ DRAG FIX (no blocking)
  const pan = useRef(
    new Animated.ValueXY({
      x: horizontalScale(0),
      y: verticalScale(0),
    }),
  ).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 5 || Math.abs(g.dy) > 5,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => {},
    }),
  ).current;

  const historyPayload = useMemo(
    () =>
      messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .slice(-12)
        .map(m => ({ role: m.role, content: m.content })),
    [messages],
  );

  const handleSend = async () => {
    const message = input.trim();
    if (!message || isLoading) return;

    setMessages(prev => [
      ...prev,
      { id: Date.now().toString(), role: 'user', content: message },
    ]);
    setInput('');
    setIsLoading(true);

    try {
      const token = await AsyncStorage.getItem('userToken');

      const response = await axios.post(
        `${BASE_URL}/api/v1/chatbot/query`,
        {
          message,
          history: historyPayload,
        },
        {
          headers: { Authorization: token ? `Bearer ${token}` : '' },
        },
      );

      const resData = response.data?.data || response.data;

      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: resData?.answer || "I couldn't understand that.",
          suggestions: resData?.suggestions || {},
        },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: '⚠️ Network error. Try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductClick = prod => {
    const targetId = prod.productId || prod.id || prod.slug;
    if (targetId) {
      setIsOpen(false);
      navigation.navigate('ProductDetail', { id: targetId });
    }
  };

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.msgRow,
        item.role === 'user' ? styles.userRow : styles.botRow,
      ]}
    >
      {item.role === 'assistant' && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>AI</Text>
        </View>
      )}

      <View
        style={[
          styles.bubble,
          item.role === 'user' ? styles.userBubble : styles.botBubble,
        ]}
      >
        <Text
          style={[styles.msgText, item.role === 'user' && { color: '#fff' }]}
        >
          {item.content}
        </Text>

        {item.role === 'assistant' &&
          item.suggestions?.products?.length > 0 && (
            <FlatList
              horizontal
              data={item.suggestions.products}
              keyExtractor={(p, i) => p.productId || i.toString()}
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: verticalScale(10) }}
              renderItem={({ item: prod }) => (
                <TouchableOpacity
                  style={styles.productCard}
                  onPress={() => handleProductClick(prod)}
                >
                  <Image
                    source={{ uri: prod.mainImage }}
                    style={styles.prodImage}
                  />
                  <Text numberOfLines={2} style={styles.prodName}>
                    {prod.name}
                  </Text>
                  <Text style={styles.prodPrice}>₹{prod.salePrice}</Text>
                </TouchableOpacity>
              )}
            />
          )}
      </View>
    </View>
  );

  return (
    <>
      {/* ✅ FLOATING BUTTON (NO SCREEN BLOCKING) */}
      {!isOpen && (
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.fabWrapper,
            { transform: pan.getTranslateTransform() },
          ]}
        >
          <TouchableOpacity style={styles.fab} onPress={() => setIsOpen(true)}>
            <MessageCircle color="#fff" size={moderateScale(24)} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ✅ MODAL */}
      <Modal visible={isOpen} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.chatBox}
          >
            {/* HEADER */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>MotoParts Assistant</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <X color="white" />
              </TouchableOpacity>
            </View>

            {/* CHAT */}
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={m => m.id}
              contentContainerStyle={{ padding: horizontalScale(16) }}
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({ animated: true })
              }
            />

            {/* INPUT */}
            <View style={styles.inputArea}>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  placeholder="Ask anything..."
                  placeholderTextColor="#94a3b8"
                  value={input}
                  onChangeText={setInput}
                />
                <TouchableOpacity onPress={handleSend}>
                  <Send color="#1e1b4b" size={moderateScale(20)} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={() => setMessages([INITIAL_MESSAGE])}>
                <Text style={styles.clearText}>Clear Chat</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  fabWrapper: {
    position: 'absolute',
    bottom: verticalScale(120),
    right: horizontalScale(20),
    zIndex: 999,
  },

  fab: {
    width: horizontalScale(56),
    height: horizontalScale(56),
    borderRadius: horizontalScale(28),
    backgroundColor: '#1e1b4b',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },

  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },

  chatBox: {
    height: '90%',
    backgroundColor: '#fff',
    borderTopLeftRadius: moderateScale(25),
    borderTopRightRadius: moderateScale(25),
  },

  header: {
    backgroundColor: '#1e1b4b',
    padding: horizontalScale(16),
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  headerTitle: {
    color: '#fff',
    fontSize: moderateScale(16),
    fontWeight: 'bold',
  },

  msgRow: { flexDirection: 'row', marginBottom: verticalScale(10) },
  userRow: { justifyContent: 'flex-end' },
  botRow: { justifyContent: 'flex-start' },

  avatar: {
    width: horizontalScale(28),
    height: horizontalScale(28),
    borderRadius: 14,
    backgroundColor: '#1e1b4b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: horizontalScale(6),
  },

  avatarText: { color: '#fff', fontSize: moderateScale(10) },

  bubble: {
    maxWidth: '75%',
    padding: horizontalScale(12),
    borderRadius: moderateScale(18),
  },

  userBubble: { backgroundColor: '#1e1b4b' },
  botBubble: { backgroundColor: '#f1f5f9' },

  msgText: { fontSize: moderateScale(13), color: '#1e293b' },

  inputArea: {
    padding: horizontalScale(12),
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
  },

  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: moderateScale(25),
    paddingHorizontal: horizontalScale(15),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  input: { flex: 1, height: verticalScale(45) },

  clearText: {
    textAlign: 'center',
    marginTop: verticalScale(8),
    fontSize: moderateScale(11),
    color: '#64748b',
  },

  productCard: {
    width: horizontalScale(120),
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: horizontalScale(8),
    marginRight: horizontalScale(10),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  prodImage: {
    width: '100%',
    height: verticalScale(70),
    borderRadius: moderateScale(8),
  },

  prodName: {
    fontSize: moderateScale(10),
    fontWeight: '600',
    color: '#1e293b',
  },

  prodPrice: {
    fontSize: moderateScale(11),
    fontWeight: 'bold',
    color: '#1e1b4b',
  },
});

export default MotoPartsAssistant;
