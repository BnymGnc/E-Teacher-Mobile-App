import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { lightTheme, darkTheme } from '../../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen({ navigation, isDarkMode, setIsDarkMode }) {
  const theme = isDarkMode ? darkTheme : lightTheme;
  const styles = createStyles(theme);

  // Örnek Kota State'i (Bunu ileride Backend'den çekeceksin)
  const [quota, setQuota] = useState({ used: 12, total: 50 });

  const handleLogout = async () => {
    // Çıkış yaparken token'ı temizle ve Auth (Login) ekranına yönlendir
    await AsyncStorage.removeItem('access_token');
    navigation.replace('Login'); 
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Öğrenci Kontrol Merkezi</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* ÜST BİLGİ KARTI */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatarPlaceholder}>
            <MaterialIcons name="school" size={48} color={theme.surface} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>Öğrenci Profili</Text>
            <Text style={styles.userRole}>YKS Adayı</Text>
          </View>
        </View>

        {/* KOTA VE İSTATİSTİK KARTI */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <MaterialIcons name="auto-awesome" size={28} color={theme.primary} />
            <Text style={styles.statValue}>{quota.used} / {quota.total}</Text>
            <Text style={styles.statLabel}>AI Soru Kotası</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <MaterialIcons name="local-fire-department" size={28} color="#f97316" />
            <Text style={styles.statValue}>3 Gün</Text>
            <Text style={styles.statLabel}>Çalışma Serisi</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Eğitim & Planlama</Text>

        {/* HAFTALIK PROGRAM BUTONU */}
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Schedule')}>
          <View style={[styles.iconContainer, { backgroundColor: '#e0e7ff' }]}>
            <MaterialIcons name="event-note" size={24} color="#4f46e5" />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>Haftalık Programım</Text>
            <Text style={styles.menuSubtitle}>Kaydedilen çalışma takvimini gör</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={theme.text} style={{ opacity: 0.5 }} />
        </TouchableOpacity>

        {/* GEÇMİŞ RAPORLAR BUTONU */}
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Reports')}>
          <View style={[styles.iconContainer, { backgroundColor: '#dcfce7' }]}>
            <MaterialIcons name="bar-chart" size={24} color="#16a34a" />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>Gelişim Raporlarım</Text>
            <Text style={styles.menuSubtitle}>Günlük çalışma ve çözülen sorular</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={theme.text} style={{ opacity: 0.5 }} />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Uygulama Ayarları</Text>

        {/* TEMA DEĞİŞTİRME BUTONU */}
        <TouchableOpacity style={styles.menuItem} onPress={() => setIsDarkMode(!isDarkMode)}>
          <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#374151' : '#fef08a' }]}>
            <MaterialIcons name={isDarkMode ? "dark-mode" : "light-mode"} size={24} color={isDarkMode ? "#f9fafb" : "#ca8a04"} />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>Tema Görünümü</Text>
            <Text style={styles.menuSubtitle}>{isDarkMode ? "Karanlık Mod Aktif" : "Aydınlık Mod Aktif"}</Text>
          </View>
          <MaterialIcons name="sync" size={20} color={theme.text} style={{ opacity: 0.5 }} />
        </TouchableOpacity>

        {/* ÇIKIŞ YAP BUTONU */}
        <TouchableOpacity style={[styles.menuItem, styles.logoutBtn]} onPress={handleLogout}>
          <View style={[styles.iconContainer, { backgroundColor: '#fee2e2' }]}>
            <MaterialIcons name="logout" size={24} color="#ef4444" />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={[styles.menuTitle, { color: '#ef4444' }]}>Hesaptan Çıkış Yap</Text>
          </View>
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
  
  profileHeaderCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.primary, padding: 20, borderRadius: 16, marginBottom: 20, elevation: 4, shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  avatarPlaceholder: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: theme.surface },
  profileInfo: { marginLeft: 16 },
  userName: { fontSize: 22, fontWeight: 'bold', color: theme.surface, marginBottom: 4 },
  userRole: { fontSize: 14, color: theme.surface, opacity: 0.9 },

  statsContainer: { flexDirection: 'row', backgroundColor: theme.surface, borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: theme.border, elevation: 2 },
  statBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statDivider: { width: 1, backgroundColor: theme.border, marginHorizontal: 10 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: theme.text, marginTop: 8 },
  statLabel: { fontSize: 12, color: theme.text, opacity: 0.6, marginTop: 4 },

  sectionTitle: { fontSize: 14, fontWeight: '700', color: theme.text, opacity: 0.5, textTransform: 'uppercase', marginBottom: 12, marginLeft: 4, letterSpacing: 1 },
  
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.border },
  iconContainer: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  menuTextContainer: { flex: 1, marginLeft: 16 },
  menuTitle: { fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 2 },
  menuSubtitle: { fontSize: 12, color: theme.text, opacity: 0.6 },
  
  logoutBtn: { borderColor: '#fecaca', backgroundColor: '#fef2f2', marginTop: 10 }
});