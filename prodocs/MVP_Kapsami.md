# E-Teacher Mobil - MVP Kapsamı (v1.0)

Mobil uygulama, web platformundaki mevcut yapay zeka (ML) gücünü ve veritabanı altyapısını kullanarak öğrencilerin "hareket halindeyken" en çok ihtiyaç duyduğu interaktif eğitim araçlarına odaklanacaktır.

## ✅ MVP'ye Dahil Olan Özellikler (In Scope)

### 1. Akıllı Pano ve Ders Takibi (Dashboard & Lessons)
* **Günlük İlerleme Raporu (`/daily-report`):** Öğrencinin o güne ait çalışma verilerini, tamamladığı görevleri ve genel ilerlemesini özetleyen mobil ana ekran.
* **Canlı Ders Entegrasyonu (`/lessons`):** Backend'de Google Calendar API üzerinden planlanmış derslerin listelenmesi ve tek tıkla "Derse Katıl" butonu ile doğrudan Meet odasına geçiş.

### 2. AI Psikolojik Destek ve Motivasyon Asistanı (`/support`)
* Öğrencilerin sınav stresi, kaygı yönetimi veya motivasyon eksikliği yaşadıkları anlarda özel LLM modelimizle dertleşebilecekleri anlık mesajlaşma (chat) arayüzü.
* Sistem, öğrencinin duygusal durumuna göre ona günlük hedeflerini hatırlatarak rehberlik eder.

### 3. Hedef Net ve Sınav Analizi (`/career` & `/analysis`)
* **Kariyer ve Hedefleme:** Backend'deki ML algoritmalarımızın ürettiği "Hedef Net" tahminlerinin ve eksik konu analizlerinin mobil uyumlu grafiklerle gösterimi.
* **Deneme Takibi:** Öğrencinin netlerini sisteme girip anında yapay zekadan geri bildirim alabildiği analiz ekranı.

### 4. Akıllı Soru / Quiz Üreticisi (`/quiz`)
* Öğrencinin seçtiği zorluk seviyesi ve konuya göre AI tarafından anlık olarak üretilen mini denemeler (Quizler) ve çözümleri.

---

## ❌ MVP'de Olmayan Özellikler (Out of Scope)
Kullanıcı deneyimini (UX) korumak adına aşağıdaki özellikler şimdilik sadece **Web** sürümünde tutulacaktır:
* **Eğitmenler İçin Yeni Ders Planlama (`/ders-planla`):** Karmaşık takvim ayarları mobil ekran kısıtlamaları nedeniyle web üzerinden yapılacaktır.
* **Büyük Dosya Özetleme (`/summary`):** Çok sayfalı PDF'lerin sisteme yüklenip işlenmesi süreci Faz 2'ye bırakılmıştır.