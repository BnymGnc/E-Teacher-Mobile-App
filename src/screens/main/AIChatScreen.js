import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, ActivityIndicator, Keyboard } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../../api';
import { lightTheme, darkTheme } from '../../theme/colors';

export default function AIChatScreen({ navigation, isDarkMode }) {
  const theme = isDarkMode ? darkTheme : lightTheme;
  const styles = createStyles(theme, isDarkMode);
  const flatListRef = useRef(null);

  // Başlangıç mesajı: Yapay Zeka kullanıcıyı adıyla karşılar
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: 'Merhaba Bünyamin! Ben senin kişisel yapay zeka eğitim koçunum. Bugün ders programı planlamak, netlerini artırmak veya sadece motivasyon üzerine konuşmak ister misin?',
      sender: 'ai',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Yeni mesaj geldiğinde listeyi en alta kaydırır
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (inputText.trim() === '') return;

    const userMessageText = inputText.trim();
    const newUserMessage = {
      id: Date.now().toString(),
      text: userMessageText,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputText('');
    setIsTyping(true);
    Keyboard.dismiss(); // Gönderdikten sonra klavyeyi kapatarak ekranı ferahlatır

    try {
      // Backend'deki urls.py'de tanımlı 'chat/' endpointine istek atılır
      const response = await api.post('/chat/', { message: userMessageText });
      
      const aiReply = {
        id: (Date.now() + 1).toString(),
        text: response.data.reply || response.data.response || 'Anlaşıldı. Sana nasıl daha fazla yardımcı olabilirim?',
        sender: 'ai',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, aiReply]);
    } catch (error) {
      const errorReply = {
        id: (Date.now() + 1).toString(),
        text: 'Üzgünüm, şu an sunucularımla bağlantı kuramıyorum. Lütfen internet bağlantını kontrol et veya tekrar dene.',
        sender: 'ai',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorReply]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[styles.messageWrapper, isUser ? styles.messageWrapperUser : styles.messageWrapperAI]}>
        {!isUser && (
          <View style={styles.aiAvatar}>
            <MaterialIcons name="psychology" size={20} color="#fff" />
          </View>
        )}
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>{item.text}</Text>
          <Text style={[styles.timeText, isUser ? styles.userTime : styles.aiTime]}>{item.time}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        
        {/* Üst App Bar - Online Status Indicator eklendi */}
        <View style={styles.appBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.6}>
            <MaterialIcons name="arrow-back-ios" size={22} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.appBarTitle}>AI Rehber</Text>
            <View style={styles.onlineStatus}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Çevrimiçi</Text>
            </View>
          </View>
          <View style={styles.placeholderBtn} />
        </View>

        {/* Mesaj Listesi Alanı */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatList}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            isTyping ? (
              <View style={styles.typingIndicator}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={styles.typingText}>Rehber yazıyor...</Text>
              </View>
            ) : null
          }
        />

        {/* Alt Mesaj Yazma / Input Alanı */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Bir şeyler yaz..."
              placeholderTextColor={theme.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity 
              style={[styles.sendBtn, inputText.trim() === '' ? styles.sendBtnDisabled : styles.sendBtnActive]} 
              onPress={handleSend}
              disabled={inputText.trim() === '' || isTyping}
            >
              <MaterialIcons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme, isDarkMode) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.background },
  
  appBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, height: Platform.OS === 'android' ? 76 : 64, paddingTop: Platform.OS === 'android' ? 24 : 0, backgroundColor: theme.surface, borderBottomWidth: 1, borderColor: theme.border, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3 },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', paddingLeft: 6 },
  headerTitleContainer: { alignItems: 'center' },
  appBarTitle: { fontSize: 17, fontWeight: 'bold', color: theme.text },
  onlineStatus: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981', marginRight: 4 },
  onlineText: { fontSize: 12, color: theme.textSecondary, fontWeight: '500' },
  placeholderBtn: { width: 44, height: 44 },

  chatList: { paddingHorizontal: 16, paddingVertical: 20, paddingBottom: 10 },
  
  messageWrapper: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-end' },
  messageWrapperUser: { justifyContent: 'flex-end' },
  messageWrapperAI: { justifyContent: 'flex-start' },
  
  aiAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center', marginRight: 8, marginBottom: 4 },
  
  messageBubble: { maxWidth: '75%', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  userBubble: { backgroundColor: theme.primary, borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: theme.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: theme.border },
  
  messageText: { fontSize: 15, lineHeight: 22 },
  userText: { color: '#ffffff' },
  aiText: { color: theme.text },
  
  timeText: { fontSize: 10, marginTop: 6, alignSelf: 'flex-end' },
  userTime: { color: 'rgba(255,255,255,0.7)' },
  aiTime: { color: theme.textSecondary },

  typingIndicator: { flexDirection: 'row', alignItems: 'center', marginLeft: 40, marginBottom: 20 },
  typingText: { marginLeft: 8, fontSize: 13, color: theme.textSecondary, fontStyle: 'italic' },

  inputContainer: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: theme.surface, borderTopWidth: 1, borderColor: theme.border },
  inputWrapper: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: theme.background, borderRadius: 24, paddingLeft: 16, paddingRight: 6, paddingVertical: 6, borderWidth: 1, borderColor: theme.border },
  textInput: { flex: 1, color: theme.text, fontSize: 15, maxHeight: 100, minHeight: 40, paddingTop: Platform.OS === 'ios' ? 10 : 8, paddingBottom: Platform.OS === 'ios' ? 10 : 8 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 8, marginBottom: 2 },
  sendBtnDisabled: { backgroundColor: theme.border },
  sendBtnActive: { backgroundColor: theme.primary, elevation: 2, shadowColor: theme.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 }
});