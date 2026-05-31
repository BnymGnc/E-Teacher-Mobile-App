# E-Teacher: Yapay Zeka Destekli YKS Öğrenci Asistanı

E-Teacher, üniversite sınavına (YKS) hazırlanan öğrencilere kişiselleştirilmiş çalışma programları, deneme analizleri, anlık motivasyon desteği ve yapay zeka tabanlı soru üretimi sunan kapsamlı bir eğitim asistanıdır.

## 🎯 Projenin Amacı
Geleneksel eğitim süreçlerindeki "herkese tek tip program" mantığını kırarak, her öğrencinin kendi hızına, hedefine ve psikolojik durumuna göre adapte olabilen, LLM (Büyük Dil Modeli) destekli bir mobil koç yaratmak.

## 🏗️ Mimari ve Klasör Yapısı
Proje, mikroservis mantığına uygun olarak ayrıştırılmıştır:
* `/frontend`: React Native (Expo) ile geliştirilmiş mobil arayüz.
* `/backend`: Django REST Framework ile geliştirilmiş, API ve yapay zeka işlemlerini yürüten sunucu katmanı.
* `/prodocs`: Geliştirme sürecini, mimari kararları ve AI prompt stratejilerini anlatan dokümantasyonlar.

## 🚀 Kullanılan Teknolojiler (Tech Stack)
* **Backend:** Python, Django, Django REST Framework, SimpleJWT
* **Database:** PostgreSQL (Neon DB Serverless)
* **Frontend:** React Native, Expo, React Navigation
* **AI Servisi:** Google Gemini API
* **Deployment:** Render (Backend)

## ⚙️ Kurulum (Local Development)

**1. Backend (Django)**
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate  # Mac/Linux için: source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver