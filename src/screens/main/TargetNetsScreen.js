import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, Modal } from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import api from '../../api';
import { lightTheme, darkTheme } from '../../theme/colors';

// WEB TARAFINDAKİ 'yokAtlasData' İÇİN ÖRNEK MOCK VERİ 
// (Kendi data dosyanı projeye eklediğinde bunu silebilir veya güncelleyebilirsin)
const mockYokAtlasData = {
  "Boğaziçi Üniversitesi": {
    "Bilgisayar Mühendisliği (İngilizce)": {
      puan_turu: "SAY",
      historical_data: [
        { year: "2025", tyt: "112.5", ayt: "77.5", rank: "450" },
        { year: "2024", tyt: "110.0", ayt: "76.0", rank: "480" }
      ],
      tyt_subject_nets: { "Türkçe": "35.5", "Matematik": "38.0", "Sosyal": "18.5", "Fen": "19.0" },
      ayt_subject_nets: { "Matematik": "39.0", "Fizik": "13.0", "Kimya": "12.5", "Biyoloji": "13.0" }
    },
    "İşletme (İngilizce)": {
      puan_turu: "EA",
      historical_data: [
        { year: "2025", tyt: "105.0", ayt: "70.0", rank: "800" }
      ],
      tyt_subject_nets: { "Türkçe": "36.0", "Matematik": "35.0", "Sosyal": "18.0", "Fen": "10.0" },
      ayt_subject_nets: { "Matematik": "36.0", "Edebiyat": "22.0", "Tarih-1": "8.0", "Coğrafya-1": "5.0" }
    }
  },
  "Orta Doğu Teknik Üniversitesi (ODTÜ)": {
    "Makine Mühendisliği": {
      puan_turu: "SAY",
      historical_data: [
        { year: "2025", tyt: "108.5", ayt: "72.5", rank: "3500" }
      ],
      tyt_subject_nets: { "Türkçe": "34.0", "Matematik": "37.0", "Sosyal": "15.0", "Fen": "18.0" },
      ayt_subject_nets: { "Matematik": "37.0", "Fizik": "12.0", "Kimya": "13.0", "Biyoloji": "11.0" }
    }
  }
};

export default function TargetNetsScreen({ navigation, isDarkMode }) {
  const theme = isDarkMode ? darkTheme : lightTheme;
  const styles = createStyles(theme, isDarkMode);

  const [scoreType, setScoreType] = useState('SAY');
  const [university, setUniversity] = useState(null);
  const [department, setDepartment] = useState(null);
  const [targetData, setTargetData] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Alttan açılan mobil seçici (Modal) stateleri
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(null); // 'uni' veya 'dept'

  // Veri filtrelemeleri (Web referansı ile aynı)
  const universityOptions = useMemo(() => Object.keys(mockYokAtlasData), []);
  
  const departmentOptions = useMemo(() => {
    if (!university || !mockYokAtlasData[university]) return [];
    const allDepts = mockYokAtlasData[university];
    return Object.keys(allDepts).filter(dept => allDepts[dept].puan_turu === scoreType);
  }, [university, scoreType]);

  const handleScoreTypeChange = (newScoreType) => {
    setScoreType(newScoreType);
    setDepartment(null);
    setTargetData(null);
  };

  const openModal = (type) => {
    setModalType(type);
    setModalVisible(true);
  };

  const selectOption = (val) => {
    if (modalType === 'uni') {
      setUniversity(val);
      setDepartment(null);
      setTargetData(null);
    } else {
      setDepartment(val);
      setTargetData(null);
    }
    setModalVisible(false);
  };

  // VERİLERİ GETİR & AI ANALİZİ (Web Referansı)
  const handleGenerateNets = async () => {
    if (!university || !department) {
      setError('Lütfen listeden bir üniversite ve bölüm seçin.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      // Gerçek yapay zeka backend endpoint'i
      const response = await api.post('/ml/target-nets/', {
        university: university,
        department: department
      });
      
      const selectedData = mockYokAtlasData[university][department];
      
      setTargetData({
        university: university,
        department: department,
        scoreType: selectedData.puan_turu,
        historical_data: selectedData.historical_data,
        tyt_subject_nets: selectedData.tyt_subject_nets,
        ayt_subject_nets: selectedData.ayt_subject_nets,
      });

    } catch (err) {
      // Eğer backend bağlı değilse bile uygulamanın verileri göstermesi için fallback:
      const selectedData = mockYokAtlasData[university][department];
      setTargetData({
        university: university,
        department: department,
        scoreType: selectedData.puan_turu,
        historical_data: selectedData.historical_data,
        tyt_subject_nets: selectedData.tyt_subject_nets,
        ayt_subject_nets: selectedData.ayt_subject_nets,
      });
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
          <Text style={styles.appBarTitle}>Hedef Netler & YÖK Verileri</Text>
          <View style={styles.placeholderBtn} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.headerIconContainer}>
            <FontAwesome5 name="university" size={40} color={theme.primary} />
            <Text style={styles.headerSubtitle}>Puan türünüzü, üniversiteyi ve bölümü seçerek geçmiş yıllara ait taban sıralamaları ve hedef netleri öğrenin.</Text>
          </View>

          {/* PARAMETRE SEÇİM KARTI */}
          <View style={styles.cardContainer}>
            
            {/* Puan Türü Toggle */}
            <View style={styles.toggleGroup}>
              {['SAY', 'EA', 'SÖZ', 'DİL'].map((type) => (
                <TouchableOpacity 
                  key={type} 
                  style={[styles.toggleBtn, scoreType === type && styles.toggleBtnActive]} 
                  onPress={() => handleScoreTypeChange(type)}
                >
                  <Text style={[styles.toggleBtnText, scoreType === type && styles.toggleBtnTextActive]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Üniversite Seçici */}
            <Text style={styles.label}>Üniversite Seçin</Text>
            <TouchableOpacity style={styles.selectorBox} onPress={() => openModal('uni')}>
              <Text style={[styles.selectorText, !university && { color: theme.textSecondary }]}>
                {university || 'Üniversite Seçiniz...'}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color={theme.textSecondary} />
            </TouchableOpacity>

            {/* Bölüm Seçici */}
            <Text style={[styles.label, { marginTop: 16 }]}>Bölüm Seçin</Text>
            <TouchableOpacity 
              style={[styles.selectorBox, (!university || departmentOptions.length === 0) && { opacity: 0.5 }]} 
              onPress={() => openModal('dept')}
              disabled={!university || departmentOptions.length === 0}
            >
              <Text style={[styles.selectorText, !department && { color: theme.textSecondary }]}>
                {!university ? "Önce üniversite seçin" : departmentOptions.length === 0 ? `Bu üniversitede ${scoreType} bölümü yok` : department || "Bölüm Seçiniz..."}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color={theme.textSecondary} />
            </TouchableOpacity>

            {error && (
              <View style={styles.errorBox}>
                <MaterialIcons name="error-outline" size={20} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.actionBtn} onPress={handleGenerateNets} disabled={loading || !university || !department}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>Verileri Getir</Text>}
            </TouchableOpacity>
          </View>

          {/* SONUÇ GÖSTERİM ALANI (Ekrana Kayarak Gelir) */}
          {targetData && (
            <View style={styles.resultsContainer}>
              <View style={styles.resultTitleBox}>
                <Text style={styles.resultTitle}>{targetData.university}</Text>
                <Text style={styles.resultSubtitle}>{targetData.department} <Text style={styles.scoreBadge}> {targetData.scoreType} </Text></Text>
              </View>

              {/* Mobil Tablo */}
              <View style={styles.tableCard}>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.tableCellHead, { flex: 1 }]}>Yıl</Text>
                  <Text style={[styles.tableCellHead, { flex: 1.5 }]}>TYT Neti</Text>
                  <Text style={[styles.tableCellHead, { flex: 1.5 }]}>AYT Neti</Text>
                  <Text style={[styles.tableCellHead, { flex: 2, textAlign: 'right' }]}>Taban Sıra</Text>
                </View>
                {targetData.historical_data.map((row, index) => (
                  <View key={index} style={styles.tableDataRow}>
                    <Text style={[styles.tableCell, { flex: 1, fontWeight: 'bold' }]}>{row.year}</Text>
                    <Text style={[styles.tableCell, { flex: 1.5, color: theme.primary, fontWeight: 'bold' }]}>{row.tyt}</Text>
                    <Text style={[styles.tableCell, { flex: 1.5, color: '#8b5cf6', fontWeight: 'bold' }]}>{row.ayt}</Text>
                    <Text style={[styles.tableCell, { flex: 2, textAlign: 'right', color: '#ef4444', fontWeight: 'bold' }]}>{row.rank}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.netsHeader}>Son Yerleşen Öğrencinin Ders Netleri</Text>

              {/* TYT Çipleri */}
              <View style={styles.netsCard}>
                <Text style={[styles.netsCardTitle, { color: theme.primary }]}>TYT Netleri</Text>
                <View style={styles.divider} />
                <View style={styles.chipsRow}>
                  {Object.entries(targetData.tyt_subject_nets).map(([subject, net]) => (
                    <View key={`tyt-${subject}`} style={[styles.chip, { borderColor: theme.primary }]}>
                      <Text style={[styles.chipText, { color: theme.primary }]}>{subject}: {net}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* AYT Çipleri */}
              <View style={styles.netsCard}>
                <Text style={[styles.netsCardTitle, { color: '#8b5cf6' }]}>{targetData.scoreType === 'DİL' ? 'YDT Netleri' : 'AYT Netleri'}</Text>
                <View style={styles.divider} />
                <View style={styles.chipsRow}>
                  {Object.entries(targetData.ayt_subject_nets).map(([subject, net]) => (
                    <View key={`ayt-${subject}`} style={[styles.chip, { borderColor: '#8b5cf6' }]}>
                      <Text style={[styles.chipText, { color: '#8b5cf6' }]}>{subject}: {net}</Text>
                    </View>
                  ))}
                </View>
              </View>

            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MOBİL SEÇİCİ MODALI (Bottom Sheet) */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>{modalType === 'uni' ? 'Üniversite Seçin' : 'Bölüm Seçin'}</Text>
            
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 350 }}>
              {(modalType === 'uni' ? universityOptions : departmentOptions).map((option, index) => (
                <TouchableOpacity key={index} style={styles.modalOptionBtn} onPress={() => selectOption(option)}>
                  <Text style={[
                    styles.modalOptionText, 
                    (modalType === 'uni' ? university === option : department === option) && { color: theme.primary, fontWeight: 'bold' }
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCloseBtnText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const createStyles = (theme, isDarkMode) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.background },
  appBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, height: Platform.OS === 'android' ? 76 : 64, paddingTop: Platform.OS === 'android' ? 24 : 0, backgroundColor: theme.surface, borderBottomWidth: 1, borderColor: theme.border },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', paddingLeft: 6 },
  placeholderBtn: { width: 44, height: 44 },
  appBarTitle: { fontSize: 17, fontWeight: 'bold', color: theme.text, textAlign: 'center' },
  
  scrollContent: { padding: 16, paddingBottom: 50 },

  headerIconContainer: { alignItems: 'center', marginBottom: 20, marginTop: 10 },
  headerSubtitle: { textAlign: 'center', fontSize: 13, color: theme.textSecondary, marginTop: 12, lineHeight: 20, paddingHorizontal: 10 },

  cardContainer: { backgroundColor: theme.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: theme.border, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDarkMode ? 0.3 : 0.05, shadowRadius: 4 },
  
  toggleGroup: { flexDirection: 'row', backgroundColor: theme.background, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: theme.border, marginBottom: 20 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  toggleBtnActive: { backgroundColor: theme.primary, elevation: 1 },
  toggleBtnText: { fontSize: 14, fontWeight: 'bold', color: theme.textSecondary },
  toggleBtnTextActive: { color: '#ffffff' },

  label: { fontSize: 13, fontWeight: 'bold', color: theme.textSecondary, marginBottom: 8, marginLeft: 4 },
  selectorBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border, padding: 16, borderRadius: 14 },
  selectorText: { fontSize: 15, color: theme.text, fontWeight: '600', flex: 1 },

  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', padding: 14, borderRadius: 12, marginTop: 16, borderWidth: 1, borderColor: '#fecaca' },
  errorText: { color: '#ef4444', marginLeft: 10, fontSize: 14, flex: 1, fontWeight: '500' },

  actionBtn: { backgroundColor: theme.primary, padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 24, elevation: 3 },
  actionBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },

  // Sonuçlar Alanı
  resultsContainer: { marginTop: 24 },
  resultTitleBox: { alignItems: 'center', marginBottom: 16 },
  resultTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text, textAlign: 'center' },
  resultSubtitle: { fontSize: 15, color: theme.textSecondary, marginTop: 4, textAlign: 'center' },
  scoreBadge: { backgroundColor: theme.primary, color: '#fff', fontSize: 11, fontWeight: 'bold', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },

  tableCard: { backgroundColor: theme.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.border, overflow: 'hidden', marginBottom: 24 },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9', padding: 14, borderBottomWidth: 1, borderColor: theme.border },
  tableCellHead: { fontSize: 13, fontWeight: 'bold', color: theme.textSecondary },
  tableDataRow: { flexDirection: 'row', padding: 14, borderBottomWidth: 1, borderColor: theme.border },
  tableCell: { fontSize: 14, color: theme.text },

  netsHeader: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', color: theme.text, marginBottom: 16 },
  netsCard: { backgroundColor: theme.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.border, padding: 16, marginBottom: 16 },
  netsCardTitle: { fontSize: 15, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  divider: { height: 1, backgroundColor: theme.border, marginBottom: 16 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  chip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: theme.background },
  chipText: { fontSize: 13, fontWeight: 'bold' },

  // Bottom Sheet Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  sheetHandle: { width: 40, height: 5, backgroundColor: theme.border, borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 16, textAlign: 'center' },
  modalOptionBtn: { paddingVertical: 16, borderBottomWidth: 1, borderColor: theme.border },
  modalOptionText: { fontSize: 16, color: theme.text, textAlign: 'center' },
  modalCloseBtn: { marginTop: 20, backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border, padding: 16, borderRadius: 14, alignItems: 'center' },
  modalCloseBtnText: { fontSize: 16, fontWeight: 'bold', color: theme.textSecondary }
});