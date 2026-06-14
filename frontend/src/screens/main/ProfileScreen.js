import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput, ActivityIndicator, Alert, Linking } from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native'; 
import { lightTheme, darkTheme } from '../../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../api'; 

export default function ProfileScreen({ navigation, isDarkMode, setIsDarkMode }) {
  const theme = isDarkMode ? darkTheme : lightTheme;
  const styles = createStyles(theme);

  // --- STATE YÖNETİMİ ---
  const [loading, setLoading] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [credits, setCredits] = useState(0);
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  
  // Gerçek İstatistik ve Liste Stateleri
  const [reportHistory, setReportHistory] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [stats, setStats] = useState({ avgPuan: 0, avgSaat: 0 });

  const [userData, setUserData] = useState({
    username: '',
    password: ''
  });

  const MAX_CREDITS = 20;

  // --- TÜM GERÇEK VERİLERİ BACKENDDEN ÇEKME (ODAKLANMA ETKİSİ) ---
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchAllProfileData = async () => {
        try {
          const profileRes = await api.get('/auth/profile/');
          const reportsRes = await api.get('/report/all/');
          const scheduleRes = await api.get('/schedule/');

          if (isActive) {
            setUserData({
              username: profileRes.data.username || '',
              password: '' 
            });
            setCredits(profileRes.data.ai_credits || 0);
            setIsCalendarConnected(profileRes.data.is_calendar_connected || false);

            // Raporları İşleme ve Aylık Ortalama Hesaplama
            if (reportsRes.data && Array.isArray(reportsRes.data)) {
              // Her gün için sadece bir rapor olmasını sağla (eskisini güncelleyerek)
              const uniqueReportsMap = new Map();
              reportsRes.data.forEach(report => {
                 uniqueReportsMap.set(report.date, report);
              });
              
              const uniqueReports = Array.from(uniqueReportsMap.values());
              // Tarihe göre sıralayıp son 30 günü al
              const sortedReports = uniqueReports.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 30);
              setReportHistory(sortedReports);

              // Aylık Ortalama İstatistikleri
              if (sortedReports.length > 0) {
                 const totalPuan = sortedReports.reduce((acc, curr) => acc + (Number(curr.productivityScore) || Number(curr.productivity) || 0), 0);
                 const totalSaat = sortedReports.reduce((acc, curr) => acc + (Number(curr.studyHours) || 0), 0);
                 setStats({
                    avgPuan: (totalPuan / sortedReports.length).toFixed(1),
                    avgSaat: (totalSaat / sortedReports.length).toFixed(1)
                 });
              } else {
                 setStats({ avgPuan: 0, avgSaat: 0 });
              }
            }

            // Takvim Programını İşleme
            if (scheduleRes.data && Array.isArray(scheduleRes.data)) {
              setSchedule(scheduleRes.data);
            }
          }
        } catch (err) {
          console.error("Profil verileri yüklenirken hata oluştu:", err);
        }
      };

      fetchAllProfileData();

      return () => {
        isActive = false;
      };
    }, [])
  );

  // --- PROFİL GÜNCELLEME ---
  const handleUpdate = async () => {
    setLoading(true);
    try {
      await api.put('/auth/profile/', userData);
      Alert.alert("Başarılı", "Profil bilgilerin başarıyla güncellendi!");
      setUserData(prev => ({ ...prev, password: '' })); 
    } catch (err) {
      const serverError = err.response?.data?.error || 'Profil güncellenirken bir hata oluştu.';
      Alert.alert("Hata", serverError);
    } finally {
      setLoading(false);
    }
  };

  // --- GOOGLE TAKVİM ENTEGRASYONU ---
  const handleConnectCalendar = async () => {
    setCalendarLoading(true);
    try {
      const response = await api.get('/calendar/auth/');
      if (response.data && response.data.auth_url) {
        Linking.openURL(response.data.auth_url);
      }
    } catch (err) {
      Alert.alert("Hata", "Takvim bağlantı linki alınamadı.");
    } finally {
      setCalendarLoading(false);
    }
  };

  // --- TAKVİMİ SENKRONİZE ET / GÜNCELLE ---
  const handleSyncCalendar = async () => {
    setCalendarLoading(true);
    try {
      await api.post('/calendar/sync/');
      Alert.alert("Başarılı", "Güncel takviminiz başarıyla eklendi/güncellendi.");
    } catch (err) {
      // Hata olsa bile kullanıcıyı bilgilendir
      Alert.alert("Bilgi", "Takvim etkinlikleri kontrol edildi.");
    } finally {
      setCalendarLoading(false);
    }
  };

  // --- HESAPTAN ÇIKIŞ ---
  const handleLogout = async () => {
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('refresh_token');
    navigation.replace('Login'); 
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Öğrenci Kontrol Merkezi</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        
        {/* PROFİL BAŞLIĞI KARTI */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatarPlaceholder}>
            <MaterialIcons name="school" size={48} color={theme.surface} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{userData.username || "Yükleniyor..."}</Text>
            <Text style={styles.userRole}>YKS Adayı</Text>
          </View>
        </View>

        {/* AYLIK ORTALAMA İSTATİSTİK PANELİ */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <MaterialIcons name="star" size={26} color="#f59e0b" />
            <Text style={styles.statValue}>{stats.avgPuan} / 10</Text>
            <Text style={styles.statLabel}>Ort. Verimlilik</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <MaterialIcons name="schedule" size={26} color="#3b82f6" />
            <Text style={styles.statValue}>{stats.avgSaat} Saat</Text>
            <Text style={styles.statLabel}>Ort. Çalışma</Text>
          </View>
        </View>

        {/* YAPAY ZEKA KOTASI */}
        <View style={styles.quotaCard}>
          <View style={styles.quotaHeader}>
            <MaterialIcons name="auto-awesome" size={24} color={credits < 5 ? "#ef4444" : theme.primary} />
            <Text style={styles.quotaTitle}>Yapay Zeka Kotası</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${(credits / MAX_CREDITS) * 100}%`, backgroundColor: credits < 5 ? "#ef4444" : theme.primary }]} />
          </View>
          <Text style={styles.quotaText}>Kalan Soru Hakkı: {credits} / {MAX_CREDITS}</Text>
        </View>

        {/* GOOGLE TAKVİM ENTEGRASYONU */}
        <View style={styles.integrationCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <FontAwesome5 name="google" size={18} color={isCalendarConnected ? theme.primary : theme.text} style={{ marginRight: 12 }} />
            <Text style={styles.integrationText}>Google Takvim</Text>
          </View>
          {isCalendarConnected ? (
            <View style={{ alignItems: 'flex-end' }}>
              <View style={[styles.connectedBadge, { marginBottom: 8 }]}>
                <MaterialIcons name="check-circle" size={16} color="#16a34a" />
                <Text style={styles.connectedText}>Bağlı</Text>
              </View>
              <TouchableOpacity style={styles.syncBtn} onPress={handleSyncCalendar} disabled={calendarLoading} activeOpacity={0.7}>
                {calendarLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.syncBtnText}>Takvimi Güncelle</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.connectBtn} onPress={handleConnectCalendar} disabled={calendarLoading} activeOpacity={0.7}>
              {calendarLoading ? <ActivityIndicator size="small" color={theme.surface} /> : <Text style={styles.connectBtnText}>Bağla</Text>}
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.sectionTitle}>Hesap Bilgilerini Düzenle</Text>

        {/* PROFİL GÜNCELLEME FORMU */}
        <View style={styles.formContainer}>
          <Text style={styles.inputLabel}>Kullanıcı Adı / E-Posta</Text>
          <TextInput 
            style={styles.input}
            value={userData.username}
            onChangeText={(text) => setUserData({...userData, username: text})}
            placeholderTextColor={theme.text + '50'}
            autoCapitalize="none"
          />

          <Text style={styles.inputLabel}>Yeni Şifre (Değiştirmeyecekseniz boş bırakın)</Text>
          <TextInput 
            style={styles.input}
            value={userData.password}
            onChangeText={(text) => setUserData({...userData, password: text})}
            placeholder="Yeni şifre girin..."
            placeholderTextColor={theme.text + '50'}
            secureTextEntry
          />

          <TouchableOpacity style={styles.updateBtn} onPress={handleUpdate} disabled={loading} activeOpacity={0.8}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.updateBtnText}>Bilgilerimi Güncelle</Text>}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Eğitim & Planlama</Text>

        {/* KAYITLI DERS PROGRAMI (LİSTE HALİNDE) */}
        <Text style={styles.listHeader}>Kayıtlı Ders Programım</Text>
        <View style={styles.listCard}>
          {schedule.length > 0 ? schedule.map((item, index) => (
            <View key={index} style={styles.listItem}>
              <Text style={[styles.listText, {fontWeight: 'bold', color: theme.primary}]}>{item.day || item.date || `Gün ${index+1}`}</Text>
              <Text style={styles.listText}>{item.lesson || item.title || item.subject || 'Planlı Ders'}</Text>
            </View>
          )) : <Text style={styles.emptyText}>Henüz kayıtlı bir programınız yok.</Text>}
        </View>

        {/* RAPOR GEÇMİŞİ (LİSTE HALİNDE) */}
        <Text style={styles.listHeader}>Rapor Geçmişi (Son 30 Gün)</Text>
        <View style={styles.listCard}>
          {reportHistory.length > 0 ? reportHistory.map((report, index) => (
            <View key={index} style={styles.listItem}>
              <Text style={[styles.listText, {fontWeight: 'bold', color: theme.primary}]}>{report.date}</Text>
              <Text style={styles.listText}>Puan: {report.productivityScore || report.productivity || 0}/10  |  Saat: {report.studyHours || 0}</Text>
            </View>
          )) : <Text style={styles.emptyText}>Henüz kayıtlı bir raporunuz yok.</Text>}
        </View>

        <Text style={styles.sectionTitle}>Uygulama Ayarları</Text>

        <TouchableOpacity style={styles.menuItem} onPress={() => setIsDarkMode(!isDarkMode)} activeOpacity={0.7}>
          <MaterialIcons name={isDarkMode ? "dark-mode" : "light-mode"} size={24} color={theme.text} />
          <Text style={styles.menuText}>Tema Görünümü ({isDarkMode ? "Karanlık" : "Aydınlık"})</Text>
          <MaterialIcons name="sync" size={20} color={theme.text} style={{ opacity: 0.5, marginLeft: 'auto' }} />
        </TouchableOpacity>

        {/* HESAPTAN ÇIKIŞ YAP */}
        <TouchableOpacity style={[styles.menuItem, styles.logoutBtn]} onPress={handleLogout} activeOpacity={0.7}>
          <MaterialIcons name="logout" size={24} color="#ef4444" />
          <Text style={[styles.menuText, { color: '#ef4444' }]}>Hesaptan Çıkış Yap</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.background },
  header: { paddingVertical: 16, alignItems: 'center', borderBottomWidth: 1, borderColor: theme.border, backgroundColor: theme.surface },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text },
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  profileHeaderCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.primary, padding: 20, borderRadius: 16, marginBottom: 16, elevation: 4 },
  avatarPlaceholder: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: theme.surface },
  profileInfo: { marginLeft: 16 },
  userName: { fontSize: 18, fontWeight: 'bold', color: theme.surface, marginBottom: 4 },
  userRole: { fontSize: 13, color: theme.surface, opacity: 0.9 },

  statsContainer: { flexDirection: 'row', backgroundColor: theme.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.border, elevation: 1 },
  statBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statDivider: { width: 1, backgroundColor: theme.border, marginHorizontal: 8 },
  statValue: { fontSize: 16, fontWeight: 'bold', color: theme.text, marginTop: 4 },
  statLabel: { fontSize: 12, color: theme.text, opacity: 0.6, marginTop: 2 },

  quotaCard: { backgroundColor: theme.surface, padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.border },
  quotaHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  quotaTitle: { fontSize: 15, fontWeight: 'bold', color: theme.text, marginLeft: 8 },
  progressBarBg: { height: 10, backgroundColor: theme.border, borderRadius: 5, overflow: 'hidden', marginBottom: 8 },
  progressBarFill: { height: '100%', borderRadius: 5 },
  quotaText: { fontSize: 12, color: theme.text, opacity: 0.7, textAlign: 'right' },

  integrationCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.surface, padding: 16, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: theme.border },
  integrationText: { fontSize: 15, fontWeight: '600', color: theme.text },
  connectedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#dcfce7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  connectedText: { color: '#16a34a', fontWeight: 'bold', fontSize: 12, marginLeft: 4 },
  connectBtn: { backgroundColor: theme.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  connectBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  syncBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  syncBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  sectionTitle: { fontSize: 13, fontWeight: '700', color: theme.text, opacity: 0.5, textTransform: 'uppercase', marginBottom: 12, marginLeft: 4, letterSpacing: 1 },
  listHeader: { fontSize: 13, color: theme.text, opacity: 0.8, marginBottom: 6, marginLeft: 4 },
  
  listCard: { backgroundColor: theme.surface, padding: 16, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: theme.border },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.border },
  listText: { fontSize: 14, color: theme.text },
  emptyText: { fontSize: 14, color: theme.text, opacity: 0.6, fontStyle: 'italic', textAlign: 'center', padding: 10 },

  formContainer: { backgroundColor: theme.surface, padding: 16, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: theme.border },
  inputLabel: { fontSize: 12, color: theme.text, opacity: 0.7, marginBottom: 6, marginLeft: 4 },
  input: { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border, borderRadius: 10, padding: 12, color: theme.text, marginBottom: 16 },
  updateBtn: { backgroundColor: theme.primary, padding: 14, borderRadius: 10, alignItems: 'center' },
  updateBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.border },
  menuText: { fontSize: 15, fontWeight: '600', color: theme.text, marginLeft: 16 },
  
  logoutBtn: { borderColor: '#fecaca', backgroundColor: '#fef2f2', marginTop: 10 }
});