import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { lightTheme, darkTheme } from '../../theme/colors';

export default function ProfileScreen({ navigation, isDarkMode, setIsDarkMode }) {
  const theme = isDarkMode ? darkTheme : lightTheme;
  const styles = createStyles(theme);

  const handleLogout = () => {
    // Çıkış yapınca Auth (Login) ekranına yönlendir
    navigation.replace('Login'); 
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profilim</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.avatarPlaceholder}>
          <MaterialIcons name="person" size={64} color={theme.primary} />
        </View>
        <Text style={styles.userName}>Öğrenci Profili</Text>

        <TouchableOpacity style={styles.menuItem} onPress={() => setIsDarkMode(!isDarkMode)}>
          <MaterialIcons name={isDarkMode ? "light-mode" : "dark-mode"} size={24} color={theme.text} />
          <Text style={styles.menuText}>{isDarkMode ? "Aydınlık Moda Geç" : "Karanlık Moda Geç"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('TargetNets')}>
          <MaterialIcons name="track-changes" size={24} color={theme.text} />
          <Text style={styles.menuText}>Hedef Netlerim</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, styles.logoutBtn]} onPress={handleLogout}>
          <MaterialIcons name="logout" size={24} color="#ef4444" />
          <Text style={[styles.menuText, { color: '#ef4444' }]}>Çıkış Yap</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.background },
  header: { padding: 20, alignItems: 'center', borderBottomWidth: 1, borderColor: theme.border },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: theme.text },
  content: { padding: 20, alignItems: 'center' },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: theme.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: theme.primary, marginBottom: 16 },
  userName: { fontSize: 22, fontWeight: 'bold', color: theme.text, marginBottom: 30 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, width: '100%', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: theme.border },
  menuText: { fontSize: 16, fontWeight: '600', color: theme.text, marginLeft: 16 },
  logoutBtn: { borderColor: '#fecaca', backgroundColor: '#fef2f2' }
});