import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, TextInput, Alert, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../../api';
import { lightTheme, darkTheme } from '../../theme/colors';

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const HOURS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];
const LESSON_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6', '#eab308', '#ef4444', '#6366f1'];

const createInitialPlan = () => {
  let plan = {};
  DAYS.forEach(day => {
    plan[day] = {};
    HOURS.forEach(hour => {
      plan[day][hour] = { status: 'available', lessonName: '', lessonColor: null };
    });
  });
  return plan;
};

export default function ScheduleScreen({ navigation, isDarkMode }) {
  const theme = isDarkMode ? darkTheme : lightTheme;
  const styles = createStyles(theme, isDarkMode);

  const [weeklyPlan, setWeeklyPlan] = useState(createInitialPlan());
  const [selectedDay, setSelectedDay] = useState('Pazartesi');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const [lessonPool, setLessonPool] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Havuz Yönetimi Modalı
  const [poolManageModalVisible, setPoolManageModalVisible] = useState(false);
  const [newLessonName, setNewLessonName] = useState('');
  const [newLessonHours, setNewLessonHours] = useState('1');

  // Ders Seçim Modalı
  const [lessonModalVisible, setLessonModalVisible] = useState(false);
  const [selectedHourForLesson, setSelectedHourForLesson] = useState(null);
  const [manualLessonInput, setManualLessonInput] = useState('');

  // 1. ÖNCEKİ KAYITLI PROGRAMI YÜKLE
  useEffect(() => {
    const loadSavedSchedule = async () => {
      try {
        const res = await api.get('/schedule/');
        if (res.data && res.data.plan && res.data.pool) {
          setWeeklyPlan(res.data.plan);
          setLessonPool(res.data.pool);
        }
      } catch (err) {
        console.log("Henüz kayıtlı bir program yok.");
      } finally {
        setInitialLoading(false);
      }
    };
    loadSavedSchedule();
  }, []);

  // 2. ÇIKIŞ KORUMASI
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!hasUnsavedChanges) return;
      e.preventDefault();
      Alert.alert(
        'Kaydetmeden Çıkıyorsunuz!',
        'Ders programınızda değişiklikler var. Kaydetmeden çıkmak istediğinize emin misiniz?',
        [
          { text: 'İptal, Kal', style: 'cancel', onPress: () => {} },
          { text: 'Evet, Çık', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
        ]
      );
    });
    return unsubscribe;
  }, [navigation, hasUnsavedChanges]);

  // 3. DERS HAVUZU İŞLEMLERİ
  const handleAddLessonToPool = () => {
    if (newLessonName.trim() === '') {
      Alert.alert('Uyarı', 'Lütfen ders adı girin.');
      return;
    }
    const hours = parseInt(newLessonHours);
    if (isNaN(hours) || hours <= 0) return;

    const nextColor = LESSON_COLORS[lessonPool.length % LESSON_COLORS.length];
    const newLesson = { id: Date.now().toString(), name: newLessonName, hours: hours, color: nextColor };
    
    setLessonPool([...lessonPool, newLesson]);
    setNewLessonName('');
    setNewLessonHours('1');
    setHasUnsavedChanges(true);
  };

  const handleRemoveLessonFromPool = (id) => {
    setLessonPool(lessonPool.filter(lesson => lesson.id !== id));
    setHasUnsavedChanges(true);
  };

  // 4. MÜSAİTLİK DURUMUNU DEĞİŞTİRME
  const toggleAvailability = (hour) => {
    const currentStatus = weeklyPlan[selectedDay][hour].status;
    let nextStatus = 'available';
    if (currentStatus === 'available') nextStatus = 'busy';
    else if (currentStatus === 'busy') nextStatus = 'tentative';
    
    setWeeklyPlan(prev => ({
      ...prev,
      [selectedDay]: { ...prev[selectedDay], [hour]: { ...prev[selectedDay][hour], status: nextStatus } }
    }));
    setHasUnsavedChanges(true);
  };

  // 5. DERS SEÇİMİ
  const openLessonModal = (hour) => {
    if (weeklyPlan[selectedDay][hour].status === 'busy') {
      Alert.alert('Meşgul Saat', 'Bu saat dilimi (Kırmızı) meşgul işaretli. Önce sol taraftan müsaitliği değiştirin.');
      return;
    }
    setSelectedHourForLesson(hour);
    setManualLessonInput(weeklyPlan[selectedDay][hour].lessonName || '');
    setLessonModalVisible(true);
  };

  const assignLessonFromPool = (lesson) => {
    setWeeklyPlan(prev => ({
      ...prev,
      [selectedDay]: { 
        ...prev[selectedDay], 
        [selectedHourForLesson]: { ...prev[selectedDay][selectedHourForLesson], lessonName: lesson.name, lessonColor: lesson.color } 
      }
    }));
    setHasUnsavedChanges(true);
    setLessonModalVisible(false);
  };

  const assignManualLesson = () => {
    if (manualLessonInput.trim() === '') return;
    setWeeklyPlan(prev => ({
      ...prev,
      [selectedDay]: { 
        ...prev[selectedDay], 
        [selectedHourForLesson]: { ...prev[selectedDay][selectedHourForLesson], lessonName: manualLessonInput, lessonColor: theme.primary } 
      }
    }));
    setHasUnsavedChanges(true);
    setLessonModalVisible(false);
  };

  const removeAssignedLesson = () => {
    setWeeklyPlan(prev => ({
      ...prev,
      [selectedDay]: { 
        ...prev[selectedDay], 
        [selectedHourForLesson]: { ...prev[selectedDay][selectedHourForLesson], lessonName: '', lessonColor: null } 
      }
    }));
    setHasUnsavedChanges(true);
    setLessonModalVisible(false);
  };

  // 6. GELİŞMİŞ ALGORİTMA: AI PROGRAM OLUŞTURUCU
  const handleAIGenerate = async () => {
    if (lessonPool.length === 0) {
      Alert.alert('Uyarı', 'Lütfen önce havuz yönetimi panelinden ders ekleyin.');
      return;
    }
    setAiLoading(true);

    const totalRequiredHours = lessonPool.reduce((sum, lesson) => sum + lesson.hours, 0);

    const greenSlots = [];
    const yellowSlots = [];

    // Müsait ve esnek alanları bul
    DAYS.forEach(day => {
      HOURS.forEach(hour => {
        const slot = weeklyPlan[day][hour];
        if (!slot.lessonName) { // Sadece boş olanlara atama yapılacak
          if (slot.status === 'available') greenSlots.push({ day, hour });
          else if (slot.status === 'tentative') yellowSlots.push({ day, hour });
        }
      });
    });

    const totalAvailable = greenSlots.length + yellowSlots.length;

    // KAPASİTE KONTROLÜ
    if (totalRequiredHours > totalAvailable) {
      setAiLoading(false);
      Alert.alert('Kapasite Hatası', `Havuzdaki dersleriniz toplam ${totalRequiredHours} saat. Ancak takvimde sadece ${totalAvailable} saat müsait alan (Yeşil+Sarı) var. Müsaitliği artırın veya ders saatini azaltın.`);
      return;
    }

    let newPlan = JSON.parse(JSON.stringify(weeklyPlan));
    let remainingLessons = JSON.parse(JSON.stringify(lessonPool));

    // Yerleştirme Algoritması
    const findAndPlace = (lesson, hoursToPlace, preferStatus) => {
      let placed = 0;
      while (placed < hoursToPlace) {
         let chunk = (hoursToPlace - placed >= 2) ? 2 : 1;
         let chunkPlaced = false;

         // 2'şerli (Ardışık) atama dene
         if (chunk === 2) {
           for (let d of DAYS) {
             for (let i = 0; i < HOURS.length - 1; i++) {
                let h1 = HOURS[i];
                let h2 = HOURS[i+1];
                if (newPlan[d][h1].status === preferStatus && !newPlan[d][h1].lessonName &&
                    newPlan[d][h2].status === preferStatus && !newPlan[d][h2].lessonName) {
                    
                    newPlan[d][h1].lessonName = lesson.name;
                    newPlan[d][h1].lessonColor = lesson.color;
                    newPlan[d][h2].lessonName = lesson.name;
                    newPlan[d][h2].lessonColor = lesson.color;
                    
                    placed += 2;
                    chunkPlaced = true;
                    break;
                }
             }
             if (chunkPlaced) break;
           }
         }

         // Ardışık bulunamadıysa tekli (1 saatlik) atama yap
         if (!chunkPlaced) {
           for (let d of DAYS) {
             for (let h of HOURS) {
                if (newPlan[d][h].status === preferStatus && !newPlan[d][h].lessonName) {
                    newPlan[d][h].lessonName = lesson.name;
                    newPlan[d][h].lessonColor = lesson.color;
                    placed += 1;
                    chunkPlaced = true;
                    break;
                }
             }
             if (chunkPlaced) break;
           }
         }

         // Eğer bu öncelikte (Yeşil veya Sarı) hiç yerleştirilemezse döngüyü kır, diğerine geç
         if (!chunkPlaced) break; 
      }
      return placed;
    };

    // Tüm havuzdaki dersleri dön
    for (let i = 0; i < remainingLessons.length; i++) {
        let lesson = remainingLessons[i];
        let h = lesson.hours;
        
        // 1. Öncelik: Yeşillere (Müsait) atama
        let placedInGreen = findAndPlace(lesson, h, 'available');
        h -= placedInGreen;
        
        // 2. Öncelik: Kalan ders saati varsa Sarılara (Esnek) atama
        if (h > 0) {
            let placedInYellow = findAndPlace(lesson, h, 'tentative');
            h -= placedInYellow;
        }
    }

    setWeeklyPlan(newPlan);
    setHasUnsavedChanges(true);
    setAiLoading(false);
    Alert.alert('Başarılı', 'Dersleriniz 2\'şer saatlik bloklar öncelikli olmak üzere, önce yeşil (müsait) sonra sarı (esnek) alanlara dağıtıldı!');
  };

  // 7. BACKEND'E KAYIT
  const handleSaveToBackend = async () => {
    setLoading(true);
    try {
      await api.post('/schedule/', { plan: weeklyPlan, pool: lessonPool });
      setHasUnsavedChanges(false);
      Alert.alert('Başarılı', 'Haftalık programınız sisteme kaydedildi.');
    } catch (err) {
      Alert.alert('Hata', 'Kaydedilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    if (status === 'available') return { border: '#10b981', text: 'Müsait', bg: isDarkMode ? '#10b98115' : '#ecfdf5' };
    if (status === 'busy') return { border: '#ef4444', text: 'Meşgul', bg: isDarkMode ? '#ef444415' : '#fef2f2' };
    return { border: '#f59e0b', text: 'Esnek', bg: isDarkMode ? '#f59e0b15' : '#fffbeb' };
  };

  if (initialLoading) {
    return (
      <View style={{flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back-ios" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Akıllı Takvim</Text>
        <TouchableOpacity onPress={handleSaveToBackend} disabled={loading || !hasUnsavedChanges} style={[styles.saveBtn, !hasUnsavedChanges && { opacity: 0.5 }]}>
          {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Kaydet</Text>}
        </TouchableOpacity>
      </View>

      {/* Yatay Ders Havuzu & Yönetim Butonu */}
      <View style={styles.poolStripContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.poolScroll}>
          {lessonPool.length === 0 && (
            <Text style={styles.emptyPoolStripText}>Henüz havuzda ders yok. Sağdaki butondan ekleyin.</Text>
          )}
          {lessonPool.map(lesson => (
            <View key={lesson.id} style={[styles.poolChip, { backgroundColor: lesson.color + '20', borderColor: lesson.color }]}>
              <View style={[styles.colorDot, { backgroundColor: lesson.color }]} />
              <Text style={[styles.poolChipText, { color: isDarkMode ? '#fff' : lesson.color }]}>{lesson.name} ({lesson.hours}s)</Text>
            </View>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.poolManageBtn} onPress={() => setPoolManageModalVisible(true)}>
          <MaterialIcons name="tune" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View style={{ borderBottomWidth: 1, borderColor: theme.border, paddingBottom: 10, marginTop: 10 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysScroll}>
          {DAYS.map((day) => (
            <TouchableOpacity key={day} style={[styles.dayCard, selectedDay === day && styles.dayCardActive]} onPress={() => setSelectedDay(day)}>
              <Text style={[styles.dayText, selectedDay === day && styles.dayTextActive]}>{day.substring(0, 3)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Ana Saat ve Ders Matrisi */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.hoursContainer}>
        <Text style={styles.infoText}>Müsaitliği değiştirmek için saat kutucuğuna, ders seçmek için sağdaki geniş alana dokunun.</Text>
        
        {HOURS.map((hour) => {
          const slot = weeklyPlan[selectedDay][hour];
          const sStyle = getStatusStyle(slot.status);
          
          return (
            <View key={hour} style={styles.hourRow}>
              
              <TouchableOpacity 
                style={[styles.availabilityZone, { borderColor: sStyle.border, backgroundColor: sStyle.bg }]} 
                onPress={() => toggleAvailability(hour)} 
                activeOpacity={0.7}
              >
                <Text style={styles.hourText}>{hour}</Text>
                <Text style={[styles.statusText, { color: sStyle.border }]}>{sStyle.text}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.lessonZone, 
                  slot.lessonName 
                    ? { backgroundColor: slot.lessonColor + '15', borderColor: slot.lessonColor } 
                    : { backgroundColor: theme.surface, borderColor: theme.border }
                ]} 
                onPress={() => openLessonModal(hour)} 
                activeOpacity={0.7}
              >
                {slot.lessonName ? (
                  <View style={styles.filledLesson}>
                    <View style={[styles.colorDot, { backgroundColor: slot.lessonColor, width: 12, height: 12, borderRadius: 6 }]} />
                    <Text style={[styles.lessonText, { color: isDarkMode ? '#fff' : slot.lessonColor }]}>{slot.lessonName}</Text>
                  </View>
                ) : (
                  <Text style={styles.emptyLessonText}>
                    {slot.status === 'busy' ? 'Bu saat meşgul.' : '+ Ders seçmek için dokun'}
                  </Text>
                )}
              </TouchableOpacity>

            </View>
          );
        })}
      </ScrollView>

      {/* Genişletilmiş AI Butonu */}
      <TouchableOpacity style={[styles.fabExtended, lessonPool.length === 0 && { opacity: 0.6 }]} onPress={handleAIGenerate} disabled={aiLoading || lessonPool.length === 0}>
        {aiLoading ? (
          <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
        ) : (
          <MaterialIcons name="auto-awesome" size={22} color="#fff" style={{ marginRight: 8 }} />
        )}
        <Text style={styles.fabText}>Program Oluştur</Text>
      </TouchableOpacity>

      {/* MODAL 1: Havuz Yönetimi Modalı */}
      <Modal animationType="slide" transparent={true} visible={poolManageModalVisible} onRequestClose={() => setPoolManageModalVisible(false)}>
        <View style={styles.bottomSheetOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.bottomSheetContent}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>Ders Havuzu Yönetimi</Text>
            <Text style={styles.modalSubTitle}>Haftalık çalışmak istediğiniz dersleri ve saat hedeflerini buradan ekleyip çıkarabilirsiniz.</Text>
            
            <ScrollView style={styles.managePoolList} showsVerticalScrollIndicator={false}>
              {lessonPool.length > 0 ? lessonPool.map(lesson => (
                <View key={lesson.id} style={[styles.managePoolItem, { borderColor: lesson.color }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={[styles.colorDot, { backgroundColor: lesson.color, marginRight: 10 }]} />
                    <Text style={[styles.managePoolItemText, { color: isDarkMode ? '#fff' : lesson.color }]}>{lesson.name} <Text style={{fontWeight:'normal'}}>({lesson.hours} Saat)</Text></Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveLessonFromPool(lesson.id)} style={{ padding: 6 }}>
                    <MaterialIcons name="delete-outline" size={22} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              )) : (
                <Text style={styles.emptyPoolText}>Havuz boş. Aşağıdan yeni ders ekleyin.</Text>
              )}
            </ScrollView>

            <Text style={styles.sectionHeader}>Yeni Ders Ekle</Text>
            <View style={styles.manualInputRow}>
              <TextInput style={[styles.manualInput, { flex: 2 }]} placeholder="Ders Adı (Örn: Fizik)" placeholderTextColor={theme.textSecondary} value={newLessonName} onChangeText={setNewLessonName} />
              <TextInput style={[styles.manualInput, { flex: 1, marginHorizontal: 8 }]} placeholder="Saat" keyboardType="numeric" placeholderTextColor={theme.textSecondary} value={newLessonHours} onChangeText={setNewLessonHours} />
              <TouchableOpacity style={styles.manualBtn} onPress={handleAddLessonToPool}>
                <Text style={styles.manualBtnText}>Ekle</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setPoolManageModalVisible(false)}>
              <Text style={styles.closeModalBtnText}>Tamamlandı</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* MODAL 2: Ders Seçim Paneli */}
      <Modal animationType="slide" transparent={true} visible={lessonModalVisible} onRequestClose={() => setLessonModalVisible(false)}>
        <View style={styles.bottomSheetOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.bottomSheetContent}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>{selectedDay} - Saat {selectedHourForLesson}</Text>
            <Text style={styles.modalSubTitle}>Bu saate yerleştireceğiniz dersi havuzdan seçin veya manuel yazın.</Text>
            
            <Text style={styles.sectionHeader}>Havuzdaki Dersler</Text>
            <ScrollView style={styles.sheetPoolList} showsVerticalScrollIndicator={false}>
              {lessonPool.length > 0 ? lessonPool.map(lesson => (
                <TouchableOpacity key={lesson.id} style={[styles.sheetPoolItem, { borderColor: lesson.color, backgroundColor: lesson.color + '15' }]} onPress={() => assignLessonFromPool(lesson)}>
                  <View style={[styles.colorDot, { backgroundColor: lesson.color, width: 12, height: 12, borderRadius: 6 }]} />
                  <Text style={[styles.sheetPoolItemText, { color: isDarkMode ? '#fff' : lesson.color }]}>{lesson.name} ({lesson.hours} Saat)</Text>
                  <MaterialIcons name="check-circle-outline" size={20} color={lesson.color} />
                </TouchableOpacity>
              )) : (
                <Text style={styles.emptyPoolText}>Havuzda hiç ders yok. Önce yönetim panelinden ekleyin.</Text>
              )}
            </ScrollView>

            <Text style={styles.sectionHeader}>Veya Manuel Girin</Text>
            <View style={styles.manualInputRow}>
              <TextInput style={[styles.manualInput, {marginRight: 8}]} placeholder="Örn: Deneme Çözümü" placeholderTextColor={theme.textSecondary} value={manualLessonInput} onChangeText={setManualLessonInput} />
              <TouchableOpacity style={styles.manualBtn} onPress={assignManualLesson}>
                <Text style={styles.manualBtnText}>Ekle</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.modalButtons, { marginTop: 20 }]}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setLessonModalVisible(false)}>
                <Text style={styles.modalBtnCancelText}>Kapat</Text>
              </TouchableOpacity>
              {weeklyPlan[selectedDay][selectedHourForLesson]?.lessonName !== '' && (
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#ef4444' }]} onPress={removeAssignedLesson}>
                  <Text style={styles.modalBtnSaveText}>Dersi Sil</Text>
                </TouchableOpacity>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const createStyles = (theme, isDarkMode) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.background },
  appBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, height: Platform.OS === 'android' ? 76 : 64, paddingTop: Platform.OS === 'android' ? 24 : 0, backgroundColor: theme.surface, borderBottomWidth: 1, borderColor: theme.border },
  backBtn: { width: 40, height: 44, justifyContent: 'center' },
  appBarTitle: { fontSize: 17, fontWeight: 'bold', color: theme.text },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: theme.primary },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },

  poolStripContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, borderBottomWidth: 1, borderColor: theme.border },
  poolScroll: { paddingHorizontal: 16, paddingVertical: 12, gap: 10, alignItems: 'center' },
  emptyPoolStripText: { fontSize: 13, color: theme.textSecondary, fontStyle: 'italic', alignSelf: 'center' },
  poolChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, gap: 6 },
  poolChipText: { fontSize: 13, fontWeight: 'bold' },
  poolManageBtn: { padding: 16, borderLeftWidth: 1, borderColor: theme.border, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background },

  daysScroll: { paddingHorizontal: 16, gap: 10 },
  dayCard: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  dayCardActive: { backgroundColor: theme.text, borderColor: theme.text },
  dayText: { fontSize: 14, fontWeight: 'bold', color: theme.textSecondary },
  dayTextActive: { color: theme.background },

  infoText: { fontSize: 12, color: theme.textSecondary, textAlign: 'center', marginBottom: 12, paddingHorizontal: 10 },

  hoursContainer: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 100, gap: 12 },
  hourRow: { flexDirection: 'row', alignItems: 'stretch', gap: 10 },
  
  availabilityZone: { width: 80, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderRadius: 14, paddingVertical: 12 },
  hourText: { fontSize: 16, fontWeight: '900', color: theme.text, marginBottom: 2 },
  statusText: { fontSize: 11, fontWeight: 'bold' },

  lessonZone: { flex: 1, borderRadius: 14, borderWidth: 1.5, justifyContent: 'center', paddingHorizontal: 16, minHeight: 65 },
  filledLesson: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  colorDot: { width: 10, height: 10, borderRadius: 5 },
  lessonText: { fontSize: 15, fontWeight: 'bold', flex: 1 },
  emptyLessonText: { fontSize: 13, color: theme.textSecondary, fontStyle: 'italic' },

  fabExtended: { position: 'absolute', bottom: 24, right: 24, flexDirection: 'row', backgroundColor: theme.primary, paddingHorizontal: 20, height: 56, borderRadius: 28, alignItems: 'center', elevation: 6, shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 6 },
  fabText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  bottomSheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheetContent: { backgroundColor: theme.surface, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, maxHeight: '90%' },
  sheetHandle: { width: 40, height: 5, backgroundColor: theme.border, borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 6 },
  modalSubTitle: { fontSize: 14, color: theme.textSecondary, marginBottom: 16, lineHeight: 20 },
  sectionHeader: { fontSize: 14, fontWeight: 'bold', color: theme.textSecondary, marginTop: 10, marginBottom: 8 },
  
  managePoolList: { maxHeight: 180, marginBottom: 16 },
  managePoolItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8, backgroundColor: theme.background },
  managePoolItemText: { fontSize: 15, fontWeight: 'bold' },
  
  sheetPoolList: { maxHeight: 180, marginBottom: 16 },
  sheetPoolItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  sheetPoolItemText: { flex: 1, fontSize: 15, fontWeight: 'bold', marginLeft: 10 },
  
  emptyPoolText: { fontSize: 13, color: theme.textSecondary, fontStyle: 'italic', paddingVertical: 10 },

  manualInputRow: { flexDirection: 'row', alignItems: 'center' },
  manualInput: { flex: 1, backgroundColor: theme.background, color: theme.text, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: theme.border, fontSize: 15 },
  // YENİ EKLE BUTONU STİLLERİ
  manualBtn: { backgroundColor: theme.primary, paddingHorizontal: 16, height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  manualBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  closeModalBtn: { backgroundColor: theme.primary, paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 24 },
  closeModalBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  modalButtons: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, paddingVertical: 16, alignItems: 'center', borderRadius: 14 },
  modalBtnCancel: { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border },
  modalBtnCancelText: { color: theme.textSecondary, fontWeight: 'bold' },
  modalBtnSave: { backgroundColor: theme.primary },
  modalBtnSaveText: { color: '#fff', fontWeight: 'bold' }
});