# Product Requirements Document (PRD) - E-Teacher Mobil

## 1. Vizyon
Öğrencilerin sınav yolculuğunda yanlarında taşıyabilecekleri, kişiselleştirilmiş bir yapay zeka rehberi ve etkileşimli eğitim platformu sunmak.

## 2. Problem ve Hedef Kitle
**Problem:** YKS'ye hazırlanan öğrenciler, kişisel seviyelerine uygun program hazırlamakta, sınav stresiyle başa çıkmakta ve hedefledikleri üniversitenin güncel analizlerine anında ulaşmakta zorlanmaktadır.
**Hedef Kitle:** Sınav stresi yaşayan, çalışma verimini artırmak isteyen lise öğrencileri ve mezunlar.

## 3. Kullanıcı Hikayeleri ve Kabul Kriterleri (User Stories)
* **US01 (AI Psikolojik Destek):** Bir öğrenci olarak stresli hissettiğimde AI asistan ile konuşabilmeliyim.
  * *Kriter:* LLM modeli öğrencinin duygu durumunu analiz edip motive edici yanıtlar üretmeli ve konuşma geçmişi backend'de saklanmalıdır.
* **US02 (Canlı Dersler ve Takvim):** Bir öğrenci olarak yaklaşan dersimi veya planımı görüp anında organize olabilmeliyim.
  * *Kriter:* Takvim ekranı dinamik olmalı, API üzerinden günlük veriler çekilmelidir.
* **US03 (ML Sınav Analizi ve Hedef Net):** Bir öğrenci olarak hedeflediğim bölümün YÖK Atlas verilerini ve ulaşmam gereken netleri sistemde görebilmeliyim.
  * *Kriter:* Veriler backend'den çekilip mobil uyumlu, okunabilir grafikler/çipler halinde sunulmalıdır.

## 4. Başarı Ölçütleri (KPIs)
* **Kullanım:** Aktif kullanıcıların %50'sinin AI Chat modülünü haftada en az 3 kez kullanması.
* **Performans:** Mobil uygulamanın açılış ve AI yanıt süresinin 3 saniyenin altında kalması.