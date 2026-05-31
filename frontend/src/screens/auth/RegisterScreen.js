import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../../api';
import { lightTheme, darkTheme } from '../../theme/colors';

export default function RegisterScreen({ navigation, isDarkMode, toggleTheme }) {
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRegister = async () => {
    if (!email || !password) {
      setError('Lütfen tüm alanları doldurun.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Views.py dosyan email bekliyor
      const response = await api.post('/auth/register/', { 
        email: email, 
        password: password 
      });
      
      Alert.alert('Başarılı', response.data.message || 'Kayıt başarılı! Giriş yapabilirsiniz.', [
        { text: 'Tamam', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (err) {
      // Backend'den gelen gerçek hatayı gösteriyoruz (Örn: "Bu email zaten kayıtlı")
      const errMsg = err.response?.data?.error || 'Kayıt sırasında bir hata oluştu.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
            placeholder="Şifre"
            placeholderTextColor={theme.textSecondary}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error && (
            <View style={styles.errorBox}>
              <MaterialIcons name="error-outline" size={20} color="#d32f2f" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Hesap Oluştur</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>Zaten hesabınız var mı? </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
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
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffebee', padding: 14, borderRadius: 10, marginBottom: 16 },
  errorText: { color: '#d32f2f', marginLeft: 10, fontSize: 14, flex: 1 },
  button: { padding: 18, borderRadius: 14, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { fontSize: 16 },
  link: { fontSize: 16, fontWeight: 'bold' }
});