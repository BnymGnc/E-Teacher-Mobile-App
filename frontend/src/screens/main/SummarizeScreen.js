import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, Keyboard } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import api from '../../api';
import { lightTheme, darkTheme } from '../../theme/colors';

export default function SummarizeScreen({ navigation, isDarkMode }) {
  const theme = isDarkMode ? darkTheme : lightTheme;
  const styles = createStyles(theme, isDarkMode);

  const [activeTab, setActiveTab] = useState('text'); // 'text' veya 'file'
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState('');

  // Telefondan dosya (PDF, TXT vb.) seçme fonksiyonu
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain'], // Arka planın desteklediği formatlar
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
        setError(null);
        setSummary('');
      }
    } catch (err) {
      setError('Belge seçilirken bir hata oluştu.');
    }
  };

  const handleSummarize = async () => {
    setLoading(true);
    setError(null);
    setSummary('');
    Keyboard.dismiss();

    try {
      if (activeTab === 'text') {
        // 1. Durum: Metin Özetleme (JSON İsteği)
        if (inputText.trim().length < 20) {
          setError('Lütfen özetlenecek daha bir metin girin (en az 20 karakter).');
          setLoading(false);
          return;
        }

        const response = await api.post('/summarize/', { text: inputText });
        setSummary(response.data.summary || response.data.result || response.data.reply);

      } else {
        // 2. Durum: Belge Özetleme (Multipart Form Data İsteği)
        if (!selectedFile) {
          setError('Lütfen özetlenecek bir belge seçin.');
          setLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append('file', {
          uri: selectedFile.uri,
          name: selectedFile.name,
          type: selectedFile.mimeType || 'application/pdf',
        });

        // Arka plandaki 'summarize-file/' endpoint'ine istek atılıyor
        const response = await api.post('/summarize-file/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        setSummary(response.data.summary || response.data.result || response.data.reply);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Özetleme işlemi sırasında sunucu hatası oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setInputText('');
    setSelectedFile(null);
    setSummary('');
    setError(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        
        {/* Üst App Bar */}
        <View style={styles.appBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.6}>
            <MaterialIcons name="arrow-back-ios" size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.appBarTitle}>Metin & Belge Özeti</Text>
          <View style={styles.placeholderBtn} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Segmented Control / Sekme Seçici (Metin vs Dosya) */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tabBtn, activeTab === 'text' && styles.tabBtnActive]} 
              onPress={() => { setActiveTab('text'); setError(null); }}
            >
              <MaterialIcons name="edit" size={18} color={activeTab === 'text' ? '#fff' : theme.textSecondary} />
              <Text style={[styles.tabText, activeTab === 'text' && styles.tabTextActive]}>Metin Yapıştır</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.tabBtn, activeTab === 'file' && styles.tabBtnActive]} 
              onPress={() => { setActiveTab('file'); setError(null); }}
            >
              <MaterialIcons name="cloud-upload" size={18} color={activeTab === 'file' ? '#fff' : theme.textSecondary} />
              <Text style={[styles.tabText, activeTab === 'file' && styles.tabTextActive]}>Belge Yükle</Text>
            </TouchableOpacity>
          </View>

          {/* Dinamik İçerik Kartı */}
          <View style={styles.cardContainer}>
            {activeTab === 'text' ? (
              // Metin Özetleme Alanı
              <View>
                <Text style={styles.sectionTitle}>Ders Notunu Yapıştır</Text>
                <TextInput
                  style={styles.textArea}
                  multiline
                  numberOfLines={8}
                  placeholder="Metin Giriniz..."
                  placeholderTextColor={theme.textSecondary}
                  value={inputText}
                  onChangeText={(text) => { setInputText(text); if (error) setError(null); }}
                  textAlignVertical="top"
                />
              </View>
            ) : (
              // Belge Yükleme Alanı (Üst Düzey Dropzone Tasarımı)
              <View>
                <Text style={styles.sectionTitle}>Doküman Seçin</Text>
                <TouchableOpacity style={styles.dropZone} onPress={handlePickDocument} activeOpacity={0.6}>
                  <MaterialIcons name="insert-drive-file" size={48} color={selectedFile ? theme.primary : theme.textSecondary} />
                  {selectedFile ? (
                    <View style={styles.fileInfoContainer}>
                      <Text style={styles.fileNameText} numberOfLines={1}>{selectedFile.name}</Text>
                      <Text style={styles.fileSizeText}>{((selectedFile.size || 0) / 1024 / 1024).toFixed(2)} MB</Text>
                    </View>
                  ) : (
                    <Text style={styles.dropZoneText}>Cihazınızdan PDF veya TXT dosyası seçmek için tıklayın</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {error && (
              <View style={styles.errorBox}>
                <MaterialIcons name="error-outline" size={20} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* İşlem Butonları */}
            <View style={styles.actionRow}>
              {(inputText.length > 0 || selectedFile) && (
                <TouchableOpacity style={styles.clearBtn} onPress={handleClear} disabled={loading}>
                  <MaterialIcons name="refresh" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={[styles.actionBtn, (activeTab === 'text' ? inputText.length === 0 : !selectedFile) && styles.actionBtnDisabled]} 
                onPress={handleSummarize} 
                disabled={loading || (activeTab === 'text' ? inputText.length === 0 : !selectedFile)}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={styles.btnInner}>
                    <MaterialIcons name="auto-awesome" size={22} color="#fff" />
                    <Text style={styles.actionBtnText}>Yapay Zeka ile Özetle</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Gelişmiş Sonuç Gösterim Kartı */}
          {summary !== '' && (
            <View style={styles.resultBox}>
              <View style={styles.resultHeader}>
                <MaterialIcons name="summarize" size={24} color="#fff" />
                <Text style={styles.resultTitle}>Oluşturulan Özet Raporu</Text>
              </View>
              <View style={styles.resultContent}>
                <Text style={styles.resultText}>{summary}</Text>
              </View>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme, isDarkMode) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.background },
  appBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, height: Platform.OS === 'android' ? 76 : 64, paddingTop: Platform.OS === 'android' ? 24 : 0, backgroundColor: theme.surface, borderBottomWidth: 1, borderColor: theme.border },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', paddingLeft: 6 },
  placeholderBtn: { width: 44, height: 44 },
  appBarTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text, textAlign: 'center' },
  
  scrollContent: { padding: 16, paddingBottom: 50 },

  // Sekme tasarımları
  tabContainer: { flexDirection: 'row', backgroundColor: theme.surface, borderRadius: 14, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: theme.border },
  tabBtn: { flex: 1, flexDirection: 'row', paddingVertical: 12, justifyContent: 'center', alignItems: 'center', borderRadius: 10, gap: 8 },
  tabBtnActive: { backgroundColor: theme.primary, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: 'bold', color: theme.textSecondary },
  tabTextActive: { color: '#ffffff' },
  
  cardContainer: { backgroundColor: theme.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: theme.border, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDarkMode ? 0.3 : 0.05, shadowRadius: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: 12 },
  
  textArea: { backgroundColor: theme.background, color: theme.text, borderRadius: 12, borderWidth: 1, borderColor: theme.border, padding: 16, fontSize: 15, minHeight: 160, maxHeight: 250 },
  
  // Belge yükleme dropzone alanı
  dropZone: { borderStyle: 'dashed', borderWidth: 2, borderColor: theme.primary + '80', backgroundColor: theme.background, borderRadius: 14, padding: 30, alignItems: 'center', justifyContent: 'center', minHeight: 160 },
  dropZoneText: { color: theme.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 12, paddingHorizontal: 20, lineHeight: 20 },
  fileInfoContainer: { alignItems: 'center', marginTop: 10, paddingHorizontal: 10 },
  fileNameText: { fontSize: 15, fontWeight: 'bold', color: theme.text, textAlign: 'center' },
  fileSizeText: { fontSize: 12, color: theme.textSecondary, marginTop: 4 },

  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', padding: 14, borderRadius: 12, marginTop: 16, borderWidth: 1, borderColor: '#fecaca' },
  errorText: { color: '#ef4444', marginLeft: 10, fontSize: 14, flex: 1, fontWeight: '500' },
  
  actionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, gap: 12 },
  clearBtn: { width: 50, height: 54, borderRadius: 14, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border },
  actionBtn: { flex: 1, backgroundColor: theme.primary, height: 54, borderRadius: 14, justifyContent: 'center', alignItems: 'center', elevation: 3, shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  actionBtnDisabled: { backgroundColor: theme.border, elevation: 0, shadowOpacity: 0 },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  actionBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },

  resultBox: { marginTop: 24, borderRadius: 16, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.secondary, padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  resultTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  resultContent: { backgroundColor: theme.surface, padding: 20, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, borderWidth: 1, borderColor: theme.border, borderTopWidth: 0 },
  resultText: { fontSize: 15, color: theme.text, lineHeight: 26 }
});