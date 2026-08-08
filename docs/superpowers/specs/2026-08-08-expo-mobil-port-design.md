# AtölyeKart — Expo Mobil Port (2.7)

## Amaç
Mevcut `react.html` web kataloğunun (CDN React + Babel Standalone, build aracı yok) işlevsel bir
mobil karşılığını Expo/React Native ile oluşturmak. Web sürümü değişmeden kalır; mobil, ayrı ve
bağımsız bir istemci olarak `mobile/` klasöründe yaşar, aynı Vercel backend'ini (`api/token.js`,
`api/webhook.js`, `https://atolyekart.vercel.app`) kullanır.

## Kapsam
- Tek ekran: ürün kataloğu (3 ürün × 3 varyant), varyant seçimi, "Sipariş Ver" / "Stok Bildirimi
  İste" akışları — `react.html`'deki `App`/`ProductCard`/`OrderForm`/`StockNotifyForm` bileşenlerinin
  React Native karşılıkları.
- Yeni: OrderForm'a "Rehberden Seç" (contacts) butonu — `expo-contacts` ile izin isteyip seçilen
  kişinin ad/telefon/e-posta bilgisini forma otomatik doldurur.
- Kapsam dışı: push bildirim, offline mod, gerçek ürün görselleri için asset optimizasyonu, iOS/Android
  store dağıtımı.

## Mimari
- **Araç**: `npx create-expo-app@latest mobile` (JavaScript şablon, TypeScript yok — web tarafıyla
  tutarlı). Tüm native paketler `npx expo install <pkg>` ile eklenir (SDK'ya kilitli versiyon eşleşmesi
  için); elle `npm install` ile native paket eklenmez.
- **Veri**: `src/data/card.js` / `stock.js` içerikleri `mobile/data/card.js` / `stock.js`'e `export
  default` ile taşınır (web'deki global `<script>` yüklemesi yerine ES module `import`).
- **Bileşenler**: `View`/`Text`/`TextInput`/`TouchableOpacity`/`ScrollView` + varyant seçimi için
  `@react-native-picker/picker`. Stil, web'deki CSS custom property paletiyle birebir eşleşen bir
  `StyleSheet.create` sabitler nesnesinde (`mobile/theme.js`) tutulur.
- **Contacts**: `expo-contacts`. `Contacts.requestPermissionsAsync()` reddedilirse forma elle giriş
  engellenmez, sadece "Rehberden Seç" butonu devre dışı bırakılır/bilgilendirme gösterilir. Expo Go'da
  ek native modül/dev client gerekmez.
- **Ağ/JWT**: `API_BASE_URL = "https://atolyekart.vercel.app"` sabiti. `localStorage` yerine
  `@react-native-async-storage/async-storage`. `fetchAuthToken`/`sendToWebhook` mantığı (401 →
  token yenile → tek retry, dönüş değeri `true`/`false`) birebir korunur.
- **Backend değişikliği**: `api/webhook.js`'teki `source` doğrulaması `"atolyekart-web"` yanında
  `"atolyekart-mobile"`'ı da kabul edecek şekilde genişletilir (payload sözleşmesi aksi halde bozulur).
  Bu değişikliğin `atolyekart.vercel.app`'e yansıması için ayrı bir deploy gerekir — deploy bu görev
  kapsamında **yapılmaz**, sadece kod değişikliği yapılır.

## Hata Yönetimi
- Webhook/token istekleri web sürümüyle aynı: ağ hatası veya `!response.ok` → `sendToWebhook` `false`
  döner, form "şu anda yoğunluk var" hata mesajını gösterir (alert değil, satır içi mesaj).
- Contacts izni reddedilirse akış kesilmez; kullanıcı formu elle doldurmaya devam edebilir.
- E-posta regex ve KVKK onay checkbox zorunluluğu web ile aynı davranışta korunur.

## Doğrulama
- `npx expo-doctor` — SDK/paket versiyon uyumsuzluğu olmadığını teyit eder.
- Expo Go üzerinde manuel test: katalog listeleniyor, varyant seçimi çalışıyor, stokta/tükendi
  ayrımı doğru, sipariş ve stok bildirimi formları webhook'a ulaşıyor, rehberden kişi seçimi formu
  dolduruyor.
