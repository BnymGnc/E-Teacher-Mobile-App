import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput, ActivityIndicator, Alert, Linking } from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native'; // ANLIK YENİLEME İÇİN EKLENDİ
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
  
  const [userData, setUserData] = useState({
    username: '',
    password: ''
  });

  const MAX_CREDITS = 20;

  // --- VERİLERİ ÇEKME (SAYFAYA HER ODAKLANILDIĞINDA ÇALIŞIR) ---
  useFocusEffect(
    useCallback(() => {
      let isActive = true; // Sayfa değiştirilirse isteği iptal etmek için

      const fetchProfile = async () => {
        try {
          const response = await api.get('/auth/profile/');
          if (isActive) {
            setUserData({
              username: response.data.username || '',
              password: '' 
            });
            setCredits(response.data.ai_credits || 0);
            setIsCalendarConnected(response.data.is_calendar_connected || false);
          }
        } catch (err) {
          console.error("Profil çekme hatası:", err);
        }
      };

      fetchProfile();

      return () => {
        isActive = false; // Temizlik (Cleanup) işlemi
      };
    }, [])
  );

  // --- PROFİL GÜNCELLEME ---
  const handleUpdate = async () => {
    setLoading(true);
    try {
      await api.put('/auth/profile/', userData);
      Alert.alert("Başarılı", "Profilin başarıyla güncellendi!");
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
      console.error("Takvim linki alınamadı:", err);
      Alert.alert("Hata", "Takvim bağlantı linki alınamadı.");
    } finally {
      setCalendarLoading(false);
    }
  };

  // --- ÇIKIŞ YAP ---
  const handleLogout = async () => {
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('refresh_token');
    navigation.replace('Login'); 
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Öğrenci Profili</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        
        {/* PROFİL BAŞLIĞI */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatarPlaceholder}>
            <MaterialIcons name="school" size={48} color={theme.surface} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{userData.username || "Yükleniyor..."}</Text>
            <Text style={styles.userRole}>YKS Adayı</Text>
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

        {/* GOOGLE TAKVİM KARTI */}
        <View style={styles.integrationCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <FontAwesome5 name="google" size={20} color={isCalendarConnected ? theme.primary : theme.text} style={{ marginRight: 12 }} />
            <Text style={styles.integrationText}>Google Takvim</Text>
          </View>
          {isCalendarConnected ? (
            <View style={styles.connectedBadge}>
              <MaterialIcons name="check-circle" size={16} color="#16a34a" />
              <Text style={styles.connectedText}>Bağlı</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.connectBtn} onPress={handleConnectCalendar} disabled={calendarLoading} activeOpacity={0.7}>
              {calendarLoading ? <ActivityIndicator size="small" color={theme.surface} /> : <Text style={styles.connectBtnText}>Bağla</Text>}
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.sectionTitle}>Hesap Ayarları</Text>

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

          <Text style={styles.inputLabel}>Yeni Şifre (Boş bırakılabilir)</Text>
          <TextInput 
            style={styles.input}
            value={userData.password}
            onChangeText={(text) => setUserData({...userData, password: text})}
            placeholder="Yeni şifre belirle..."
            placeholderTextColor={theme.text + '50'}
            secureTextEntry
          />

          <TouchableOpacity style={styles.updateBtn} onPress={handleUpdate} disabled={loading} activeOpacity={0.8}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.updateBtnText}>Bilgilerimi Güncelle</Text>}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Eğitim & Uygulama</Text>

        {/* YÖNLENDİRME MENÜLERİ (ACTIVE OPACITY EKLENDİ) */}
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Schedule')} activeOpacity={0.7}>
          <MaterialIcons name="event-note" size={24} color={theme.text} />
          <Text style={styles.menuText}>Haftalık Programım</Text>
          <MaterialIcons name="chevron-right" size={24} color={theme.text} style={{ opacity: 0.5, marginLeft: 'auto' }} />
        </TouchableOpacity>

        {/* DİKKAT: Rota adı DailyReport olarak güncellendi! */}
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('DailyReport')} activeOpacity={0.7}>
          <MaterialIcons name="bar-chart" size={24} color={theme.text} />
          <Text style={styles.menuText}>Gelişim Raporlarım</Text>
          <MaterialIcons name="chevron-right" size={24} color={theme.text} style={{ opacity: 0.5, marginLeft: 'auto' }} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => setIsDarkMode(!isDarkMode)} activeOpacity={0.7}>
          <MaterialIcons name={isDarkMode ? "dark-mode" : "light-mode"} size={24} color={theme.text} />
          <Text style={styles.menuText}>Tema Görünümü ({isDarkMode ? "Karanlık" : "Aydınlık"})</Text>
          <MaterialIcons name="sync" size={20} color={theme.text} style={{ opacity: 0.5, marginLeft: 'auto' }} />
        </TouchableOpacity>

        {/* ÇIKIŞ YAP */}
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
  
  profileHeaderCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.primary, padding: 20, borderRadius: 16, marginBottom: 20, elevation: 4 },
  avatarPlaceholder: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: theme.surface },
  profileInfo: { marginLeft: 16 },
  userName: { fontSize: 20, fontWeight: 'bold', color: theme.surface, marginBottom: 4 },
  userRole: { fontSize: 14, color: theme.surface, opacity: 0.9 },

  quotaCard: { backgroundColor: theme.surface, padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.border },
  quotaHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  quotaTitle: { fontSize: 16, fontWeight: 'bold', color: theme.text, marginLeft: 8 },
  progressBarBg: { height: 10, backgroundColor: theme.border, borderRadius: 5, overflow: 'hidden', marginBottom: 8 },
  progressBarFill: { height: '100%', borderRadius: 5 },
  quotaText: { fontSize: 13, color: theme.text, opacity: 0.7, textAlign: 'right' },

  integrationCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.surface, padding: 16, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: theme.border },
  integrationText: { fontSize: 16, fontWeight: '600', color: theme.text },
  connectedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#dcfce7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  connectedText: { color: '#16a34a', fontWeight: 'bold', fontSize: 12, marginLeft: 4 },
  connectBtn: { backgroundColor: theme.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  connectBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  sectionTitle: { fontSize: 14, fontWeight: '700', color: theme.text, opacity: 0.5, textTransform: 'uppercase', marginBottom: 12, marginLeft: 4, letterSpacing: 1 },
  
  formContainer: { backgroundColor: theme.surface, padding: 16, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: theme.border },
  inputLabel: { fontSize: 12, color: theme.text, opacity: 0.7, marginBottom: 6, marginLeft: 4 },
  input: { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border, borderRadius: 10, padding: 12, color: theme.text, marginBottom: 16 },
  updateBtn: { backgroundColor: theme.primary, padding: 14, borderRadius: 10, alignItems: 'center' },
  updateBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.border },
  menuText: { fontSize: 15, fontWeight: '600', color: theme.text, marginLeft: 16 },
  
  logoutBtn: { borderColor: '#fecaca', backgroundColor: '#fef2f2', marginTop: 10 }
});