import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, Keyboard } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native'; // Odaklanmayı dinlemek için eklendi
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
  const [reportHistory, setReportHistory] = useState([]);
  const [reportStats, setReportStats] = useState({ avgProductivity: '0.0', avgHours: '0.0' });
  const [historyLoading, setHistoryLoading] = useState(false);

  // Tarih İşlemleri
  const today = new Date();
  const currentDate = today.toISOString().split('T')[0];
  const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const dayName = days[today.getDay()];
  const formattedDate = today.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });

  const fetchReportHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const response = await api.get('/report/all/');
      const reports = Array.isArray(response.data)
        ? response.data
        : (Array.isArray(response.data?.reports) ? response.data.reports : []);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      const cutoff = new Date(todayEnd);
      cutoff.setDate(cutoff.getDate() - 29);
      cutoff.setHours(0, 0, 0, 0);

      const uniqueReports = new Map();
      reports.forEach((report) => {
        if (!report?.date) return;
        const reportDate = new Date(`${report.date}T00:00:00`);
        if (!Number.isNaN(reportDate.getTime()) && reportDate >= cutoff && reportDate <= todayEnd) {
          uniqueReports.set(report.date, report);
        }
      });

      const lastThirtyDays = Array.from(uniqueReports.values())
        .sort((first, second) => new Date(second.date) - new Date(first.date));
      const totalProductivity = lastThirtyDays.reduce(
        (sum, report) => sum + (Number(report.productivityScore ?? report.productivity) || 0),
        0
      );
      const totalHours = lastThirtyDays.reduce(
        (sum, report) => sum + (Number(report.studyHours) || 0),
        0
      );

      setReportHistory(lastThirtyDays);
      setReportStats({
        avgProductivity: lastThirtyDays.length ? (totalProductivity / lastThirtyDays.length).toFixed(1) : '0.0',
        avgHours: lastThirtyDays.length ? (totalHours / lastThirtyDays.length).toFixed(1) : '0.0',
      });
    } catch (err) {
      setReportHistory([]);
      setReportStats({ avgProductivity: '0.0', avgHours: '0.0' });
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // SAYFAYA HER GİRİLDİĞİNDE BUGÜNÜN RAPORUNU ÇEK (useFocusEffect ile güncellendi)
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchTodayReport = async () => {
        try {
          const response = await api.get(`/report/${currentDate}/`);
          if (isActive && response.data && (response.data.productivity || response.data.productivityScore)) {
            setHours(response.data.studyHours?.toString() || '');
            setProductivity((response.data.productivityScore || response.data.productivity)?.toString() || '');
            setMessage(response.data.dailyNotes || response.data.report || '');
            
            // Eğer daha önceden AI raporu üretilip kaydedildiyse onu da getir
            if (response.data.ai_feedback) {
                setAiReport(response.data.ai_feedback);
            } else {
                setAiReport(''); // Yeni günse temizle
            }
          }
        } catch (err) {
          console.log("Bugünün raporu çekilemedi veya henüz oluşturulmadı.");
        }
      };

      fetchTodayReport();
      fetchReportHistory();

      return () => {
        isActive = false; // Component unmount olursa memory leak önle
      };
    }, [currentDate, fetchReportHistory])
  );

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
        studyHours: Number(hours),
        ai_feedback: aiReport // Üretilen raporu da veritabanına yolluyoruz (Backend destekliyorsa)
      });

      setSuccess('Günlük çalışma raporu başarıyla veritabanına kaydedildi!');
      await fetchReportHistory();
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        
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
              maxLength={700}
              textAlignVertical="top"
            />
            <Text style={styles.characterCounter}>{message.length}/700</Text>
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

          <View style={styles.historySection}>
            <View style={styles.historyTitleRow}>
              <View>
                <Text style={styles.historyTitle}>Son 30 Gün</Text>
                <Text style={styles.historySubtitle}>{reportHistory.length} kayıtlı rapor</Text>
              </View>
              <MaterialIcons name="insights" size={28} color={theme.primary} />
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <MaterialIcons name="star" size={24} color="#f59e0b" />
                <Text style={styles.statValue}>{reportStats.avgProductivity} / 10</Text>
                <Text style={styles.statLabel}>Ort. Verimlilik</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <MaterialIcons name="schedule" size={24} color="#3b82f6" />
                <Text style={styles.statValue}>{reportStats.avgHours} Saat</Text>
                <Text style={styles.statLabel}>Günlük Ort. Çalışma</Text>
              </View>
            </View>

            <View style={styles.historyCard}>
              {historyLoading ? (
                <ActivityIndicator color={theme.primary} style={styles.historyLoader} />
              ) : reportHistory.length > 0 ? reportHistory.map((report, index) => (
                <View
                  key={report.date}
                  style={[styles.historyItem, index === reportHistory.length - 1 && styles.historyItemLast]}
                >
                  <View style={styles.historyDateBadge}>
                    <MaterialIcons name="event-note" size={18} color={theme.primary} />
                    <Text style={styles.historyDate}>{new Date(`${report.date}T00:00:00`).toLocaleDateString('tr-TR')}</Text>
                  </View>
                  <Text style={styles.historyMetrics}>
                    {report.productivityScore ?? report.productivity ?? 0}/10  •  {report.studyHours || 0} saat
                  </Text>
                  {(report.dailyNotes || report.report) ? (
                    <Text style={styles.historyNote} numberOfLines={2}>{report.dailyNotes || report.report}</Text>
                  ) : null}
                </View>
              )) : (
                <Text style={styles.emptyHistoryText}>Son 30 güne ait kaydedilmiş rapor bulunmuyor.</Text>
              )}
            </View>
          </View>

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
  
  textArea: { backgroundColor: theme.background, color: theme.text, borderRadius: 12, borderWidth: 1, borderColor: theme.border, padding: 16, paddingBottom: 28, fontSize: 15, height: 140 },
  characterCounter: { color: theme.textSecondary, fontSize: 12, fontWeight: '600', textAlign: 'right', marginTop: 6 },

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
  aiResultText: { fontSize: 15, color: theme.text, lineHeight: 24, fontStyle: 'italic' },

  historySection: { marginTop: 28 },
  historyTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 2 },
  historyTitle: { fontSize: 19, fontWeight: '800', color: theme.text },
  historySubtitle: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },
  statsContainer: { flexDirection: 'row', backgroundColor: theme.surface, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: theme.border },
  statBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statDivider: { width: 1, backgroundColor: theme.border, marginHorizontal: 8 },
  statValue: { fontSize: 16, fontWeight: '800', color: theme.text, marginTop: 5 },
  statLabel: { fontSize: 11, color: theme.textSecondary, marginTop: 3, textAlign: 'center' },
  historyCard: { backgroundColor: theme.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.border, overflow: 'hidden' },
  historyLoader: { paddingVertical: 28 },
  historyItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: theme.border },
  historyItemLast: { borderBottomWidth: 0 },
  historyDateBadge: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  historyDate: { color: theme.primary, fontWeight: '800', fontSize: 14 },
  historyMetrics: { color: theme.text, fontSize: 14, fontWeight: '700', marginTop: 8 },
  historyNote: { color: theme.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 6 },
  emptyHistoryText: { color: theme.textSecondary, fontSize: 14, fontStyle: 'italic', textAlign: 'center', padding: 24 }
});
