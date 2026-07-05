import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, SafeAreaView, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { lightTheme, darkTheme } from '../../theme/colors';

export default function DashboardScreen({ navigation, isDarkMode, setIsDarkMode }) {
  const { width } = useWindowDimensions();
  // Seçili temayı dinamik olarak belirliyoruz
  const theme = isDarkMode ? darkTheme : lightTheme;
  const styles = createStyles(theme, isDarkMode, width);

  // Web Dashboard verilerinin navigasyon rotalarıyla zenginleştirilmiş hali
  const quickLinks = [
    { title: 'Hedef Netler', desc: 'YÖK Atlas verileri', icon: 'outlined-flag', color: '#4caf50', route: 'TargetNets' },
    { title: 'Deneme Analizi', desc: 'Yapay zeka analizi', icon: 'analytics', color: '#2196f3', route: 'ExamAnalysis' },
    { title: 'Quiz Üret', desc: 'Eksik konulara test', icon: 'assignment', color: '#9c27b0', route: 'QuizGenerate' },
    { title: 'Belge Özeti', desc: 'Notları özetlet', icon: 'article', color: '#ff9800', route: 'Summarize' },
    { title: 'AI Destek', desc: 'Rehberinle konuş', icon: 'psychology', color: '#e91e63', route: 'AIChat' },
    { title: 'Günlük Rapor', desc: 'Verimliliğini kaydet', icon: 'timeline', color: '#00bcd4', route: 'DailyReport' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Üst Karşılama Alanı */}
        <View style={styles.header}>
          <View style={styles.headerTextArea}>
            <Text style={styles.greeting}>Hoş Geldin! 👋</Text>
            <Text style={styles.subText} numberOfLines={2}>Çalışmalarını takip et ve hedeflerine ulaş.</Text>
          </View>
          <View style={styles.headerRight}>
            {/* Tema Değiştirme Butonu (Güneş / Ay) - DÜZELTİLDİ */}
            <TouchableOpacity style={styles.themeBtn} onPress={() => setIsDarkMode(!isDarkMode)} activeOpacity={0.7}>
              <MaterialIcons name={isDarkMode ? "wb-sunny" : "nights-stay"} size={24} color={theme.primary} />
            </TouchableOpacity>
            
            {/* Profil Butonu */}
            <TouchableOpacity
              style={styles.profileBtn}
              activeOpacity={0.7}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Profil ekranını aç"
              onPress={() => navigation.navigate('Profil')}
            >
              <MaterialIcons name="person" size={28} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Büyük Ders Programı Banner'ı */}
        <TouchableOpacity 
          style={styles.bannerCard} 
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Schedule')}
        >
          <View style={styles.bannerIconBox}>
            <MaterialIcons name="calendar-month" size={36} color={theme.primary} />
          </View>
          <View style={styles.bannerTextBox}>
            <Text style={styles.bannerTitle}>Ders Programı Oluşturucu</Text>
            <Text style={styles.bannerDesc}>Yapay zeka destekli haftalık çalışma planını hazırla.</Text>
          </View>
          <MaterialIcons name="arrow-forward-ios" size={18} color={theme.primary} />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Hızlı Erişim</Text>

        {/* Grid Kartları */}
        <View style={styles.gridContainer}>
          {quickLinks.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.gridCard} 
              activeOpacity={0.7}
              onPress={() => item.route && navigation.navigate(item.route)}
            >
              <View style={[styles.iconWrapper, { backgroundColor: item.color + '18' }]}>
                <MaterialIcons name={item.icon} size={32} color={item.color} />
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDesc} numberOfLines={2}>{item.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Durum Footer Bilgisi */}
        <View style={styles.footerStatus}>
          <MaterialIcons name="cloud-done" size={16} color={isDarkMode ? '#34d399' : '#10b981'} />
          <Text style={styles.footerStatusText}>Render Canlı Bağlantısı Aktif</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme, isDarkMode, screenWidth) => {
  const isCompact = screenWidth < 360;
  const cardWidth = isCompact ? screenWidth - 32 : (screenWidth - 56) / 2;

  return StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.background },
  container: { flex: 1, backgroundColor: theme.background },
  scrollContent: { paddingHorizontal: isCompact ? 16 : 20, paddingTop: 20, paddingBottom: 40 },
  
  header: { flexDirection: 'row', alignItems: 'center', marginTop: Platform.OS === 'android' ? 20 : 10, marginBottom: 25 },
  headerTextArea: { flex: 1, minWidth: 0, paddingRight: 12 },
  greeting: { fontSize: isCompact ? 22 : 26, fontWeight: 'bold', color: theme.text },
  subText: { fontSize: 14, color: theme.textSecondary, marginTop: 4 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: isCompact ? 8 : 12, flexShrink: 0 },
  
  themeBtn: { backgroundColor: theme.surface, width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.border, elevation: 1 },
  profileBtn: { backgroundColor: theme.primary, width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center', elevation: 3, shadowColor: theme.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  
  bannerCard: { flexDirection: 'row', backgroundColor: theme.surface, padding: 20, borderRadius: 18, alignItems: 'center', marginBottom: 28, borderWidth: 1, borderColor: theme.border, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDarkMode ? 0.3 : 0.05, shadowRadius: 6 },
  bannerIconBox: { backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9', padding: 12, borderRadius: 14, marginRight: 16, borderWidth: 1, borderColor: theme.border },
  bannerTextBox: { flex: 1 },
  bannerTitle: { fontSize: 17, fontWeight: 'bold', color: theme.text, marginBottom: 4 },
  bannerDesc: { fontSize: 13, color: theme.textSecondary, lineHeight: 18 },
  
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: theme.text, marginBottom: 16, paddingLeft: 2 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 },
  
  gridCard: { 
    width: cardWidth, 
    backgroundColor: theme.surface, 
    padding: isCompact ? 16 : 20,
    borderRadius: 20, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: theme.border, 
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDarkMode ? 0.4 : 0.04,
    shadowRadius: 4
  },
  iconWrapper: { width: 60, height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: theme.text, textAlign: 'center', marginBottom: 6 },
  cardDesc: { fontSize: 12, color: theme.textSecondary, textAlign: 'center', lineHeight: 16 },
  
  footerStatus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 30, opacity: 0.6 },
  footerStatusText: { fontSize: 12, color: theme.textSecondary, fontWeight: '500' }
  });
};
