// src/mockData.js
export const mockUser = {
  name: "Bünyamin",
  dailyProgress: 75, // Yüzde olarak günlük tamamlanan hedef
  nextLesson: {
    title: "Matematik - Türev ve İntegral",
    time: "14:30",
    instructor: "Yapay Zeka Asistanı",
    platform: "Google Meet"
  },
  recentChat: [
    { id: 1, sender: "ai", text: "Merhaba! Bugün deneme sınavı sonucunu girdin, netlerin harika gidiyor. Nasıl hissediyorsun?" },
    { id: 2, sender: "user", text: "Biraz stresliyim, türev konusunda eksiklerim var sanki." }
  ]
};