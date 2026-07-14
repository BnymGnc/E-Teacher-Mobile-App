# Mobile-app Docker kullanımı

React Native uygulaması bir web sunucusu gibi container içinde yayınlanmaz. Bu imaj Expo Metro geliştirme sunucusunu LAN modunda çalıştırır; terminaldeki QR kod Expo Go ile taranır.

```powershell
docker compose up --build
```

Fiziksel telefon kullanılacaksa telefon ve bilgisayar aynı ağda olmalı, ayrıca bilgisayarın yerel IP adresi Metro'ya verilmelidir. Yerel backend kullanılacaksa API adresinde de `localhost` yerine aynı IP kullanılır:

```powershell
$env:REACT_NATIVE_PACKAGER_HOSTNAME="192.168.1.50"
$env:EXPO_PUBLIC_API_URL="http://192.168.1.50:8000/api/"
docker compose up --build
```

Canlı Render backend'i kullanılacaksa yalnızca `REACT_NATIVE_PACKAGER_HOSTNAME` tanımlanması yeterlidir.

Bu container APK/AAB üretmez; mağaza paketi için Expo EAS Build ayrı bir süreçtir.
