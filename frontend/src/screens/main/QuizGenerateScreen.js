import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, Keyboard } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../../api';
import { lightTheme, darkTheme } from '../../theme/colors';

export default function QuizGenerateScreen({ navigation, isDarkMode }) {
  const theme = isDarkMode ? darkTheme : lightTheme;
  const styles = createStyles(theme, isDarkMode);

  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Orta'); // Kolay, Orta, Zor
  const [questionCount, setQuestionCount] = useState(3); // 1-10 arası
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [quizResult, setQuizResult] = useState(''); // Backend'den gelen test verisi

  const incrementCount = () => { if (questionCount < 10) setQuestionCount(prev => prev + 1); };
  const decrementCount = () => { if (questionCount > 1) setQuestionCount(prev => prev - 1); };

  const handleGenerateQuiz = async () => {
    if (topic.trim() === '') {
      setError('Lütfen test üretilecek bir ders veya konu adı girin.');
      return;
    }

    setLoading(true);
    setError(null);
    setQuizResult('');
    Keyboard.dismiss();

    try {
      // Backend'deki ML test üretme endpoint'ine istek atılıyor
      const response = await api.post('/ml/generate-quiz/', { 
        topic: topic,
        difficulty: difficulty,
        count: questionCount
      });
      
      // Gelen veriyi (string veya array) state'e atıyoruz
      setQuizResult(response.data.quiz || response.data.result || response.data.reply);
    } catch (err) {
      setError(err.response?.data?.error || 'Yapay zeka testi üretirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        
        {/* Üst App Bar */}
        <View style={styles.appBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.6}>
            <MaterialIcons name="arrow-back-ios" size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.appBarTitle}>Akıllı Quiz Üretici</Text>
          <View style={styles.placeholderBtn} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.cardContainer}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="psychology" size={26} color={theme.primary} />
              <Text style={styles.sectionTitle}>Sana Özel Soru Bankası</Text>
            </View>
            <Text style={styles.infoText}>Eksik olduğunuz konuyu yazın, yapay zeka seviyenize uygun bir mini-test hazırlasın.</Text>

            {/* Konu Girişi */}
            <Text style={styles.inputLabel}>Ders veya Konu (Örn: TYT Optik, AYT Türev)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Hangi konudan test istersin?"
              placeholderTextColor={theme.textSecondary}
              value={topic}
              onChangeText={(text) => { setTopic(text); if (error) setError(null); }}
            />

            {/* Zorluk Seviyesi Seçici */}
            <Text style={[styles.inputLabel, { marginTop: 20 }]}>Zorluk Seviyesi</Text>
            <View style={styles.difficultyGroup}>
              {['Kolay', 'Orta', 'Zor'].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.difficultyBtn, 
                    difficulty === level && styles.difficultyActive,
                    difficulty === level && level === 'Kolay' && { backgroundColor: '#10b981', borderColor: '#10b981' },
                    difficulty === level && level === 'Orta' && { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
                    difficulty === level && level === 'Zor' && { backgroundColor: '#ef4444', borderColor: '#ef4444' }
                  ]}
                  onPress={() => setDifficulty(level)}
                >
                  <Text style={[styles.difficultyText, difficulty === level && styles.difficultyTextActive]}>{level}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Soru Sayısı Ayarlayıcı */}
            <View style={styles.counterRow}>
              <Text style={styles.inputLabel}>Soru Sayısı</Text>
              <View style={styles.counterControl}>
                <TouchableOpacity style={styles.counterBtn} onPress={decrementCount}>
                  <MaterialIcons name="remove" size={20} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.counterText}>{questionCount}</Text>
                <TouchableOpacity style={styles.counterBtn} onPress={incrementCount}>
                  <MaterialIcons name="add" size={20} color={theme.text} />
                </TouchableOpacity>
              </View>
            </View>

            {error && (
              <View style={styles.errorBox}>
                <MaterialIcons name="error-outline" size={20} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.actionBtn} onPress={handleGenerateQuiz} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.btnInner}>
                  <MaterialIcons name="settings-suggest" size={22} color="#fff" />
                  <Text style={styles.actionBtnText}>Testi Hazırla</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Quiz Sonuç Alanı */}
          {quizResult !== '' && (
            <View style={styles.resultBox}>
              <View style={styles.resultHeader}>
                <MaterialIcons name="assignment" size={24} color="#fff" />
                <Text style={styles.resultTitle}>Özel Testiniz Hazır</Text>
              </View>
              <View style={styles.resultContent}>
                <Text style={styles.resultText}>{quizResult}</Text>
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

  cardContainer: { backgroundColor: theme.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: theme.border, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDarkMode ? 0.3 : 0.05, shadowRadius: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text },
  infoText: { fontSize: 13, color: theme.textSecondary, marginBottom: 20, lineHeight: 20 },
  
  inputLabel: { fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 },
  textInput: { backgroundColor: theme.background, color: theme.text, borderRadius: 12, borderWidth: 1, borderColor: theme.border, padding: 14, fontSize: 15 },
  
  difficultyGroup: { flexDirection: 'row', gap: 10 },
  difficultyBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10, backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border },
  difficultyText: { fontSize: 14, fontWeight: 'bold', color: theme.textSecondary },
  difficultyTextActive: { color: '#ffffff' },

  counterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingBottom: 10 },
  counterControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.background, borderRadius: 12, borderWidth: 1, borderColor: theme.border, padding: 4 },
  counterBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.surface, borderRadius: 8 },
  counterText: { fontSize: 16, fontWeight: 'bold', color: theme.text, width: 40, textAlign: 'center' },

  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', padding: 14, borderRadius: 12, marginTop: 16, borderWidth: 1, borderColor: '#fecaca' },
  errorText: { color: '#ef4444', marginLeft: 10, fontSize: 14, flex: 1, fontWeight: '500' },
  
  actionBtn: { backgroundColor: theme.primary, padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 24, elevation: 3, shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  actionBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },

  resultBox: { marginTop: 24, borderRadius: 16, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#9c27b0', padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  resultTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  resultContent: { backgroundColor: theme.surface, padding: 20, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, borderWidth: 1, borderColor: theme.border, borderTopWidth: 0 },
  resultText: { fontSize: 15, color: theme.text, lineHeight: 26 }
});