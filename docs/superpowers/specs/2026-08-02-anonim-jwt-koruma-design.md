# Anonim JWT Koruması — Tasarım

## Amaç
`react.html` üzerinden gönderilen "Sipariş Ver" ve "Stok Bildirimi İste" istekleri şu an doğrudan `/api/webhook`'a, herhangi bir kimlik doğrulama olmadan ulaşıyor. Login ekranı eklemeden, `/api/webhook`'u yalnızca bu sitenin kendi ön yüzünden gelen isteklere açık hale getirmek için anonim, oturum bazlı bir JWT katmanı ekleniyor.

## Kapsam Dışı
- Kullanıcı hesabı, login/şifre akışı — bilinçli olarak eklenmiyor.
- Rate limiting / brute-force koruması — ayrı bir konu, bu spec'in kapsamında değil.
- Token'ın sekme kapatılınca silinmesi veya "logout" — anonim oturum olduğu için gerekmiyor.

## Yeni Bağımlılık
Proje şu ana kadar build aracısız/npm bağımlılıksız çalışıyordu (bkz. `atolyekart-conventions` skill). `jsonwebtoken` kütüphanesini kullanma kararıyla birlikte kök dizine bir `package.json` eklenir:

```json
{
  "name": "atolyekart",
  "private": true,
  "dependencies": {
    "jsonwebtoken": "^9.0.2"
  }
}
```

`node_modules/` `.gitignore`'a eklenir; `package-lock.json` commit edilir.

## Ortam Değişkeni: `JWT_SECRET`
`crypto.randomBytes(32).toString("hex")` ile üretilecek rastgele bir sır. `WEBHOOK_URL` ile aynı yerleşimde tutulur:
- `.env.development`, `.env.production` dosyalarına eklenir (ikisi de zaten `.gitignore`'da).
- `vercel env add JWT_SECRET production,preview,development` ile Vercel projesine kaydedilir.

## `api/token.js` (yeni Serverless Function)
- Yöntem: `GET`
- Mantık:
  ```js
  const sessionId = crypto.randomUUID();
  const token = jwt.sign({ sessionId }, process.env.JWT_SECRET, { expiresIn: "24h" });
  ```
- Yanıt: `200 { token }`
- Hata: `JWT_SECRET` tanımlı değilse `500 { error }` (mevcut `api/webhook.js`'teki `WEBHOOK_URL` kontrolüyle aynı desen).

## `api/webhook.js` (güncelleme)
- İstek başındaki `Authorization: Bearer <token>` header'ı okunur.
- `jwt.verify(token, process.env.JWT_SECRET)` ile doğrulanır.
- Header yoksa / format yanlışsa / doğrulama başarısızsa (süresi dolmuş dahil): `401 { error: "Unauthorized" }` döner, mevcut webhook forward mantığına hiç girilmez.
- Doğrulama başarılıysa: mevcut davranış (payload'ı `process.env.WEBHOOK_URL`'e POST etme) birebir aynı kalır.

## `react.html` Değişiklikleri
1. **Token edinme:** `App()` bileşenine mount-time bir `useEffect` eklenir. `localStorage.getItem("atolyekart_jwt")` kontrol edilir; yoksa `GET /api/token` çağrılıp sonuç `localStorage.setItem("atolyekart_jwt", token)` ile saklanır. Bu, "site ilk açıldığında" gereksinimini karşılar; UI'da görünür bir değişiklik yok.
2. **`sendToWebhook` güncellemesi:**
   - `localStorage.getItem("atolyekart_jwt")` okunur, istek `Authorization: Bearer <token>` header'ıyla gönderilir.
   - Yanıt `401` ise: `/api/token`'dan yeni bir token alınıp `localStorage`'a yazılır, istek bu yeni token'la **bir kez daha** denenir.
   - Diğer hatalarda (ağ hatası vb.) mevcut davranış korunur: hata yutulur, konsola loglanır, çağıran kod her zaman "gönderildi" varsayar.
3. **Kapsam:** `OrderForm` ve `StockNotifyForm` ayrı ayrı değiştirilmez — ikisi de zaten ortak `sendToWebhook` yardımcısını kullandığı için otomatik olarak korunur altına girer.

## Veri Akışı (özet)
```
Sayfa açılır → localStorage'da token yok → GET /api/token → token localStorage'a yazılır
     ↓ (kullanıcı "Siparişi Onayla" / "Haber Ver" tıklar)
sendToWebhook(payload) → POST /api/webhook  (Authorization: Bearer <token>)
     ↓
api/webhook.js: jwt.verify → geçerli → WEBHOOK_URL'e forward → 200
                            → geçersiz/401 → sendToWebhook yeni token alır → 1 kez retry
```

## Test Planı
- `vercel dev` ile yerelde: `/api/token` çağrısının geçerli bir JWT döndürdüğü doğrulanır.
- Token'sız / bozuk token ile `/api/webhook`'a istek atılıp `401` döndüğü doğrulanır.
- Geçerli token ile istek atılıp mevcut davranışın (webhook.site'a forward, `200`) değişmediği doğrulanır.
- Tarayıcıda uçtan uca: sayfa ilk açıldığında `localStorage`'da token oluştuğu, "Siparişi Onayla" ve "Haber Ver" akışlarının UI'da hiçbir görünür değişiklik olmadan çalışmaya devam ettiği doğrulanır.
