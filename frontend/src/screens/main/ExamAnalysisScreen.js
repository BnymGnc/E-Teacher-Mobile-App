import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { lightTheme, darkTheme } from '../../theme/colors';

export default function ExamAnalysisScreen({ navigation, isDarkMode }) {
  const theme = isDarkMode ? darkTheme : lightTheme;
  const styles = createStyles(theme, isDarkMode);

  const [examType, setExamType] = useState('TYT');
  const [aytTrack, setAytTrack] = useState('Sayısal');

  const [subjects, setSubjects] = useState([]);

  // Sınav türüne göre dersleri getir
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
      } else { 
        setSubjects([
          { name: 'Matematik', dogru: '', wrong: '', blank: '' },
          { name: 'Edebiyat', dogru: '', wrong: '', blank: '' },
          { name: 'Tarih-1', dogru: '', wrong: '', blank: '' },
          { name: 'Coğrafya-1', dogru: '', wrong: '', blank: '' },
        ]);
      }
    }
  }, [examType, aytTrack]);

  // Her dersin maksimum soru sınırı
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
    return (name === 'Türkçe' || name === 'Matematik') ? 40 : 20; 
  };

  // Girilen sayıları kontrol et ve maksimum sınırı aşmasını engelle
  const updateSubject = (idx, field, value) => {
    let cleanVal = value.replace(/[^0-9]/g, ''); 

    setSubjects(prev => prev.map((s, i) => {
      if (i !== idx) return s;
      
      const numVal = cleanVal === '' ? 0 : Number(cleanVal);
      const limit = getSubjectLimit(s.name);
      
      let d = field === 'dogru' ? numVal : Number(s.dogru || 0);
      let y = field === 'wrong' ? numVal : Number(s.wrong || 0);
      let b = field === 'blank' ? numVal : Number(s.blank || 0);

      // Toplam sınırı geçiyorsa reddet
      if (d + y + b > limit) return s; 
      
      return { ...s, [field]: cleanVal };
    }));
  };

  // Anlık Net Hesaplama
  const computedNets = subjects.map(s => {
    const d = Number(s.dogru || 0);
    const y = Number(s.wrong || 0);
    const net = d - (y * 0.25);
    return { name: s.name, net: Number(net.toFixed(2)) };
  });

  const totalNet = computedNets.reduce((sum, s) => sum + s.net, 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* Sabit Üst Bar */}
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.6}>
          <MaterialIcons name="arrow-back-ios" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Net Hesaplayıcı</Text>
        <View style={styles.placeholderBtn} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={{ flex: 1 }}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false} 
          keyboardShouldPersistTaps="handled"
        >
          
          <View style={styles.headerInfo}>
            <MaterialIcons name="assessment" size={40} color={theme.primary} />
            <Text style={styles.mainTitle}>Hızlı ve Kesin{"\n"}Net Hesaplama</Text>
          </View>

          {/* Sınav Türü Seçici */}
          <View style={styles.segmentedControl}>
            {['TYT', 'AYT'].map(type => (
              <TouchableOpacity 
                key={type} 
                style={[styles.segmentBtn, examType === type && { backgroundColor: theme.primary }]}
                onPress={() => setExamType(type)}
                activeOpacity={0.8}
              >
                <Text style={[styles.segmentText, examType === type && { color: '#fff' }]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* AYT Alan Seçici */}
          {examType === 'AYT' && (
            <View style={[styles.segmentedControl, { marginTop: 12 }]}>
              {['Sayısal', 'Eşit Ağırlık', 'Sözel'].map(track => (
                <TouchableOpacity 
                  key={track} 
                  style={[styles.segmentBtn, aytTrack === track && { backgroundColor: theme.text }]}
                  onPress={() => setAytTrack(track)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.segmentText, aytTrack === track && { color: theme.background }]}>{track}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* KART TASARIMI */}
          <View style={styles.subjectsContainer}>
            {subjects.map((s, idx) => (
              <View key={idx} style={styles.subjectCard}>
                
                <View style={styles.subjectCardHeader}>
                  <View>
                    <Text style={styles.subjectName}>{s.name}</Text>
                    <Text style={styles.subjectLimit}>Maksimum: {getSubjectLimit(s.name)} Soru</Text>
                  </View>
                  <View style={styles.netChip}>
                    <Text style={styles.netChipText}>{computedNets[idx].net} Net</Text>
                  </View>
                </View>

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

          {/* SADECE TOPLAM NET KUTUSU KALDI */}
          <View style={styles.totalNetBox}>
            <Text style={styles.totalNetTitle}>Toplam Netiniz</Text>
            <Text style={styles.totalNetValue}>{totalNet.toFixed(2)} NET</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme, isDarkMode) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.background },
  appBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, height: Platform.OS === 'android' ? 76 : 64, paddingTop: Platform.OS === 'android' ? 24 : 0, backgroundColor: theme.surface, borderBottomWidth: 1, borderColor: theme.border },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' },
  placeholderBtn: { width: 44, height: 44 },
  appBarTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text },
  
  scrollContent: { flexGrow: 1, padding: 16, paddingBottom: 60 },

  headerInfo: { alignItems: 'center', marginBottom: 24, marginTop: 10 },
  mainTitle: { fontSize: 22, fontWeight: 'bold', color: theme.text, textAlign: 'center', marginTop: 12, lineHeight: 30 },

  segmentedControl: { flexDirection: 'row', backgroundColor: theme.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.border, padding: 4 },
  segmentBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  segmentText: { fontSize: 14, fontWeight: 'bold', color: theme.textSecondary },

  subjectsContainer: { marginTop: 24 },
  subjectCard: { backgroundColor: theme.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.border, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
  subjectCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  subjectName: { fontSize: 16, fontWeight: 'bold', color: theme.text },
  subjectLimit: { fontSize: 12, color: theme.textSecondary, marginTop: 4 },
  
  netChip: { backgroundColor: theme.primary + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: theme.primary + '40' },
  netChipText: { color: theme.primary, fontWeight: 'bold', fontSize: 14 },

  inputRow: { flexDirection: 'row', gap: 12 },
  inputBox: { flex: 1 },
  inputLabel: { fontSize: 13, color: theme.textSecondary, textAlign: 'center', marginBottom: 8, fontWeight: '600' },
  numberInput: { backgroundColor: theme.background, borderWidth: 1, borderRadius: 12, paddingVertical: 12, textAlign: 'center', fontSize: 16, fontWeight: 'bold' },

  totalNetBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isDarkMode ? '#064e3b' : '#ecfdf5', padding: 20, borderRadius: 16, marginTop: 10, borderWidth: 1, borderColor: isDarkMode ? '#047857' : '#a7f3d0' },
  totalNetTitle: { fontSize: 16, fontWeight: 'bold', color: theme.text },
  totalNetValue: { fontSize: 24, fontWeight: '900', color: isDarkMode ? '#34d399' : '#059669' }
});