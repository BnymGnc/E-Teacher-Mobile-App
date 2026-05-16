import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../../api';
import { lightTheme, darkTheme } from '../../theme/colors';

export default function ExamAnalysisScreen({ navigation, isDarkMode }) {
  const theme = isDarkMode ? darkTheme : lightTheme;
  const styles = createStyles(theme, isDarkMode);

  const [examType, setExamType] = useState('TYT');
  const [aytTrack, setAytTrack] = useState('Sayısal');
  const [goals, setGoals] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState('');

  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    if (examType === 'TYT') {
      setSubjects([
        { name: 'Türkçe', dogru: '0', wrong: '0', blank: '0' },
        { name: 'Matematik', dogru: '0', wrong: '0', blank: '0' },
        { name: 'Fen Bilimleri', dogru: '0', wrong: '0', blank: '0' },
        { name: 'Sosyal Bilgiler', dogru: '0', wrong: '0', blank: '0' },
      ]);
    } else {
      if (aytTrack === 'Sayısal') {
        setSubjects([
          { name: 'Matematik', dogru: '0', wrong: '0', blank: '0' },
          { name: 'Fizik', dogru: '0', wrong: '0', blank: '0' },
          { name: 'Kimya', dogru: '0', wrong: '0', blank: '0' },
          { name: 'Biyoloji', dogru: '0', wrong: '0', blank: '0' },
        ]);
      } else if (aytTrack === 'Eşit Ağırlık') {
        setSubjects([
          { name: 'Matematik', dogru: '0', wrong: '0', blank: '0' },
          { name: 'Edebiyat', dogru: '0', wrong: '0', blank: '0' },
          { name: 'Tarih-1', dogru: '0', wrong: '0', blank: '0' },
          { name: 'Coğrafya-1', dogru: '0', wrong: '0', blank: '0' },
        ]);
      } else if (aytTrack === 'Sözel') {
        setSubjects([
          { name: 'Edebiyat', dogru: '0', wrong: '0', blank: '0' },
          { name: 'Tarih-1', dogru: '0', wrong: '0', blank: '0' },
          { name: 'Coğrafya-1', dogru: '0', wrong: '0', blank: '0' },
          { name: 'Tarih-2', dogru: '0', wrong: '0', blank: '0' },
          { name: 'Coğrafya-2', dogru: '0', wrong: '0', blank: '0' },
          { name: 'Felsefe Grubu', dogru: '0', wrong: '0', blank: '0' },
          { name: 'Din Kültürü', dogru: '0', wrong: '0', blank: '0' },
        ]);
      } else {
        setSubjects([
          { name: 'Yabancı Dil', dogru: '0', wrong: '0', blank: '0' },
        ]);
      }
    }
  }, [examType, aytTrack]);

  const handleInputChange = (index, field, value) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    const updatedSubjects = [...subjects];
    updatedSubjects[index][field] = numericValue;
    setSubjects(updatedSubjects);
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult('');

    try {
      const response = await api.post('/ml/exam-analysis/', {
        exam_type: examType,
        track: examType === 'AYT' ? aytTrack : null,
        subjects: subjects.map(s => ({
          name: s.name,
          dogru: parseInt(s.dogru) || 0,
          wrong: parseInt(s.wrong) || 0,
          blank: parseInt(s.blank) || 0,
        })),
        goals: goals,
      });

      setResult(response.data.analysis || response.data.result);
    } catch (err) {
      setError(err.response?.data?.error || 'Analiz oluşturulurken sunucu hatası gerçekleşti.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        
        {/* Yenilenen ve Dengelenen Üst App Bar */}
        <View style={styles.appBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.6}>
            <MaterialIcons name="arrow-back-ios" size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.appBarTitle}>Deneme Analizi</Text>
          <View style={styles.placeholderBtn} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Sınav Türünü Seç Kartı */}
          <View style={styles.cardContainer}>
            <Text style={styles.sectionTitle}>Sınav Türünü Seç</Text>
            <View style={styles.selectorGroup}>
              {['TYT', 'AYT'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.selectorBtn, examType === type && styles.selectorActive]}
                  onPress={() => setExamType(type)}
                >
                  <Text style={[styles.selectorText, examType === type && styles.selectorTextActive]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {examType === 'AYT' && (
              <View style={styles.trackContainer}>
                <Text style={styles.sectionTitle}>AYT Alanınız</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trackScroll}>
                  {['Sayısal', 'Eşit Ağırlık', 'Sözel', 'Dil'].map((track) => (
                    <TouchableOpacity
                      key={track}
                      style={[styles.trackBtn, aytTrack === track && styles.trackActive]}
                      onPress={() => setAytTrack(track)}
                    >
                      <Text style={[styles.trackText, aytTrack === track && styles.trackTextActive]}>{track}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Not Giriş Tablosu Kartı */}
          <View style={[styles.cardContainer, { marginTop: 16 }]}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeadText, { flex: 2.5, textAlign: 'left', paddingLeft: 10 }]}>Ders</Text>
              <Text style={[styles.tableHeadText, { flex: 1, color: '#10b981' }]}>D</Text>
              <Text style={[styles.tableHeadText, { flex: 1, color: '#ef4444' }]}>Y</Text>
              <Text style={[styles.tableHeadText, { flex: 1, color: '#f59e0b' }]}>B</Text>
            </View>

            {subjects.map((subject, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.subjectName, { flex: 2.5 }]} numberOfLines={1}>{subject.name}</Text>
                
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[styles.tableInput, styles.inputDogru]}
                    keyboardType="number-pad"
                    value={subject.dogru}
                    onChangeText={(val) => handleInputChange(index, 'dogru', val)}
                    maxLength={2}
                    selectTextOnFocus
                  />
                </View>
                
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[styles.tableInput, styles.inputWrong]}
                    keyboardType="number-pad"
                    value={subject.wrong}
                    onChangeText={(val) => handleInputChange(index, 'wrong', val)}
                    maxLength={2}
                    selectTextOnFocus
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[styles.tableInput, styles.inputBlank]}
                    keyboardType="number-pad"
                    value={subject.blank}
                    onChangeText={(val) => handleInputChange(index, 'blank', val)}
                    maxLength={2}
                    selectTextOnFocus
                  />
                </View>
              </View>
            ))}
          </View>

          {/* Hedef ve Analiz Butonu */}
          <View style={[styles.cardContainer, { marginTop: 16 }]}>
            <Text style={styles.sectionTitle}>Not veya Hedef (Opsiyonel)</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={3}
              placeholder="Örn: Geometride zaman kaybettim..."
              placeholderTextColor={theme.textSecondary}
              value={goals}
              onChangeText={setGoals}
            />

            {error && (
              <View style={styles.errorBox}>
                <MaterialIcons name="error-outline" size={20} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.actionBtn} onPress={handleAnalyze} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.btnInner}>
                  <MaterialIcons name="auto-awesome" size={22} color="#fff" />
                  <Text style={styles.actionBtnText}>Yapay Zeka ile Analiz Et</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Sonuç Alanı */}
          {result !== '' && (
            <View style={styles.resultBox}>
              <View style={styles.resultHeader}>
                <MaterialIcons name="insights" size={26} color="#fff" />
                <Text style={styles.resultTitle}>AI Analiz Raporu</Text>
              </View>
              <View style={styles.resultContent}>
                <Text style={styles.resultText}>{result}</Text>
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
  
  // Üst bar yüksekliği ve padding koruması güncellendi
  appBar: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    height: Platform.OS === 'android' ? 76 : 64, 
    paddingTop: Platform.OS === 'android' ? 24 : 0, 
    backgroundColor: theme.surface, 
    borderBottomWidth: 1, 
    borderColor: theme.border 
  },
  backBtn: { 
    width: 44, 
    height: 44, 
    justifyContent: 'center', 
    alignItems: 'center',
    paddingLeft: 6 // İkonun sola kayıklığını dengelemek için iç padding
  },
  placeholderBtn: { width: 44, height: 44 }, // Başlığı tam ortada kilitlemek için sağ simetri alanı
  appBarTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text, textAlign: 'center' },
  
  scrollContent: { padding: 16, paddingBottom: 50 },
  cardContainer: { backgroundColor: theme.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.border, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDarkMode ? 0.3 : 0.05, shadowRadius: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: 12 },
  
  selectorGroup: { flexDirection: 'row', backgroundColor: theme.background, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: theme.border },
  selectorBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  selectorActive: { backgroundColor: theme.primary, elevation: 1 },
  selectorText: { fontSize: 15, fontWeight: 'bold', color: theme.textSecondary },
  selectorTextActive: { color: '#ffffff' },

  trackContainer: { marginTop: 20 },
  trackScroll: { gap: 10, paddingBottom: 4 },
  trackBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border },
  trackActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  trackText: { fontSize: 14, fontWeight: '600', color: theme.text },
  trackTextActive: { color: '#ffffff' },

  tableHeader: { flexDirection: 'row', paddingBottom: 12, borderBottomWidth: 1, borderColor: theme.border, alignItems: 'center' },
  tableHeadText: { textAlign: 'center', fontWeight: 'bold', color: theme.textSecondary, fontSize: 14 },
  tableRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderColor: theme.border, alignItems: 'center' },
  subjectName: { fontSize: 15, fontWeight: '600', color: theme.text, paddingLeft: 10 },
  
  inputWrapper: { flex: 1, paddingHorizontal: 4 },
  tableInput: { backgroundColor: theme.background, color: theme.text, textAlign: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: theme.border, fontSize: 15, fontWeight: 'bold' },
  inputDogru: { backgroundColor: isDarkMode ? '#10b98120' : '#ecfdf5', borderColor: isDarkMode ? '#10b98140' : '#a7f3d0', color: isDarkMode ? '#34d399' : '#059669' },
  inputWrong: { backgroundColor: isDarkMode ? '#ef444420' : '#fef2f2', borderColor: isDarkMode ? '#ef444440' : '#fecaca', color: isDarkMode ? '#f87171' : '#dc2626' },
  inputBlank: { backgroundColor: isDarkMode ? '#f59e0b20' : '#fffbeb', borderColor: isDarkMode ? '#f59e0b40' : '#fde68a', color: isDarkMode ? '#fbbf24' : '#d97706' },

  textArea: { backgroundColor: theme.background, color: theme.text, borderRadius: 12, borderWidth: 1, borderColor: theme.border, padding: 16, fontSize: 15, height: 90, textAlignVertical: 'top' },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', padding: 14, borderRadius: 12, marginTop: 16, borderWidth: 1, borderColor: '#fecaca' },
  errorText: { color: '#ef4444', marginLeft: 10, fontSize: 14, flex: 1, fontWeight: '500' },
  
  actionBtn: { backgroundColor: theme.primary, padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 20, elevation: 3, shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  actionBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },

  resultBox: { marginTop: 24, borderRadius: 16, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.primary, padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  resultTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  resultContent: { backgroundColor: theme.surface, padding: 20, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, borderWidth: 1, borderColor: theme.border, borderTopWidth: 0 },
  resultText: { fontSize: 15, color: theme.text, lineHeight: 24 }
});