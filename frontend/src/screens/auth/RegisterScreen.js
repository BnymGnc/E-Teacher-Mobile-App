import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../../api';
import { lightTheme, darkTheme } from '../../theme/colors';

export default function RegisterScreen({ navigation, isDarkMode, toggleTheme }) {
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null); // Başarı mesajı için yeni state

  const handleRegister = async () => {
    if (!email || !password) {
      setError('Lütfen tüm alanları doldurun.');
      setSuccess(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Backend'e kayıt isteği
      await api.post('/auth/register/', { 
        email: email, 
        password: password 
      });
      
      // Ekranda şık bir başarı mesajı gösteriyoruz
      setSuccess('Hesabınız başarıyla oluşturuldu! Giriş sayfasına yönlendiriliyorsunuz...');
      
      // 2.5 saniye sonra otomatik olarak Login sayfasına atar
      setTimeout(() => {
        navigation.navigate('Login');
      }, 2500);

    } catch (err) {
      const errMsg = err.response?.data?.error || 'Kayıt sırasında bir hata oluştu. E-posta kullanımda olabilir.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
          <MaterialIcons name={isDarkMode ? "brightness-7" : "brightness-4"} size={28} color={theme.primary} />
        </TouchableOpacity>

        <View style={styles.header}>
          <MaterialIcons name="person-add" size={80} color={theme.primary} />
          <Text style={[styles.title, { color: theme.primary }]}>Kayıt Ol</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>E-Teacher Ailesine Katılın</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
            placeholder="E-Posta"
            placeholderTextColor={theme.textSecondary}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (error) setError(null);
            }}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
            placeholder="Şifre"
            placeholderTextColor={theme.textSecondary}
            secureTextEntry
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (error) setError(null);
            }}
          />

          {error && (
            <View style={styles.errorBox}>
              <MaterialIcons name="error-outline" size={20} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleRegister} disabled={loading || success}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Hesap Oluştur</Text>}
          </TouchableOpacity>

          {/* BAŞARI MESAJI KUTUSU BURADA ÇIKACAK */}
          {success && (
            <View style={styles.successBox}>
              <MaterialIcons name="check-circle-outline" size={24} color="#10b981" />
              <Text style={styles.successText}>{success}</Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>Zaten hesabınız var mı? </Text>
          <TouchableOpacity onPress={() => navigation.goBack()} disabled={success}>
            <Text style={[styles.link, { color: theme.primary }]}>Giriş Yap</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, flexGrow: 1, justifyContent: 'center' },
  themeToggle: { alignSelf: 'flex-end', padding: 10 },
  header: { alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 36, fontWeight: 'bold', marginTop: 10 },
  subtitle: { fontSize: 16, marginTop: 4 },
  form: { width: '100%' },
  input: { padding: 18, borderRadius: 14, borderWidth: 1, marginBottom: 16, fontSize: 16 },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', padding: 14, borderRadius: 10, marginBottom: 16, borderWidth: 1, borderColor: '#fecaca' },
  errorText: { color: '#ef4444', marginLeft: 10, fontSize: 14, flex: 1, fontWeight: '500' },
  successBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ecfdf5', padding: 16, borderRadius: 10, marginTop: 16, borderWidth: 1, borderColor: '#a7f3d0' },
  successText: { color: '#059669', marginLeft: 10, fontSize: 14, flex: 1, fontWeight: '600', lineHeight: 20 },
  button: { padding: 18, borderRadius: 14, alignItems: 'center', marginTop: 10, elevation: 3 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { fontSize: 16 },
  link: { fontSize: 16, fontWeight: 'bold' }
});