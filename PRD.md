# Product Requirements Document (PRD) - E-Teacher Mobil

## 1. Vizyon
Öğrencilerin sınav yolculuğunda yanlarında taşıyabilecekleri, kişiselleştirilmiş bir yapay zeka rehberi ve kesintisiz canlı ders platformu sunmak.

## 2. Teknik Mimari
* **Backend:** Django REST Framework (Python).
* **Veritabanı:** PostgreSQL (Neon DB).
* **Machine Learning:** Sınav analizi, hedef net tahminleme ve AI Chatbot modülleri.
* **Frontend (Mobil):** React Native / Flutter (Cross-platform).

## 3. Kullanıcı Hikayeleri ve Kabul Kriterleri (User Stories)

### Modül: AI Psikolojik Destek
* **US01:** Bir öğrenci olarak stresli hissettiğimde AI asistan ile konuşabilmeliyim.
  * *Kriter:* Mesaj iletimi hızlı olmalı ve konuşma geçmişi backend üzerinde saklanmalıdır.

### Modül: Canlı Dersler
* **US02:** Bir öğrenci olarak yaklaşan dersimi görüp telefondan Meet odasına girebilmeliyim.
  * *Kriter:* "Derse Katıl" butonu sadece ders saati geldiğinde aktifleşmelidir.

### Modül: ML Sınav Analizi
* **US03:** Bir öğrenci olarak deneme sonuçlarımı girdiğimde hedefime ne kadar yaklaştığımı görmeliyim.
  * *Kriter:* Veriler backend'deki ML modelinden çekilip görsel grafiklerle sunulmalıdır.

## 4. Başarı Ölçütleri (KPIs)
* **Kullanım:** Aktif kullanıcıların %50'sinin AI modüllerini haftada en az 3 kez kullanması.
* **Performans:** Uygulama açılış süresinin 3 saniyenin altında kalması.