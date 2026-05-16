import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, Keyboard } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../../api';
import { lightTheme, darkTheme } from '../../theme/colors';

export default function DailyReportScreen({ navigation, isDarkMode }) {
  const theme = isDarkMode ? darkTheme : lightTheme;
  const styles = createStyles(theme, isDarkMode);

  const [hours, setHours] = useState('');
  const [productivity, setProductivity] = useState('');
  const [message, setMessage] = useState('');
  
  const [aiReport, setAiReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Tarih İşlemleri
  const today = new Date();
  const currentDate = today.toISOString().split('T')[0];
  const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const dayName = days[today.getDay()];
  const formattedDate = today.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });

  // SAYFA YÜKLENDİĞİNDE BUGÜNÜN RAPORU VARSA ÇEK
  useEffect(() => {
    const fetchTodayReport = async () => {
      try {
        const response = await api.get(`/report/${currentDate}/`);
        if (response.data && (response.data.productivity || response.data.productivityScore)) {
          setHours(response.data.studyHours?.toString() || '');
          setProductivity((response.data.productivityScore || response.data.productivity)?.toString() || '');
          setMessage(response.data.dailyNotes || response.data.report || '');
        }
      } catch (err) {
        console.log("Bugünün raporu çekilemedi veya henüz oluşturulmadı.");
      }
    };
    fetchTodayReport();
  }, [currentDate]);

  // AI ANALİZİ OLUŞTURMA
  const handleGenerateAI = async () => {
    if (!hours || !productivity || !message) {
      setError('Lütfen AI analizi için saat, verimlilik ve mesaj alanlarını doldurun.');
      setSuccess(null);
      return;
    }
    setError(null);
    setSuccess(null);
    setLoading(true);
    Keyboard.dismiss();

    try {
      const prompt = `Ben bir öğrenciyim. Bugün ${hours} saat çalıştım ve verimliliğime 10 üzerinden ${productivity} puan verdim. Günüm hakkında şu notu düştüm: "${message}". Bana şefkatli bir rehber öğretmen gibi kısaca motive edici bir değerlendirme yazar mısın?`;
      
      const response = await api.post('/chat/', { message: prompt });
      setAiReport(response.data.reply || response.data.response || response.data.result);
      setSuccess('Yapay Zeka raporu başarıyla oluşturuldu!');
    } catch (err) {
      const prodNum = Number(productivity);
      let feedback = '';
      if (prodNum >= 8) feedback = 'Harika bir gün geçirmişsin! Yüksek verimlilikle hedeflerine adım adım yaklaşıyorsun.';
      else if (prodNum >= 5) feedback = 'Ortalama bir gün. Belki aralarda daha verimli molalar vererek odaklanmanı artırabilirsin.';
      else feedback = 'Bugün biraz zorlu geçmiş olabilir. Motivasyonunu düşürme, yarın yeni bir başlangıç yapabilirsin!';

      setAiReport(`Sistem Analizi:\nBugün toplam ${hours} saat çalıştın ve verimliliğini ${productivity}/10 olarak değerlendirdin. ${feedback}`);
      setSuccess('Sunucuya ulaşılamadı, çevrimdışı rapor oluşturuldu!');
    } finally {
      setLoading(false);
    }
  };

  // RAPORU KAYDETME
  const handleSaveReport = async () => {
    if (!hours || !productivity) {
      setError('Lütfen kaydetmek için en azından çalışma saati ve verimlilik puanı girin.');
      setSuccess(null);
      return;
    }
    
    setError(null);
    setSaveLoading(true);
    Keyboard.dismiss();

    try {
      await api.post('/report/', { 
        date: currentDate, 
        dailyNotes: message, 
        productivityScore: Number(productivity),
        studyHours: Number(hours)
      });

      setSuccess('Günlük çalışma raporu başarıyla veritabanına kaydedildi!');
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError('Kaydedilirken bir sunucu hatası oluştu.');
      setSuccess(null);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        
        <View style={styles.appBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.6}>
            <MaterialIcons name="arrow-back-ios" size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.appBarTitle}>Günlük Rapor</Text>
          <View style={styles.placeholderBtn} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.dateHeader}>
            <MaterialIcons name="today" size={28} color={theme.primary} />
            <Text style={styles.dateText}>{formattedDate} - {dayName}</Text>
          </View>

          <View style={styles.cardContainer}>
            <View style={styles.inputRow}>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Çalışma Süresi (Saat)</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  placeholder="Maks: 16"
                  placeholderTextColor={theme.textSecondary}
                  value={hours}
                  onChangeText={(val) => {
                    let newVal = val.replace(/[^0-9.]/g, '');
                    if (newVal !== '' && Number(newVal) > 16) newVal = '16';
                    setHours(newVal);
                    if (error) setError(null);
                  }}
                  maxLength={4}
                />
              </View>

              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Verimlilik (1-10)</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  placeholder="Örn: 8"
                  placeholderTextColor={theme.textSecondary}
                  value={productivity}
                  onChangeText={(val) => {
                    let newVal = val.replace(/[^0-9]/g, '');
                    if (newVal !== '' && Number(newVal) > 10) newVal = '10';
                    setProductivity(newVal);
                    if (error) setError(null);
                  }}
                  maxLength={2}
                />
              </View>
            </View>

            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Günün Özeti / Mesajın</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={4}
              placeholder="Bugün nasıl geçti? Hangi konularda zorlandın veya başarılı oldun?"
              placeholderTextColor={theme.textSecondary}
              value={message}
              onChangeText={(text) => {
                setMessage(text);
                if (error) setError(null);
              }}
              textAlignVertical="top"
            />
          </View>

          {error && (
            <View style={styles.errorBox}>
              <MaterialIcons name="error-outline" size={20} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {success && (
            <View style={styles.successBox}>
              <MaterialIcons name="check-circle-outline" size={20} color={isDarkMode ? '#34d399' : '#059669'} />
              <Text style={styles.successText}>{success}</Text>
            </View>
          )}

          <View style={styles.buttonsRow}>
            <TouchableOpacity style={styles.aiBtn} onPress={handleGenerateAI} disabled={loading || saveLoading}>
              {loading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <MaterialIcons name="auto-awesome" size={20} color="#fff" />
                  <Text style={styles.aiBtnText}>AI Raporu Al</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveReport} disabled={loading || saveLoading}>
              {saveLoading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <MaterialIcons name="save" size={20} color="#fff" />
                  <Text style={styles.saveBtnText}>Raporu Kaydet</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {aiReport !== '' && (
            <View style={styles.aiResultBox}>
              <View style={styles.aiResultHeader}>
                <MaterialIcons name="auto-awesome" size={22} color="#fff" />
                <Text style={styles.aiResultTitle}>AI Değerlendirmesi</Text>
              </View>
              <View style={styles.aiResultContent}>
                <Text style={styles.aiResultText}>{aiReport}</Text>
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

  dateHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginVertical: 16 },
  dateText: { fontSize: 18, fontWeight: 'bold', color: theme.primary },

  cardContainer: { backgroundColor: theme.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: theme.border, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDarkMode ? 0.3 : 0.05, shadowRadius: 4 },
  
  inputRow: { flexDirection: 'row', gap: 16 },
  halfInput: { flex: 1 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: theme.textSecondary, marginBottom: 8 },
  textInput: { backgroundColor: theme.background, color: theme.text, borderRadius: 12, borderWidth: 1, borderColor: theme.border, padding: 14, fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  
  textArea: { backgroundColor: theme.background, color: theme.text, borderRadius: 12, borderWidth: 1, borderColor: theme.border, padding: 16, fontSize: 15, height: 120 },

  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', padding: 14, borderRadius: 12, marginTop: 16, borderWidth: 1, borderColor: '#fecaca' },
  errorText: { color: '#ef4444', marginLeft: 10, fontSize: 14, flex: 1, fontWeight: '500' },
  
  successBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDarkMode ? '#064e3b' : '#ecfdf5', padding: 14, borderRadius: 12, marginTop: 16, borderWidth: 1, borderColor: isDarkMode ? '#047857' : '#a7f3d0' },
  successText: { color: isDarkMode ? '#34d399' : '#059669', marginLeft: 10, fontSize: 14, flex: 1, fontWeight: '600' },

  buttonsRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  aiBtn: { flex: 1, backgroundColor: theme.primary, paddingVertical: 14, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, elevation: 3 },
  aiBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  
  saveBtn: { flex: 1, backgroundColor: isDarkMode ? '#059669' : '#10b981', paddingVertical: 14, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, elevation: 3 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  aiResultBox: { marginTop: 24, borderRadius: 16, borderWidth: 1, borderColor: theme.border, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  aiResultHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.primary, padding: 16 },
  aiResultTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  aiResultContent: { backgroundColor: theme.surface, padding: 20 },
  aiResultText: { fontSize: 15, color: theme.text, lineHeight: 24, fontStyle: 'italic' }
});