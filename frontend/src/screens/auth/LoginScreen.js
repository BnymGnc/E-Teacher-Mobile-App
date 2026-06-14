import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../api';
import { lightTheme, darkTheme } from '../../theme/colors';

export default function LoginScreen({ navigation, isDarkMode, toggleTheme }) {
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Lütfen e-posta ve şifrenizi eksiksiz girin.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/auth/login/', { 
        username: email, 
        password: password 
      });

      await AsyncStorage.setItem('access_token', response.data.access);
      await AsyncStorage.setItem('refresh_token', response.data.refresh);
      
      navigation.replace('MainApp');
    } catch (err) {
      setError('Giriş başarısız. Lütfen email ve şifrenizi kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        
        {/* TEMA DEĞİŞTİRME BUTONU */}
        <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme} activeOpacity={0.6}>
          <MaterialIcons name={isDarkMode ? "brightness-7" : "brightness-4"} size={28} color={theme.primary} />
        </TouchableOpacity>

        <View style={styles.header}>
          <MaterialIcons name="school" size={60} color={theme.primary} style={{ marginBottom: 10 }} />
          <Text style={[styles.title, { color: theme.primary }]}>E-Teacher</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Hesabınıza giriş yapın</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
            placeholder="E-Posta"
            placeholderTextColor={theme.textSecondary}
            value={email}
            onChangeText={(text) => { setEmail(text); if (error) setError(null); }}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
            placeholder="Şifre"
            placeholderTextColor={theme.textSecondary}
            secureTextEntry
            value={password}
            onChangeText={(text) => { setPassword(text); if (error) setError(null); }}
          />

          {error && (
            <View style={styles.errorBox}>
              <MaterialIcons name="error-outline" size={20} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity style={[styles.loginButton, { backgroundColor: theme.primary }]} onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginButtonText}>Giriş Yap</Text>}
          </TouchableOpacity>
        </View>

        <View style={[styles.infoAlert, { backgroundColor: isDarkMode ? '#0c4a6e' : '#e0f2fe', borderColor: theme.primary + '40' }]}>
          <MaterialIcons name="info-outline" size={24} color={isDarkMode ? '#38bdf8' : '#0284c7'} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.infoTitle, { color: isDarkMode ? '#38bdf8' : '#0284c7' }]}>Bilgilendirme</Text>
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              Projemiz ücretsiz sunucularda barındırıldığı için, ilk girişinizde sistemin uyanması 30-50 saniye sürebilir. Anlayışınız için teşekkürler.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>Hesabın yok mu? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={[styles.registerLink, { color: theme.primary }]}>Kayıt Ol</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, flexGrow: 1, justifyContent: 'center' },
  themeToggle: { alignSelf: 'flex-end', padding: 10, zIndex: 10 },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 36, fontWeight: 'bold' },
  subtitle: { fontSize: 16, marginTop: 8 },
  form: { width: '100%' },
  input: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16, fontSize: 16 },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', padding: 14, borderRadius: 10, marginBottom: 16, borderWidth: 1, borderColor: '#fecaca' },
  errorText: { color: '#ef4444', marginLeft: 10, fontSize: 14, flex: 1, fontWeight: '500' },
  loginButton: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, elevation: 2 },
  loginButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  infoAlert: { flexDirection: 'row', padding: 16, borderRadius: 12, marginTop: 32, borderWidth: 1 },
  infoTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  infoText: { fontSize: 13, lineHeight: 20 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { fontSize: 16 },
  registerLink: { fontSize: 16, fontWeight: 'bold' }
});