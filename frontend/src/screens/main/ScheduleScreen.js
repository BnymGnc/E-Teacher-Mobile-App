import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, TextInput, Alert, Modal, Pressable, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../api';
import { lightTheme, darkTheme } from '../../theme/colors';

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const HOURS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];
const HOUR_PRIORITY = ['12:00', '13:00', '14:00', '15:00', '16:00', '09:00', '10:00', '11:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];
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

const parseScheduleRow = (item, index = 0) => {
  const rawDay = item?.day || item?.date || '';
  const dayAndHour = String(rawDay).match(/^(.*?)\s*\((\d{1,2}:\d{2})\)\s*$/);

  return {
    day: dayAndHour?.[1] || rawDay || DAYS[index % DAYS.length],
    hour: item?.hour || item?.time || dayAndHour?.[2] || '',
    lesson: item?.lesson || item?.title || item?.subject || '',
    lessonColor: item?.lessonColor || item?.color || null,
  };
};

const restoreScheduleState = (savedPlan, savedPool, savedRows = []) => {
  const plan = createInitialPlan();

  if (savedPlan && typeof savedPlan === 'object' && !Array.isArray(savedPlan)) {
    DAYS.forEach((day) => {
      HOURS.forEach((hour) => {
        const savedSlot = savedPlan?.[day]?.[hour];
        if (savedSlot && typeof savedSlot === 'object') {
          plan[day][hour] = { ...plan[day][hour], ...savedSlot };
        }
      });
    });
  }

  const parsedRows = Array.isArray(savedRows)
    ? savedRows.map(parseScheduleRow).filter((row) => row.lesson)
    : [];

  const poolByName = new Map();
  if (Array.isArray(savedPool)) {
    savedPool.forEach((lesson, index) => {
      if (!lesson?.name) return;
      poolByName.set(lesson.name, {
        ...lesson,
        id: lesson.id || `saved-${index}-${lesson.name}`,
        color: lesson.color || LESSON_COLORS[index % LESSON_COLORS.length],
      });
    });
  }

  parsedRows.forEach((row) => {
    if (!DAYS.includes(row.day) || !HOURS.includes(row.hour)) return;

    if (!poolByName.has(row.lesson)) {
      const color = row.lessonColor || LESSON_COLORS[poolByName.size % LESSON_COLORS.length];
      poolByName.set(row.lesson, {
        id: `restored-${poolByName.size}-${row.lesson}`,
        name: row.lesson,
        hours: 0,
        color,
      });
    }

    const lesson = poolByName.get(row.lesson);
    if (String(lesson.id).startsWith('restored-')) {
      lesson.hours = (Number(lesson.hours) || 0) + 1;
    } else {
      lesson.hours = Math.max(Number(lesson.hours) || 0, 1);
    }
    plan[row.day][row.hour] = {
      ...plan[row.day][row.hour],
      lessonName: row.lesson,
      lessonColor: row.lessonColor || lesson.color,
    };
  });

  return { plan, pool: Array.from(poolByName.values()) };
};

const getAssignedLessonCounts = (plan) => {
  const counts = {};

  DAYS.forEach((day) => {
    HOURS.forEach((hour) => {
      const lessonName = plan?.[day]?.[hour]?.lessonName;
      if (lessonName) counts[lessonName] = (counts[lessonName] || 0) + 1;
    });
  });

  return counts;
};

const findContiguousSlotRuns = (slots) => {
  const orderedSlots = [...slots].sort((first, second) => first.hourIndex - second.hourIndex);
  const runs = [];

  orderedSlots.forEach((slot) => {
    const currentRun = runs[runs.length - 1];
    const previousSlot = currentRun?.[currentRun.length - 1];

    if (!previousSlot || slot.hourIndex !== previousSlot.hourIndex + 1) runs.push([slot]);
    else currentRun.push(slot);
  });

  return runs;
};

const takeDynamicChunk = (slots, maximumSize, occupiedHourIndexes = new Set(), enforceBreaks = false) => {
  if (slots.length === 0 || maximumSize <= 0) return [];

  const priorityByHour = Object.fromEntries(HOUR_PRIORITY.map((hour, index) => [hour, index]));
  const candidates = [];

  findContiguousSlotRuns(slots).forEach((run) => {
    const largestChunkSize = Math.min(3, maximumSize, run.length);

    for (let chunkSize = largestChunkSize; chunkSize >= 1; chunkSize -= 1) {
      for (let startIndex = 0; startIndex <= run.length - chunkSize; startIndex += 1) {
        const chunk = run.slice(startIndex, startIndex + chunkSize);
        const firstHourIndex = chunk[0].hourIndex;
        const lastHourIndex = chunk[chunk.length - 1].hourIndex;

        if (
          enforceBreaks
          && (occupiedHourIndexes.has(firstHourIndex - 1) || occupiedHourIndexes.has(lastHourIndex + 1))
        ) continue;

        candidates.push({
          chunk,
          priorityScore: chunk.reduce(
            (sum, slot) => sum + (priorityByHour[slot.hour] ?? HOUR_PRIORITY.length),
            0
          ) / chunk.length,
        });
      }
    }
  });

  candidates.sort((first, second) => (
    second.chunk.length - first.chunk.length
    || first.priorityScore - second.priorityScore
    || first.chunk[0].hourIndex - second.chunk[0].hourIndex
  ));

  return candidates[0]?.chunk || [];
};

const placeLessonPhase = ({
  phaseSlots,
  lessonStates,
  plan,
  placedByLessonAndDay,
  lessonCursorRef,
  occupiedHourIndexesByDay,
  useSmartBreaks,
  breakRuleRelaxedRef,
}) => {
  const remainingSlots = Object.fromEntries(
    DAYS.map((day) => [day, [...phaseSlots[day]]])
  );
  const phaseCapacity = DAYS.reduce((sum, day) => sum + remainingSlots[day].length, 0);
  const maximumIterations = phaseCapacity + lessonStates.length + 1;
  let placedHours = 0;

  for (let iteration = 0; iteration < maximumIterations; iteration += 1) {
    const availableDays = DAYS.filter((day) => remainingSlots[day].length > 0);
    if (availableDays.length === 0 || !lessonStates.some((state) => state.remaining > 0)) break;

    let state = null;
    for (let offset = 0; offset < lessonStates.length; offset += 1) {
      const stateIndex = (lessonCursorRef.value + offset) % lessonStates.length;
      const candidate = lessonStates[stateIndex];
      if (candidate.remaining > 0) {
        state = candidate;
        lessonCursorRef.value = (stateIndex + 1) % lessonStates.length;
        break;
      }
    }
    if (!state) break;

    const cappedDays = availableDays.filter(
      (day) => placedByLessonAndDay[state.lesson.name][day] < 3
    );
    const isDailyCapRelaxed = cappedDays.length === 0;
    const candidateDays = isDailyCapRelaxed ? availableDays : cappedDays;

    // Her chunk'tan sonra güncel kapasiteler yeniden karşılaştırılır.
    const orderedCandidateDays = [...candidateDays].sort((first, second) => (
      remainingSlots[second].length - remainingSlots[first].length
      || DAYS.indexOf(first) - DAYS.indexOf(second)
    ));

    let selectedDay = null;
    let chunk = [];

    for (const day of orderedCandidateDays) {
      const dailyAllowance = isDailyCapRelaxed
        ? state.remaining
        : 3 - placedByLessonAndDay[state.lesson.name][day];
      const maximumChunkSize = Math.min(state.remaining, dailyAllowance, 3);
      const candidateChunk = takeDynamicChunk(
        remainingSlots[day],
        maximumChunkSize,
        occupiedHourIndexesByDay[day],
        useSmartBreaks
      );

      if (candidateChunk.length > 0) {
        selectedDay = day;
        chunk = candidateChunk;
        break;
      }
    }

    // Mola kuralı sayısal kapasiteye rağmen yerleşimi engellerse otomatik esnetilir.
    if (chunk.length === 0 && useSmartBreaks) {
      breakRuleRelaxedRef.value = true;
      for (const day of orderedCandidateDays) {
        const dailyAllowance = isDailyCapRelaxed
          ? state.remaining
          : 3 - placedByLessonAndDay[state.lesson.name][day];
        const maximumChunkSize = Math.min(state.remaining, dailyAllowance, 3);
        const candidateChunk = takeDynamicChunk(
          remainingSlots[day],
          maximumChunkSize,
          occupiedHourIndexesByDay[day],
          false
        );

        if (candidateChunk.length > 0) {
          selectedDay = day;
          chunk = candidateChunk;
          break;
        }
      }
    }

    // Seçili günün slot listesi dolu olduğu için bu dal normalde oluşmaz;
    // yine de ilerleme garantisi için kullanılamayan gün fazdan çıkarılır.
    if (chunk.length === 0) {
      break;
    }

    const chunkKeys = new Set(chunk.map((slot) => `${slot.day}-${slot.hour}`));
    remainingSlots[selectedDay] = remainingSlots[selectedDay].filter(
      (slot) => !chunkKeys.has(`${slot.day}-${slot.hour}`)
    );
    chunk.forEach((slot) => {
      plan[slot.day][slot.hour].lessonName = state.lesson.name;
      plan[slot.day][slot.hour].lessonColor = state.lesson.color;
      occupiedHourIndexesByDay[slot.day].add(slot.hourIndex);
    });

    state.remaining -= chunk.length;
    placedHours += chunk.length;
    placedByLessonAndDay[state.lesson.name][selectedDay] += chunk.length;
  }

  return placedHours;
};

export default function ScheduleScreen({ navigation, route, isDarkMode }) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const styles = createStyles(theme, isDarkMode);
  const isCalendarView = route?.name === 'Takvim';

  const [weeklyPlan, setWeeklyPlan] = useState(createInitialPlan());
  const [selectedDay, setSelectedDay] = useState('Pazartesi');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const [lessonPool, setLessonPool] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const [poolManageModalVisible, setPoolManageModalVisible] = useState(false);
  const [newLessonName, setNewLessonName] = useState('');
  const [newLessonHours, setNewLessonHours] = useState('1'); 

  const [lessonModalVisible, setLessonModalVisible] = useState(false);
  const [selectedHourForLesson, setSelectedHourForLesson] = useState(null);
  const [manualLessonInput, setManualLessonInput] = useState('');

  // 1. KAYITLI PROGRAMI BACKENDDEN ÇEK
  useFocusEffect(
    useCallback(() => {
    let isActive = true;
    const loadSavedSchedule = async () => {
      try {
        const res = await api.get('/schedule/');
        if (isActive && res.data) {
          const schedulePayload = res.data.schedule;
          const nestedPayload = schedulePayload && typeof schedulePayload === 'object' && !Array.isArray(schedulePayload)
            ? schedulePayload
            : {};
          const savedPlan = res.data.plan || nestedPayload.plan;
          const savedPool = res.data.pool || nestedPayload.pool;
          const savedRows = res.data.rows || nestedPayload.rows || (Array.isArray(schedulePayload) ? schedulePayload : []);
          const restored = restoreScheduleState(savedPlan, savedPool, savedRows);

          setWeeklyPlan(restored.plan);
          setLessonPool(restored.pool);
        }
      } catch (err) {
        console.log("Kayıtlı takvim bulunamadı, boş şablon açılıyor.");
      } finally {
        if (isActive) setInitialLoading(false);
      }
    };
    loadSavedSchedule();
    return () => { isActive = false; };
  }, [])
  );

  // 2. ÇIKIŞ KORUMASI
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!hasUnsavedChanges) return;
      e.preventDefault();
      Alert.alert(
        'Değişiklikler Kaydedilmedi!',
        'Yaptığınız düzenlemeleri kaydetmeden çıkmak istiyor musunuz?',
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
      Alert.alert('Uyarı', 'Lütfen geçerli bir ders adı girin.');
      return;
    }
    const hours = parseInt(newLessonHours);
    if (isNaN(hours) || hours <= 0) return;

    if (lessonPool.some(l => l.name.toLowerCase() === newLessonName.trim().toLowerCase())) {
      Alert.alert('Uyarı', 'Bu ders zaten havuzunuzda mevcut.');
      return;
    }

    const nextColor = LESSON_COLORS[lessonPool.length % LESSON_COLORS.length];
    const newLesson = { id: Date.now().toString(), name: newLessonName.trim(), hours: hours, color: nextColor };
    
    setLessonPool([...lessonPool, newLesson]);
    setNewLessonName('');
    setNewLessonHours('1'); 
    setHasUnsavedChanges(true);
  };

  const handleRemoveLessonFromPool = (id) => {
    const lessonToRemove = lessonPool.find((lesson) => lesson.id === id);
    setLessonPool(lessonPool.filter(lesson => lesson.id !== id));

    if (lessonToRemove) {
      setWeeklyPlan((previousPlan) => {
        const nextPlan = { ...previousPlan };
        DAYS.forEach((day) => {
          nextPlan[day] = { ...previousPlan[day] };
          HOURS.forEach((hour) => {
            const slot = previousPlan[day][hour];
            nextPlan[day][hour] = slot.lessonName === lessonToRemove.name
              ? { ...slot, lessonName: '', lessonColor: null }
              : slot;
          });
        });
        return nextPlan;
      });
    }

    setHasUnsavedChanges(true);
  };

  // 4. SAAT MÜSAİTLİK DURUMU
  const toggleAvailability = (hour) => {
    const currentStatus = weeklyPlan[selectedDay][hour].status;
    let nextStatus = 'available';
    if (currentStatus === 'available') nextStatus = 'busy';
    else if (currentStatus === 'busy') nextStatus = 'tentative';

    if (nextStatus === 'busy' && weeklyPlan[selectedDay][hour].lessonName) {
      Alert.alert('Ders Yerleştirilmiş', 'Bu saati kırmızı yapmadan önce yerleştirilmiş dersi kaldırın.');
      return;
    }
    
    setWeeklyPlan(prev => ({
      ...prev,
      [selectedDay]: { ...prev[selectedDay], [hour]: { ...prev[selectedDay][hour], status: nextStatus } }
    }));
    setHasUnsavedChanges(true);
  };

  const setWholeDayStatus = (status, day = selectedDay) => {
    const applyStatus = () => {
      setWeeklyPlan((previousPlan) => {
        const updatedDay = {};
        HOURS.forEach((hour) => {
          const slot = previousPlan[day][hour];
          updatedDay[hour] = {
            ...slot,
            status,
            lessonName: status === 'busy' ? '' : slot.lessonName,
            lessonColor: status === 'busy' ? null : slot.lessonColor,
          };
        });

        return {
          ...previousPlan,
          [day]: updatedDay,
        };
      });
      setHasUnsavedChanges(true);
    };

    const assignedLessonCount = HOURS.filter(
      (hour) => weeklyPlan[day][hour].lessonName
    ).length;

    if (status === 'busy' && assignedLessonCount > 0) {
      Alert.alert(
        'Günü Meşgul Yap',
        `${day} gününde yerleştirilmiş ${assignedLessonCount} ders saati var. Günü meşgul yapmak bu dersleri kaldıracak. Devam edilsin mi?`,
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Dersleri Kaldır', style: 'destructive', onPress: applyStatus },
        ]
      );
      return;
    }

    applyStatus();
  };

  const handleDayPress = (day) => {
    if (selectedDay !== day) {
      setSelectedDay(day);
      return;
    }

    const statuses = HOURS.map((hour) => weeklyPlan[day][hour].status);
    const uniformStatus = statuses.every((status) => status === statuses[0]) ? statuses[0] : null;
    const nextStatus = uniformStatus === 'available'
      ? 'tentative'
      : (uniformStatus === 'tentative' ? 'busy' : 'available');
    setWholeDayStatus(nextStatus, day);
  };

  // 5. MANUEL DERS ATAMA
  const openLessonModal = (hour) => {
    if (weeklyPlan[selectedDay][hour].status === 'busy') {
      Alert.alert('Meşgul Zaman', 'Kırmızı işaretli zaman dilimlerine ders eklenemez. Önce müsaitlik durumunu değiştirin.');
      return;
    }
    setSelectedHourForLesson(hour);
    setManualLessonInput(weeklyPlan[selectedDay][hour].lessonName || '');
    setLessonModalVisible(true);
  };

  const assignLessonFromPool = (lesson) => {
    const currentLesson = weeklyPlan[selectedDay][selectedHourForLesson].lessonName;
    const assignedCount = getAssignedLessonCounts(weeklyPlan)[lesson.name] || 0;
    const targetHours = Number(lesson.hours) || 0;

    if (currentLesson !== lesson.name && assignedCount >= targetHours) {
      Alert.alert(
        'Ders Saati Doldu',
        `${lesson.name} için belirlediğiniz ${targetHours} saatin tamamı programa yerleştirildi. Yeni bir saate eklemek için önce mevcut yerleşimlerden birini kaldırın.`
      );
      return;
    }

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
    const matchingLesson = lessonPool.find(
      (lesson) => lesson.name.toLocaleLowerCase('tr-TR') === manualLessonInput.trim().toLocaleLowerCase('tr-TR')
    );

    if (!matchingLesson) {
      Alert.alert(
        'Ders Havuzunda Yok',
        'Saat kotasını koruyabilmek için dersi önce Ders Havuzu Yönetimi alanından hedef saatiyle ekleyin.'
      );
      return;
    }

    assignLessonFromPool(matchingLesson);
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

  // 6. KAPASİTE AĞIRLIKLI VE DERS KOTALI PROGRAM ÖNERİSİ
  const handleAIGenerate = () => {
    if (lessonPool.length === 0) {
      Alert.alert('Uyarı', 'Lütfen önce ders havuzuna çalışmak istediğiniz dersleri ekleyin.');
      return;
    }
    setAiLoading(true);

    const normalizedLessons = lessonPool
      .map((lesson) => ({ ...lesson, hours: Number(lesson.hours) || 0 }))
      .filter((lesson) => lesson.hours > 0);
    const totalRequiredHours = normalizedLessons.reduce((sum, lesson) => sum + lesson.hours, 0);
    const greenSlotsByDay = Object.fromEntries(DAYS.map((day) => [day, []]));
    const yellowSlotsByDay = Object.fromEntries(DAYS.map((day) => [day, []]));

    DAYS.forEach((day) => {
      HOURS.forEach((hour, hourIndex) => {
        const status = weeklyPlan[day][hour].status;
        const slot = { day, hour, hourIndex };
        if (status === 'available') greenSlotsByDay[day].push(slot);
        if (status === 'tentative') yellowSlotsByDay[day].push(slot);
      });
    });

    const totalGreen = DAYS.reduce((sum, day) => sum + greenSlotsByDay[day].length, 0);
    const totalYellow = DAYS.reduce((sum, day) => sum + yellowSlotsByDay[day].length, 0);
    const totalAvailable = totalGreen + totalYellow;
    const capacityErrorMessage = 'Tüm derslerinizi sığdırmak için takvimde yeterli boşluk yok. Lütfen daha fazla alanı müsait (yeşil/sarı) yapın.';

    if (totalRequiredHours > totalAvailable) {
      setAiLoading(false);
      Alert.alert('Kapasite Yetersiz!', capacityErrorMessage);
      return;
    }

    const lessonStates = normalizedLessons.map((lesson) => ({ lesson, remaining: lesson.hours }));
    const placedByLessonAndDay = Object.fromEntries(
      normalizedLessons.map((lesson) => [
        lesson.name,
        Object.fromEntries(DAYS.map((day) => [day, 0])),
      ])
    );
    const lessonCursorRef = { value: 0 };
    const estimatedBlockCount = normalizedLessons.reduce(
      (sum, lesson) => sum + Math.ceil(lesson.hours / 3),
      0
    );
    const greenDaysWithCapacity = DAYS.filter((day) => greenSlotsByDay[day].length > 0).length;
    const requiredBreakCount = Math.max(
      0,
      estimatedBlockCount - Math.min(estimatedBlockCount, greenDaysWithCapacity)
    );
    const useSmartBreaks = totalGreen > totalRequiredHours + requiredBreakCount;
    const occupiedHourIndexesByDay = Object.fromEntries(
      DAYS.map((day) => [day, new Set()])
    );
    const breakRuleRelaxedRef = { value: false };

    const newPlan = JSON.parse(JSON.stringify(weeklyPlan));
    DAYS.forEach((day) => {
      HOURS.forEach((hour) => {
        newPlan[day][hour].lessonName = '';
        newPlan[day][hour].lessonColor = null;
      });
    });

    // Birinci faz: Dersler yalnızca yeşil alanlara yerleştirilir.
    const usedGreenHours = placeLessonPhase({
      phaseSlots: greenSlotsByDay,
      lessonStates,
      plan: newPlan,
      placedByLessonAndDay,
      lessonCursorRef,
      occupiedHourIndexesByDay,
      useSmartBreaks,
      breakRuleRelaxedRef,
    });
    const hasRemainingLessonsAfterGreen = lessonStates.some((state) => state.remaining > 0);

    // İkinci faz: Ancak yeşil fazdan sonra kota kaldıysa sarı alanlar kullanılır.
    const usedYellowHours = hasRemainingLessonsAfterGreen
      ? placeLessonPhase({
          phaseSlots: yellowSlotsByDay,
          lessonStates,
          plan: newPlan,
          placedByLessonAndDay,
          lessonCursorRef,
          occupiedHourIndexesByDay,
          useSmartBreaks,
          breakRuleRelaxedRef,
        })
      : 0;

    setWeeklyPlan(newPlan);
    setHasUnsavedChanges(true);
    setAiLoading(false);
    Alert.alert(
      'Program Hazır',
      `${totalRequiredHours} ders saati haftaya dengeli dağıtıldı.\n\nKullanılan yeşil saat: ${usedGreenHours}\nKullanılan sarı saat: ${usedYellowHours}\nKullanılan kırmızı saat: 0\n\nDersler önce 12:00–16:00 aralığına, sonra sabah ve akşam saatlerine yerleştirildi. ${useSmartBreaks && !breakRuleRelaxedRef.value ? 'Uygun bloklar arasında birer saat mola bırakıldı.' : 'Takvim kapasitesini korumak için gerektiğinde mola kuralı esnetildi.'}`
    );
  };

  // 7. BACKEND KAYIT (PROFİL EKRANI İÇİN ÖZEL DÖNÜŞÜM İLE)
  const handleSaveToBackend = async () => {
    const assignedCounts = getAssignedLessonCounts(weeklyPlan);
    const quotaProblems = lessonPool
      .map((lesson) => {
        const target = Number(lesson.hours) || 0;
        const assigned = assignedCounts[lesson.name] || 0;
        if (assigned === target) return null;
        return `${lesson.name}: ${assigned}/${target} saat (${Math.abs(target - assigned)} saat ${assigned < target ? 'eksik' : 'fazla'})`;
      })
      .filter(Boolean);
    const poolLessonNames = new Set(lessonPool.map((lesson) => lesson.name));
    const unknownLessons = Object.keys(assignedCounts).filter((lessonName) => !poolLessonNames.has(lessonName));
    const busyAssignments = DAYS.flatMap((day) =>
      HOURS.filter((hour) => weeklyPlan[day][hour].status === 'busy' && weeklyPlan[day][hour].lessonName)
        .map((hour) => `${day} ${hour}`)
    );

    if (quotaProblems.length > 0 || unknownLessons.length > 0 || busyAssignments.length > 0) {
      const unknownMessage = unknownLessons.length > 0
        ? `\n\nHavuz dışı dersler: ${unknownLessons.join(', ')}`
        : '';
      const busyMessage = busyAssignments.length > 0
        ? `\n\nKırmızı saatte kalan dersler: ${busyAssignments.join(', ')}`
        : '';
      Alert.alert(
        'Ders Saatlerini Tamamlayın',
        `Programı kaydetmeden önce her dersin hedef saatini tam doldurun.\n\n${quotaProblems.join('\n')}${unknownMessage}${busyMessage}`
      );
      return;
    }

    setLoading(true);
    try {
      // Profil sayfasının listeleme yapısına uyumlu hale getirmek için dizi oluşturuluyor
      const flatSchedule = [];
      DAYS.forEach(d => {
         HOURS.forEach(h => {
             if(weeklyPlan[d][h].lessonName) {
                 flatSchedule.push({
                     day: d,
                     hour: h,
                     lesson: weeklyPlan[d][h].lessonName,
                     lessonColor: weeklyPlan[d][h].lessonColor,
                 });
             }
         });
      });

      const schedulePayload = {
        plan: weeklyPlan,
        pool: lessonPool,
        rows: flatSchedule,
      };

      await api.post('/schedule/', {
        plan: weeklyPlan,
        pool: lessonPool,
        rows: flatSchedule,
        schedule: schedulePayload,
      });
      
      setHasUnsavedChanges(false);
      Alert.alert('Başarılı', 'Haftalık çalışma planınız sisteme başarıyla kaydedildi.');
    } catch (err) {
      Alert.alert('Hata', 'Kaydedilirken bulut sunucu bağlantısında bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    if (status === 'available') return { border: '#10b981', text: 'Müsait', bg: isDarkMode ? '#10b98115' : '#ecfdf5' };
    if (status === 'busy') return { border: '#ef4444', text: 'Meşgul', bg: isDarkMode ? '#ef444415' : '#fef2f2' };
    return { border: '#f59e0b', text: 'Esnek', bg: isDarkMode ? '#f59e0b15' : '#fffbeb' };
  };

  const getDayStatus = (day) => {
    const statuses = HOURS.map((hour) => weeklyPlan[day][hour].status);
    return statuses.every((status) => status === statuses[0]) ? statuses[0] : 'mixed';
  };

  const getDayStatusColor = (day) => {
    const status = getDayStatus(day);
    if (status === 'available') return '#10b981';
    if (status === 'tentative') return '#f59e0b';
    if (status === 'busy') return '#ef4444';
    return theme.textSecondary;
  };

  const assignedHoursByLesson = getAssignedLessonCounts(weeklyPlan);
  const hasSavedSchedule = Object.values(assignedHoursByLesson).some((count) => count > 0);

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (isCalendarView) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.calendarHeader}>
          <View>
            <Text style={styles.calendarEyebrow}>HAFTALIK PLAN</Text>
            <Text style={styles.calendarTitle}>Ders Takvimim</Text>
          </View>
          {hasSavedSchedule && (
            <TouchableOpacity style={styles.editScheduleBtn} onPress={() => navigation.navigate('Schedule')}>
              <MaterialIcons name="edit-calendar" size={18} color="#fff" />
              <Text style={styles.editScheduleBtnText}>Düzenle</Text>
            </TouchableOpacity>
          )}
        </View>

        {!hasSavedSchedule ? (
          <View style={styles.emptyCalendarContainer}>
            <View style={styles.emptyCalendarIcon}>
              <MaterialIcons name="calendar-month" size={52} color={theme.primary} />
            </View>
            <Text style={styles.emptyCalendarTitle}>Henüz kayıtlı programın yok</Text>
            <Text style={styles.emptyCalendarDescription}>
              Müsaitliklerini ve ders hedeflerini belirleyerek haftalık programını oluşturabilirsin.
            </Text>
            <TouchableOpacity style={styles.createScheduleBtn} onPress={() => navigation.navigate('Schedule')}>
              <MaterialIcons name="add" size={22} color="#fff" />
              <Text style={styles.createScheduleBtnText}>Ders Programı Oluştur</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.calendarDaysContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysScroll}>
                {DAYS.map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[styles.dayCard, selectedDay === day && styles.dayCardActive]}
                    onPress={() => setSelectedDay(day)}
                  >
                    <Text style={[styles.dayText, selectedDay === day && styles.dayTextActive]}>{day.substring(0, 3)}</Text>
                    <View style={[styles.dayStatusDot, { backgroundColor: getDayStatusColor(day) }]} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.calendarTimeline, { paddingBottom: 30 + insets.bottom }]}>
              <Text style={styles.selectedDayTitle}>{selectedDay}</Text>
              {HOURS.map((hour) => {
                const slot = weeklyPlan[selectedDay][hour];
                const statusStyle = getStatusStyle(slot.status);
                return (
                  <View key={hour} style={styles.calendarTimeRow}>
                    <Text style={styles.calendarHour}>{hour}</Text>
                    <View style={styles.timelineRail}>
                      <View style={[styles.timelineDot, { backgroundColor: slot.lessonColor || statusStyle.border }]} />
                      <View style={styles.timelineLine} />
                    </View>
                    <View style={[
                      styles.calendarLessonCard,
                      slot.lessonName && { borderColor: slot.lessonColor, backgroundColor: `${slot.lessonColor}18` },
                    ]}>
                      <Text style={[styles.calendarLessonName, !slot.lessonName && styles.calendarEmptyLesson]}>
                        {slot.lessonName || 'Planlanmış ders yok'}
                      </Text>
                      <Text style={[styles.calendarAvailability, { color: statusStyle.border }]}>{statusStyle.text}</Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </>
        )}
      </SafeAreaView>
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

      {/* Yatay Ders Havuzu Gösterimi */}
      <View style={styles.poolStripContainer}>
        <ScrollView style={styles.poolStripScroll} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.poolScroll}>
          {lessonPool.length === 0 && (
            <Text style={styles.emptyPoolStripText}>Havuz boş. Sağdaki panelden ders ekleyin.</Text>
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

      {/* Gün Seçim Menüsü */}
      <View style={styles.daysContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysScroll}>
          {DAYS.map((day) => (
            <TouchableOpacity key={day} style={[styles.dayCard, selectedDay === day && styles.dayCardActive]} onPress={() => handleDayPress(day)}>
              <Text style={[styles.dayText, selectedDay === day && styles.dayTextActive]}>{day.substring(0, 3)}</Text>
              <View style={[styles.dayStatusDot, { backgroundColor: getDayStatusColor(day) }]} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Saat ve Ders Matrisi Alanı */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.hoursContainer, { paddingBottom: 100 + insets.bottom }]}
      >
        <Text style={styles.infoText}>Bir günü seçin; seçili güne tekrar dokunarak tüm günü yeşil, sarı veya kırmızı yapın. Tek saat için soldaki alana dokunun.</Text>
        
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
                    {slot.status === 'busy' ? 'Bu saat dilimi meşgul.' : '+ Ders eklemek için dokun'}
                  </Text>
                )}
              </TouchableOpacity>

            </View>
          );
        })}
      </ScrollView>

      {/* SAĞ ALT SABİT DERS PROGRAMI ÖNER FAB BUTONU */}
      <TouchableOpacity style={[styles.fabExtended, { bottom: Math.max(24, insets.bottom + 16) }, lessonPool.length === 0 && { opacity: 0.6 }]} onPress={handleAIGenerate} disabled={aiLoading || lessonPool.length === 0} activeOpacity={0.8}>
        {aiLoading ? (
          <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
        ) : (
          <MaterialIcons name="auto-awesome" size={22} color="#fff" style={{ marginRight: 8 }} />
        )}
        <Text style={styles.fabText}>Ders Programı Öner</Text>
      </TouchableOpacity>

      {/* MODAL 1: DERS HAVUZU YÖNETİMİ PANELİ */}
      <Modal animationType="slide" transparent visible={poolManageModalVisible} statusBarTranslucent navigationBarTranslucent onRequestClose={() => setPoolManageModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalKeyboardAvoider}>
          <Pressable style={styles.bottomSheetOverlay} onPress={() => setPoolManageModalVisible(false)}>
            <Pressable style={[styles.bottomSheetContent, { maxHeight: windowHeight - Math.max(insets.top, 12), paddingBottom: Math.max(insets.bottom, 16) }]} onPress={(event) => event.stopPropagation()}>
              <ScrollView contentContainerStyle={styles.sheetScrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>Ders Havuzu Yönetimi</Text>
            <Text style={styles.modalSubTitle}>Çalışacağınız dersleri ve haftalık saat hedeflerini belirleyin.</Text>
            
            <View style={styles.managePoolList}>
              {lessonPool.length > 0 ? lessonPool.map(lesson => (
                <View key={lesson.id} style={[styles.managePoolItem, { borderColor: lesson.color }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={[styles.colorDot, { backgroundColor: lesson.color, marginRight: 10 }]} />
                    <Text numberOfLines={2} style={[styles.managePoolItemText, { color: isDarkMode ? '#fff' : lesson.color }]}>{lesson.name} <Text style={{fontWeight:'normal'}}>({lesson.hours} Saat)</Text></Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveLessonFromPool(lesson.id)} style={{ padding: 6 }}>
                    <MaterialIcons name="delete-outline" size={22} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              )) : (
                <Text style={styles.emptyPoolText}>Havuzda ders yok. Aşağıdan yenisini tanımlayın.</Text>
              )}
            </View>

            <Text style={styles.sectionHeader}>Yeni Ders Tanımla</Text>
            <View style={styles.poolLessonForm}>
              <TextInput style={styles.manualInput} placeholder="Ders Adı" placeholderTextColor={theme.textSecondary} value={newLessonName} onChangeText={setNewLessonName} />
              
              {/* ARTI-EKSİ LOGOLU STEPPER SAAT SEÇİCİ (MAKSİMUM 10 SAAT) */}
              <View style={styles.poolFormActions}>
                <View style={styles.stepperContainer}>
                <TouchableOpacity 
                  style={styles.stepperBtn} 
                  onPress={() => {
                    const current = parseInt(newLessonHours) || 1;
                    if (current > 1) setNewLessonHours((current - 1).toString());
                  }}
                >
                  <MaterialIcons name="remove" size={18} color="#fff" />
                </TouchableOpacity>
                <Text style={[styles.stepperText, { color: theme.text }]}>{newLessonHours}s</Text>
                <TouchableOpacity 
                  style={styles.stepperBtn} 
                  onPress={() => {
                    const current = parseInt(newLessonHours) || 1;
                    if (current < 10) setNewLessonHours((current + 1).toString()); // MAX 10 LİMİTİ BURADA
                  }}
                >
                  <MaterialIcons name="add" size={18} color="#fff" />
                </TouchableOpacity>
                </View>

                <TouchableOpacity style={[styles.manualBtn, styles.poolAddBtn]} onPress={handleAddLessonToPool}>
                  <Text style={styles.manualBtnText}>Ekle</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setPoolManageModalVisible(false)}>
              <Text style={styles.closeModalBtnText}>Tamamlandı</Text>
            </TouchableOpacity>
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL 2: DERS SEÇİM VE MANUEL ATAMA PANELİ */}
      <Modal animationType="slide" transparent visible={lessonModalVisible} statusBarTranslucent navigationBarTranslucent onRequestClose={() => setLessonModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalKeyboardAvoider}>
          <Pressable style={styles.bottomSheetOverlay} onPress={() => setLessonModalVisible(false)}>
            <Pressable style={[styles.bottomSheetContent, { maxHeight: windowHeight - Math.max(insets.top, 12), paddingBottom: Math.max(insets.bottom, 16) }]} onPress={(event) => event.stopPropagation()}>
              <ScrollView contentContainerStyle={styles.sheetScrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>{selectedDay} - Saat {selectedHourForLesson}</Text>
            <Text style={styles.modalSubTitle}>Havuzdaki dersleri hedef saat kotası dolana kadar yerleştirin.</Text>
            
            <Text style={styles.sectionHeader}>Havuzdaki Dersleriniz</Text>
            <View style={styles.sheetPoolList}>
              {lessonPool.length > 0 ? lessonPool.map(lesson => (
                <TouchableOpacity key={lesson.id} style={[styles.sheetPoolItem, { borderColor: lesson.color, backgroundColor: lesson.color + '15' }]} onPress={() => assignLessonFromPool(lesson)}>
                  <View style={[styles.colorDot, { backgroundColor: lesson.color, width: 12, height: 12, borderRadius: 6 }]} />
                  <Text style={[styles.sheetPoolItemText, { color: isDarkMode ? '#fff' : lesson.color }]}>{lesson.name} ({assignedHoursByLesson[lesson.name] || 0}/{lesson.hours} Saat)</Text>
                  <MaterialIcons name="check-circle-outline" size={20} color={lesson.color} />
                </TouchableOpacity>
              )) : (
                <Text style={styles.emptyPoolText}>Havuz boş. Önce ana panelden havuzu doldurun.</Text>
              )}
            </View>

            <Text style={styles.sectionHeader}>Havuzdaki Dersi Adıyla Seç</Text>
            <View style={styles.manualInputRow}>
              <TextInput style={[styles.manualInput, {marginRight: 8}]} placeholder="Örn: Paragraf Çözümü" placeholderTextColor={theme.textSecondary} value={manualLessonInput} onChangeText={setManualLessonInput} />
              <TouchableOpacity style={styles.manualBtn} onPress={assignManualLesson}>
                <Text style={styles.manualBtnText}>Ekle</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.modalButtons, { marginTop: 20 }]}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setLessonModalVisible(false)}>
                <Text style={styles.modalBtnCancelText}>Vazgeç</Text>
              </TouchableOpacity>
              {weeklyPlan[selectedDay][selectedHourForLesson]?.lessonName !== '' && (
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#ef4444' }]} onPress={removeAssignedLesson}>
                  <Text style={styles.modalBtnSaveText}>Dersi Kaldır</Text>
                </TouchableOpacity>
              )}
            </View>
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const createStyles = (theme, isDarkMode) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.background },
  loadingContainer: { flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' },
  calendarHeader: { minHeight: Platform.OS === 'android' ? 92 : 76, paddingTop: Platform.OS === 'android' ? 24 : 8, paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.border },
  calendarEyebrow: { color: theme.primary, fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  calendarTitle: { color: theme.text, fontSize: 22, fontWeight: '900', marginTop: 2 },
  editScheduleBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  editScheduleBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  emptyCalendarContainer: { flex: 1, paddingHorizontal: 30, alignItems: 'center', justifyContent: 'center' },
  emptyCalendarIcon: { width: 104, height: 104, borderRadius: 52, backgroundColor: isDarkMode ? `${theme.primary}20` : `${theme.primary}12`, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  emptyCalendarTitle: { color: theme.text, fontSize: 20, fontWeight: '900', textAlign: 'center' },
  emptyCalendarDescription: { color: theme.textSecondary, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 10, marginBottom: 24 },
  createScheduleBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.primary, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14 },
  createScheduleBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  calendarDaysContainer: { borderBottomWidth: 1, borderBottomColor: theme.border, paddingVertical: 12 },
  calendarTimeline: { paddingHorizontal: 16, paddingTop: 18 },
  selectedDayTitle: { color: theme.text, fontSize: 19, fontWeight: '900', marginBottom: 14 },
  calendarTimeRow: { flexDirection: 'row', alignItems: 'stretch', minHeight: 72 },
  calendarHour: { width: 52, color: theme.textSecondary, fontSize: 13, fontWeight: '800', paddingTop: 15 },
  timelineRail: { width: 24, alignItems: 'center' },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: 18, zIndex: 2 },
  timelineLine: { position: 'absolute', top: 28, bottom: 0, width: 2, backgroundColor: theme.border },
  calendarLessonCard: { flex: 1, minHeight: 58, marginBottom: 10, borderRadius: 14, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, paddingHorizontal: 14, paddingVertical: 10, justifyContent: 'center' },
  calendarLessonName: { color: theme.text, fontSize: 14, fontWeight: '800' },
  calendarEmptyLesson: { color: theme.textSecondary, fontWeight: '500', fontStyle: 'italic' },
  calendarAvailability: { fontSize: 11, fontWeight: '800', marginTop: 4 },
  appBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: Platform.OS === 'android' ? 76 : 64, paddingTop: Platform.OS === 'android' ? 24 : 0, backgroundColor: theme.surface, borderBottomWidth: 1, borderColor: theme.border },
  backBtn: { width: 76, height: 44, justifyContent: 'center' },
  appBarTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: 'bold', color: theme.text },
  saveBtn: { minWidth: 76, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: theme.primary, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },

  poolStripContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, borderBottomWidth: 1, borderColor: theme.border },
  poolStripScroll: { flex: 1 },
  poolScroll: { paddingHorizontal: 16, paddingVertical: 12, gap: 10, alignItems: 'center' },
  emptyPoolStripText: { fontSize: 13, color: theme.textSecondary, fontStyle: 'italic', alignSelf: 'center' },
  poolChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, gap: 6 },
  poolChipText: { fontSize: 13, fontWeight: 'bold' },
  poolManageBtn: { padding: 16, borderLeftWidth: 1, borderColor: theme.border, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background },

  daysContainer: { borderBottomWidth: 1, borderColor: theme.border, paddingBottom: 10, marginTop: 10 },
  daysScroll: { paddingHorizontal: 16, gap: 10 },
  dayCard: { minWidth: 58, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, alignItems: 'center' },
  dayCardActive: { backgroundColor: theme.text, borderColor: theme.text },
  dayText: { fontSize: 14, fontWeight: 'bold', color: theme.textSecondary },
  dayTextActive: { color: theme.background },
  dayStatusDot: { width: 7, height: 7, borderRadius: 4, marginTop: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)' },

  infoText: { fontSize: 12, color: theme.textSecondary, textAlign: 'center', marginBottom: 12, paddingHorizontal: 10 },

  hoursContainer: { paddingHorizontal: 16, paddingTop: 10, gap: 12 },
  hourRow: { flexDirection: 'row', alignItems: 'stretch', gap: 10 },
  
  availabilityZone: { width: 80, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderRadius: 14, paddingVertical: 12 },
  hourText: { fontSize: 16, fontWeight: '900', color: theme.text, marginBottom: 2 },
  statusText: { fontSize: 11, fontWeight: 'bold' },

  lessonZone: { flex: 1, borderRadius: 14, borderWidth: 1.5, justifyContent: 'center', paddingHorizontal: 16, minHeight: 65 },
  filledLesson: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  colorDot: { width: 10, height: 10, borderRadius: 5 },
  lessonText: { fontSize: 15, fontWeight: 'bold', flex: 1 },
  emptyLessonText: { fontSize: 13, color: theme.textSecondary, fontStyle: 'italic' },

  fabExtended: { position: 'absolute', right: 20, maxWidth: '88%', flexDirection: 'row', backgroundColor: theme.primary, paddingHorizontal: 20, height: 56, borderRadius: 28, alignItems: 'center', elevation: 6, shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 6, zIndex: 99 },
  fabText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  modalKeyboardAvoider: { flex: 1 },
  bottomSheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' },
  bottomSheetContent: { width: '100%', backgroundColor: theme.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  sheetScrollContent: { paddingHorizontal: 20, paddingTop: 12 },
  sheetHandle: { width: 40, height: 5, backgroundColor: theme.border, borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 6 },
  modalSubTitle: { fontSize: 14, color: theme.textSecondary, marginBottom: 16, lineHeight: 20 },
  sectionHeader: { fontSize: 14, fontWeight: 'bold', color: theme.textSecondary, marginTop: 10, marginBottom: 8 },
  
  managePoolList: { marginBottom: 16 },
  managePoolItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8, backgroundColor: theme.background },
  managePoolItemText: { fontSize: 15, fontWeight: 'bold' },
  
  sheetPoolList: { marginBottom: 16 },
  sheetPoolItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  sheetPoolItemText: { flex: 1, fontSize: 15, fontWeight: 'bold', marginLeft: 10 },
  
  emptyPoolText: { fontSize: 13, color: theme.textSecondary, fontStyle: 'italic', paddingVertical: 10 },

  manualInputRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  manualInput: { flex: 1, backgroundColor: theme.background, color: theme.text, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: theme.border, fontSize: 15 },
  poolLessonForm: { width: '100%', gap: 10 },
  poolFormActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  
  stepperContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border, borderRadius: 12, paddingHorizontal: 6, height: 52 },
  stepperBtn: { backgroundColor: theme.primary, width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  stepperText: { minWidth: 32, textAlign: 'center', fontSize: 15, fontWeight: 'bold' },

  manualBtn: { backgroundColor: theme.primary, paddingHorizontal: 20, height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  poolAddBtn: { flex: 1 },
  manualBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  closeModalBtn: { backgroundColor: theme.primary, paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 24 },
  closeModalBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  modalButtons: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, paddingVertical: 16, alignItems: 'center', borderRadius: 14 },
  modalBtnCancel: { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border },
  modalBtnCancelText: { color: theme.textSecondary, fontWeight: 'bold' },
  modalBtnSave: { backgroundColor: theme.primary },
  modalBtnSaveText: { color: '#fff', fontWeight: 'bold' }
});
