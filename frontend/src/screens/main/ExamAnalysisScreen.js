import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, Keyboard } from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
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

  // Ders Şablonları
  const [subjects, setSubjects] = useState([]);

  // Web mantığı: Sınav veya Alan değiştiğinde dersleri güncelle
  useEffect(() => {
    if (examType === 'TYT') {
      setSubjects([
        { name: 'Türkçe', dogru: '', wrong: '', blank: '' },
        { name: 'Matematik', dogru: '', wrong: '', blank: '' },
        { name: 'Fen Bilimleri', dogru: '', wrong: '', blank: '' },
        { name: 'Sosyal Bilimler', dogru: '', wrong: '', blank: '' },
      ]);
    } else {
      if (aytTrack === 'Sayısal') {
        setSubjects([
          { name: 'Matematik', dogru: '', wrong: '', blank: '' },
          { name: 'Fizik', dogru: '', wrong: '', blank: '' },
          { name: 'Kimya', dogru: '', wrong: '', blank: '' },
          { name: 'Biyoloji', dogru: '', wrong: '', blank: '' },
        ]);
      } else if (aytTrack === 'Sözel') {
        setSubjects([
          { name: 'Edebiyat', dogru: '', wrong: '', blank: '' },
          { name: 'Tarih', dogru: '', wrong: '', blank: '' },
          { name: 'Coğrafya', dogru: '', wrong: '', blank: '' },
          { name: 'Felsefe / Din', dogru: '', wrong: '', blank: '' },
        ]);
      } else { // Eşit Ağırlık
        setSubjects([
          { name: 'Matematik', dogru: '', wrong: '', blank: '' },
          { name: 'Edebiyat', dogru: '', wrong: '', blank: '' },
          { name: 'Tarih-1', dogru: '', wrong: '', blank: '' },
          { name: 'Coğrafya-1', dogru: '', wrong: '', blank: '' },
        ]);
      }
    }
  }, [examType, aytTrack]);

  // Web Mantığı: Her dersin maksimum soru sınırı
  const getSubjectLimit = (name) => {
    if (examType === 'AYT') {
      if (aytTrack === 'Sayısal') {
        if (name === 'Fizik') return 14;
        if (name === 'Kimya' || name === 'Biyoloji') return 13;
        if (name === 'Matematik') return 40;
      }
      if (aytTrack === 'Sözel') {
        if (name === 'Edebiyat') return 24;
        if (name === 'Tarih') return 21;
        if (name === 'Coğrafya') return 17;
        if (name === 'Felsefe / Din') return 18;
      }
      if (name === 'Matematik') return 40;
      if (name === 'Edebiyat') return 24;
      if (name === 'Tarih-1') return 10;
      if (name === 'Coğrafya-1') return 6;
      return 40;
    }
    // TYT Sınırları
    if (name === 'Türkçe' || name === 'Matematik') return 40;
    return 20; 
  };

  // Web Mantığı: Doğru/Yanlış/Boş girilirken limiti aşmayı engelleyen zeki koruma
  const updateSubject = (idx, field, value) => {
    let cleanVal = value.replace(/[^0-9]/g, ''); // Sadece rakam kabul et

    setSubjects(prev => prev.map((s, i) => {
      if (i !== idx) return s;
      
      const numVal = cleanVal === '' ? 0 : Number(cleanVal);
      const limit = getSubjectLimit(s.name);
      
      let d = field === 'dogru' ? numVal : Number(s.dogru || 0);
      let y = field === 'wrong' ? numVal : Number(s.wrong || 0);
      let b = field === 'blank' ? numVal : Number(s.blank || 0);

      // Toplamları limiti geçiyorsa değişikliği iptal et
      if (d + y + b > limit) {
        return s; 
      }
      
      return { ...s, [field]: cleanVal };
    }));
  };

  // Anlık Net Hesaplamaları
  const computedNets = subjects.map(s => {
    const d = Number(s.dogru || 0);
    const y = Number(s.wrong || 0);
    const net = d - (y * 0.25);
    return { name: s.name, net: Number(net.toFixed(2)) };
  });

  const totalNet = computedNets.reduce((sum, s) => sum + s.net, 0);

  // Analizi Backend'e Gönder
  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult('');
    Keyboard.dismiss();

    try {
      const response = await api.post('/ml/exam-analysis/', {
        examType: examType,
        goals: goals,
        subjects: computedNets // Sadece hesaplanan netleri gönderiyoruz
      });

      setResult(response.data.analysis);
    } catch (err) {
      setError('Analiz yapılırken bir hata oluştu. Sunucu bağlantınızı kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* Üst App Bar (Klavyeden etkilenmez) */}
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.6}>
          <MaterialIcons name="arrow-back-ios" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Deneme Analizi</Text>
        <View style={styles.placeholderBtn} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView 
          style={{ flex: 1 }} 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          
          <View style={styles.headerInfo}>
            <MaterialIcons name="assessment" size={40} color={theme.primary} />
            <Text style={styles.mainTitle}>Netlerini Öğren, {"\n"}Yapay Zeka Yorumlasın</Text>
          </View>

          {/* Sınav Türü Seçici (TYT / AYT) */}
          <View style={styles.segmentedControl}>
            {['TYT', 'AYT'].map(type => (
              <TouchableOpacity 
                key={type} 
                style={[styles.segmentBtn, examType === type && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                onPress={() => setExamType(type)}
                activeOpacity={0.8}
              >
                <Text style={[styles.segmentText, examType === type && { color: '#fff' }]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* AYT İse Alan Seçici */}
          {examType === 'AYT' && (
            <View style={[styles.segmentedControl, { marginTop: 10 }]}>
              {['Sayısal', 'Eşit Ağırlık', 'Sözel'].map(track => (
                <TouchableOpacity 
                  key={track} 
                  style={[styles.segmentBtn, aytTrack === track && { backgroundColor: theme.text, borderColor: theme.text }]}
                  onPress={() => setAytTrack(track)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.segmentText, aytTrack === track && { color: theme.background }]}>{track}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Derslerin D, Y, B Giriş Kartları */}
          <View style={styles.subjectsContainer}>
            {subjects.map((s, idx) => (
              <View key={idx} style={styles.subjectCard}>
                
                {/* Kart Üst Bilgi */}
                <View style={styles.subjectCardHeader}>
                  <View>
                    <Text style={styles.subjectName}>{s.name}</Text>
                    <Text style={styles.subjectLimit}>Maksimum: {getSubjectLimit(s.name)} Soru</Text>
                  </View>
                  <View style={styles.netChip}>
                    <Text style={styles.netChipText}>{computedNets[idx].net} Net</Text>
                  </View>
                </View>

                {/* D Y B Girdileri */}
                <View style={styles.inputRow}>
                  <View style={styles.inputBox}>
                    <Text style={styles.inputLabel}>Doğru</Text>
                    <TextInput 
                      style={[styles.numberInput, { color: '#10b981', borderColor: '#10b98150' }]} 
                      keyboardType="numeric" 
                      value={s.dogru} 
                      onChangeText={(val) => updateSubject(idx, 'dogru', val)} 
                    />
                  </View>
                  <View style={styles.inputBox}>
                    <Text style={styles.inputLabel}>Yanlış</Text>
                    <TextInput 
                      style={[styles.numberInput, { color: '#ef4444', borderColor: '#ef444450' }]} 
                      keyboardType="numeric" 
                      value={s.wrong} 
                      onChangeText={(val) => updateSubject(idx, 'wrong', val)} 
                    />
                  </View>
                  <View style={styles.inputBox}>
                    <Text style={styles.inputLabel}>Boş</Text>
                    <TextInput 
                      style={[styles.numberInput, { color: theme.textSecondary, borderColor: theme.border }]} 
                      keyboardType="numeric" 
                      value={s.blank} 
                      onChangeText={(val) => updateSubject(idx, 'blank', val)} 
                    />
                  </View>
                </View>

              </View>
            ))}
          </View>

          {/* Toplam Net Görünümü */}
          <View style={styles.totalNetBox}>
            <Text style={styles.totalNetTitle}>Toplam Netiniz</Text>
            <Text style={styles.totalNetValue}>{totalNet.toFixed(2)} NET</Text>
          </View>

          {/* Kişisel Hedef Girişi */}
          <Text style={styles.goalsLabel}>Kişisel Hedefiniz / Notunuz (Opsiyonel)</Text>
          <TextInput
            style={styles.goalsInput}
            multiline
            minRows={2}
            placeholder="Örn: Süre yetiştiremedim, fende zorlandım..."
            placeholderTextColor={theme.textSecondary}
            value={goals}
            onChangeText={setGoals}
            textAlignVertical="top"
          />

          {error && (
            <View style={styles.errorBox}>
              <MaterialIcons name="error-outline" size={20} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Analiz Butonu */}
          <TouchableOpacity style={styles.actionBtn} onPress={handleAnalyze} disabled={loading} activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.btnInner}>
                <MaterialIcons name="auto-awesome" size={22} color="#fff" />
                <Text style={styles.actionBtnText}>Yapay Zeka ile Analiz Et</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Yapay Zeka Sonuç Çıktısı */}
          {result !== '' && (
            <View style={styles.resultBox}>
              <View style={styles.resultHeader}>
                <MaterialIcons name="insights" size={24} color="#fff" />
                <Text style={styles.resultTitle}>Analiz Sonucu</Text>
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
  appBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, height: Platform.OS === 'android' ? 76 : 64, paddingTop: Platform.OS === 'android' ? 24 : 0, backgroundColor: theme.surface, borderBottomWidth: 1, borderColor: theme.border },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', paddingLeft: 6 },
  placeholderBtn: { width: 44, height: 44 },
  appBarTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text, textAlign: 'center' },
  
  // Dev alt boşlukla rahat kaydırma sağlandı
  scrollContent: { padding: 16, paddingBottom: 150 },

  headerInfo: { alignItems: 'center', marginBottom: 24, marginTop: 10 },
  mainTitle: { fontSize: 22, fontWeight: 'bold', color: theme.text, textAlign: 'center', marginTop: 12, lineHeight: 30 },

  segmentedControl: { flexDirection: 'row', backgroundColor: theme.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.border, padding: 4 },
  segmentBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  segmentText: { fontSize: 14, fontWeight: 'bold', color: theme.textSecondary },

  subjectsContainer: { marginTop: 24, gap: 16 },
  subjectCard: { backgroundColor: theme.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.border, elevation: 1 },
  subjectCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  subjectName: { fontSize: 16, fontWeight: 'bold', color: theme.text },
  subjectLimit: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },
  
  netChip: { backgroundColor: theme.primary + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: theme.primary + '50' },
  netChipText: { color: theme.primary, fontWeight: 'bold', fontSize: 14 },

  inputRow: { flexDirection: 'row', gap: 12 },
  inputBox: { flex: 1 },
  inputLabel: { fontSize: 12, color: theme.textSecondary, textAlign: 'center', marginBottom: 6, fontWeight: '600' },
  numberInput: { backgroundColor: theme.background, borderWidth: 1, borderRadius: 10, paddingVertical: 10, textAlign: 'center', fontSize: 16, fontWeight: 'bold' },

  totalNetBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isDarkMode ? '#064e3b' : '#ecfdf5', padding: 20, borderRadius: 16, marginTop: 24, borderWidth: 1, borderColor: isDarkMode ? '#047857' : '#a7f3d0' },
  totalNetTitle: { fontSize: 16, fontWeight: 'bold', color: theme.text },
  totalNetValue: { fontSize: 22, fontWeight: '900', color: isDarkMode ? '#34d399' : '#059669' },

  goalsLabel: { fontSize: 14, fontWeight: 'bold', color: theme.text, marginTop: 24, marginBottom: 8, marginLeft: 4 },
  goalsInput: { backgroundColor: theme.surface, color: theme.text, borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 16, fontSize: 15, minHeight: 80 },

  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', padding: 14, borderRadius: 12, marginTop: 16, borderWidth: 1, borderColor: '#fecaca' },
  errorText: { color: '#ef4444', marginLeft: 10, fontSize: 14, flex: 1, fontWeight: '500' },
  
  actionBtn: { backgroundColor: theme.primary, padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 24, elevation: 3, shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  actionBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },

  resultBox: { marginTop: 32, borderRadius: 16, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#0284c7', padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  resultTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  resultContent: { backgroundColor: theme.surface, padding: 20, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, borderWidth: 1, borderColor: theme.border, borderTopWidth: 0 },
  resultText: { fontSize: 15, color: theme.text, lineHeight: 26 }
});