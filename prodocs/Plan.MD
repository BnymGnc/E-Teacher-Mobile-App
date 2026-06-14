# Geliştirme Planı ve Yol Haritası

Projeyi hayata geçirirken çevik (Agile) yöntemler izlenmiş ve geliştirme süreci 4 ana faza bölünmüştür:

**Faz 1: Altyapı ve Veritabanı Modellenmesi**
* Django projesinin başlatılması ve Neon PostgreSQL bağlantısının kurulması.
* Öğrenci profil, günlük rapor ve deneme analizi tablolarının modellerinin yazılması.
* SimpleJWT entegrasyonu ile güvenli giriş/çıkış sisteminin yapılması.

**Faz 2: Mobil Arayüz (UI/UX) İnşası**
* React Native Expo projesinin başlatılması.
* App.js üzerinde Stack ve BottomTab navigasyonlarının kurulması.
* Dark/Light mode tema yapısının kodlanması.
* Ekran tasarımlarının yapılması (Login, Dashboard, Quiz, Analysis vb.)

**Faz 3: AI Servislerinin Yazılması**
* Django backend'inde `/api/ai/` altında uç noktaların oluşturulması.
* Chat, Summarize (Özetleme) ve Quiz Generate (Soru Üretme) modülleri için Gemini entegrasyonlarının yapılması.
* Frontend'de `fetch/axios` ile bu API'lere bağlanıp verilerin state'lere aktarılması.

**Faz 4: Canlıya Alma (Deployment) ve Güvenlik**
* CORS ayarlarının yapılandırılarak frontend'in backend'e erişiminin sağlanması.
* Backend'in Render üzerine yüklenmesi (Gunicorn ve Whitenoise ayarları).
* Ortam değişkenlerinin (.env) güvenli hale getirilmesi.