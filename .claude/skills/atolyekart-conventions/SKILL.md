---
name: atolyekart-conventions
description: Use when adding, editing, or reviewing React components, product/variant data, or "Sipariş Ver" / "Stok Bildirimi İste" webhook integrations in the AtölyeKart (Lather & Lull) catalog project.
---

# AtölyeKart Proje Kuralları

## Genel Bakış
AtölyeKart, build aracı olmadan (npm/node_modules yok) çalışan bir ürün kataloğudur. `index.html`, tek satırlık bir `<meta http-equiv="refresh">` yönlendirmesinden ibarettir — asıl uygulama **`react.html`** dosyasında, CDN React + Babel Standalone ile yazılıdır. Bu skill, yeni bileşen eklerken ve sipariş/stok-bildirimi webhook'larını bağlarken uyulması gereken kuralları tanımlar.

## Bileşen Kuralları

0. **Dosya ayrımı**: `index.html` sadece `react.html`'e yönlendiren statik bir giriş sayfasıdır, içine bileşen/mantık eklenmez. Tüm gerçek geliştirme **`react.html`** üzerinde yapılır.
1. **Tek dosya**: Her bileşen `react.html` içindeki tek `<script type="text/babel">` bloğunda tanımlanır. Bileşen başına ayrı `.jsx`/`.css`/`index.js` dosyaları açılmaz — stil de aynı dosyadaki `<style>` bloğunda kalır.
2. **Fonksiyon bileşeni**: Tüm bileşenler fonksiyon bileşenidir (`function Foo() {...}`). Class component kullanılmaz. State için `React.useState`/`useEffect` kullanılır.
3. **Demo veri konumu**: Ürün/varyant verisi `src/data/card.js` dosyasında, düz bir `<script>` ile (ES module/import olmadan) tanımlanır ve global bir sabit olarak dışa verilir:
   ```js
   // src/data/card.js
   const CARD_DATA = [ /* ürün + variants dizisi */ ];
   ```
   `react.html`, bu dosyayı Babel script'inden **önce** `<script src="src/data/card.js"></script>` ile yükler; React kodu veriyi `fetch` ile değil doğrudan `CARD_DATA` global'inden okur.
4. **Stok durumu**: Ürün/varyant verisinde (`card.js`) tutulmaz — ayrı bir `src/data/stock.js` dosyasında, `productId` → `true/false` eşlemesi olarak tutulur:
   ```js
   // src/data/stock.js
   const STOCK = { "<ürün-slug>_<varyant-slug>": true /* veya false */, ... };
   ```
   `react.html`, bu dosyayı `card.js`'ten hemen sonra, Babel script'inden **önce** `<script src="src/data/stock.js"></script>` ile yükler. `ProductCard` stok durumunu `STOCK[productId] !== false` ile okur (anahtar eksikse varsayılan olarak stokta kabul edilir). Atölye sahibi bir ürünün stok durumunu değiştirmek için sadece bu dosyadaki ilgili satırı `true`/`false` yapar — başka hiçbir dosyaya dokunmaz.
   `inStock: true` → kartta "Sipariş Ver" butonu/formu gösterilir; `inStock: false` → görselde "Tükendi" rozeti + "Stok Bildirimi İste" butonu/formu gösterilir. İki eylem asla aynı anda gösterilmez.
5. **Webhook gönderim yardımcıları**: `slugify`/`getProductId`, `fetchAuthToken` ve `sendToWebhook` yardımcı fonksiyonları `react.html`'in Babel script bloğunun başında tanımlıdır ve tüm form bileşenleri `sendToWebhook`'u kullanır. Gerçek webhook adresi (`WEBHOOK_URL`) artık istemci kodunda YOKTUR — sadece `api/webhook.js` serverless fonksiyonunda, `process.env.WEBHOOK_URL` olarak sunucu tarafında okunur. `sendToWebhook`, aynı origin'deki `/api/webhook`'a normal bir `application/json` isteği gönderir (aynı origin olduğu için CORS sorunu yaşanmaz, `no-cors`/`text-plain` gerekmez) ve isteğe anonim bir JWT'yi `Authorization: Bearer <token>` header'ı olarak ekler (token `api/token.js`'ten alınır, `localStorage["atolyekart_jwt"]`'de saklanır — bkz. `fetchAuthToken`). `api/webhook.js` bu header'ı doğrulamadan isteği reddeder (401); ayrıca IP başına dakikada 10 isteklik bir rate limit uygular (429). `sendToWebhook` artık `true`/`false` döner: `false` durumunda (429, doğrulama hatası, ağ hatası) çağıran form bileşeni kullanıcıya başarı yerine bir hata mesajı gösterir — "her zaman gönderildi varsay" davranışı artık geçerli değildir.

## Webhook Veri Sözleşmesi

İki eylem webhook'a POST edilir: **Sipariş Ver** ve **Stok Bildirimi İste**. Payload'lar **düzdür** (nested `customer`/`items` nesnesi yok) — alanlar doğrudan kök seviyede yer alır. `productId`, ürün+varyant kombinasyonunu tekil biçimde tanımlayan kebab-case bir slug'dır: `<ürün-slug>_<varyant-slug>` (Türkçe karakterler ASCII'ye çevrilir, boşluk `-` olur).

### Sipariş Ver → `order.created`
Alanlar: `event`, `name`, `productId`, `productName`, `phone`, `email`, `quantity`, `source`, `kvkkConsent`, `consentAt`, `policyVersion`.
```json
{
  "event": "order.created",
  "name": "Ayşe Yılmaz",
  "productId": "kati-sampuan-bari_argan-keratin",
  "productName": "Katı Şampuan Barı — Argan & Keratin",
  "phone": "+90 555 000 00 00",
  "email": "ayse@example.com",
  "quantity": 1,
  "source": "atolyekart-web",
  "kvkkConsent": true,
  "consentAt": "2026-08-02T21:00:00.000Z",
  "policyVersion": "2026-08-02"
}
```
- Tüm alanlar zorunludur; `quantity` ≥ 1 tamsayı.
- `productName`, ürün adı + " — " + varyant adı birleşimidir (bkz. örnek).
- `source`: isteğin geldiği yeri sabitler — katalog sayfası için her zaman `"atolyekart-web"`.
- `kvkkConsent`/`consentAt`/`policyVersion`: kullanıcının KVKK onay kutusunu işaretlediğinin kaydı — form, kutu işaretlenmeden gönderilemez (bkz. `consent-field`), bu yüzden `kvkkConsent` her zaman `true`'dur.

### Stok Bildirimi İste → `stock_notification.requested`
Alanlar: `event`, `name`, `productId`, `productName`, `email`, `source`, `kvkkConsent`, `consentAt`, `policyVersion` (sipariş alanlarıyla aynı isimlendirme, sadece `phone` ve `quantity` yok).
```json
{
  "event": "stock_notification.requested",
  "name": "Ayşe Yılmaz",
  "productId": "aromaterapik-dus-tableti_lavanta-ylang-ylang",
  "productName": "Aromaterapik Duş Tableti — Lavanta & Ylang Ylang",
  "email": "ayse@example.com",
  "source": "atolyekart-web",
  "kvkkConsent": true,
  "consentAt": "2026-08-02T21:00:00.000Z",
  "policyVersion": "2026-08-02"
}
```
- Tüm alanlar zorunludur (telefon/miktar bu payload'da yoktur).

## Hızlı Referans

| Konu | Kural |
|---|---|
| Ana uygulama dosyası | `react.html` (index.html sadece yönlendirme) |
| Bileşen dosyası | Hepsi `react.html` içinde, tek `<script type="text/babel">` |
| Bileşen tipi | Sadece fonksiyon bileşeni |
| Veri konumu | `src/data/card.js` → global `CARD_DATA` |
| Stok konumu | `src/data/stock.js` → global `STOCK` (`productId` → `true/false`) |
| Webhook isteği modu | `fetch("/api/webhook", { headers: { "Content-Type": "application/json", Authorization: "Bearer <jwt>" } })` — gerçek `WEBHOOK_URL`'e sunucu tarafında (`api/webhook.js`) iletilir |
| Stokta → gösterilen aksiyon | "Sipariş Ver" (OrderForm) |
| Tükendi → gösterilen aksiyon | "Stok Bildirimi İste" (StockNotifyForm) + "Tükendi" rozeti |
| Sipariş event adı | `order.created` |
| Stok bildirimi event adı | `stock_notification.requested` |
| Sipariş alanları (hepsi zorunlu) | `event, name, productId, productName, phone, email, quantity, source, kvkkConsent, consentAt, policyVersion` |
| Stok bildirimi alanları (hepsi zorunlu) | `event, name, productId, productName, email, source, kvkkConsent, consentAt, policyVersion` |
| `productId` formatı | `<ürün-slug>_<varyant-slug>` (kebab-case, ASCII) |
| `source` değeri | Katalog sayfası için sabit: `"atolyekart-web"` |

## Yaygın Hatalar
- Yeni bir bileşeni ayrı `.jsx` dosyasına taşımak → **yapma**, `react.html` içinde kalmalı.
- `index.html`'e bileşen/mantık eklemek → **yapma**, o dosya sadece `react.html`'e yönlendirir.
- Payload'ı `customer`/`items` gibi iç içe (nested) nesnelerle göndermek → **yanlış**, tüm alanlar payload'ın kök seviyesinde düz olmalı.
- Stok bildirimi payload'ına `phone` veya `quantity` eklemek → **yanlış**, bu alanlar sadece sipariş payload'ındadır.
- `products.json`'a geri dönmek veya yeni veri dosyasını `.json` yapmak → **yapma**, veri `src/data/card.js` içinde düz JS sabiti olarak kalmalı (fetch değil, doğrudan script include).
- Stok bilgisini tekrar `card.js`'e taşımak veya `variant.inStock` alanına dönmek → **yapma**, stok durumu tek kaynak olarak `src/data/stock.js`'teki `STOCK` haritasından okunur.
- `sendToWebhook`'u tekrar doğrudan `WEBHOOK_URL`'e (`mode: "no-cors"` + `text/plain` ile) istek atacak şekilde "düzeltmek" → **yapma**, bu eski bir desendir; istek artık her zaman `/api/webhook` proxy'sine, `Authorization: Bearer <jwt>` header'ıyla ve normal `application/json` içerikle gider. `Authorization` header'ını kaldırmak tüm siparişleri 401 ile başarısız kılar.
- `sendToWebhook`'un dönüş değerini yok saymak → **yapma**, `true`/`false` döner; `false` durumunda çağıran form bileşeni kullanıcıya hata mesajı göstermelidir (`ProductCard`'daki `submitStatus` deseni örnek alınmalı).
