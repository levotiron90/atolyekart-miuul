---
name: atolyekart-conventions
description: Use when adding, editing, or reviewing React components, product/variant data, or "Sipariş Ver" / "Stok Bildirimi İste" webhook integrations in the AtölyeKart (Lather & Lull) catalog project.
---

# AtölyeKart Proje Kuralları

## Genel Bakış
AtölyeKart, build aracı olmadan (npm/node_modules yok) tek bir `index.html` içinde CDN React + Babel Standalone ile çalışan bir ürün kataloğudur. Bu skill, yeni bileşen eklerken ve sipariş/stok-bildirimi webhook'larını bağlarken uyulması gereken kuralları tanımlar.

## Bileşen Kuralları

1. **Tek dosya**: Her bileşen `index.html` içindeki tek `<script type="text/babel">` bloğunda tanımlanır. Bileşen başına ayrı `.jsx`/`.css`/`index.js` dosyaları açılmaz — stil de aynı dosyadaki `<style>` bloğunda kalır.
2. **Fonksiyon bileşeni**: Tüm bileşenler fonksiyon bileşenidir (`function Foo() {...}`). Class component kullanılmaz. State için `React.useState`/`useEffect` kullanılır.
3. **Demo veri konumu**: Ürün/varyant verisi `src/data/card.js` dosyasında, düz bir `<script>` ile (ES module/import olmadan) tanımlanır ve global bir sabit olarak dışa verilir:
   ```js
   // src/data/card.js
   const CARD_DATA = [ /* ürün + variants dizisi */ ];
   ```
   `index.html`, bu dosyayı Babel script'inden **önce** `<script src="src/data/card.js"></script>` ile yükler; React kodu veriyi `fetch` ile değil doğrudan `CARD_DATA` global'inden okur.
4. **Stok durumu**: Ürün/varyant verisinde (`card.js`) tutulmaz — ayrı bir `src/data/stock.js` dosyasında, `productId` → `true/false` eşlemesi olarak tutulur:
   ```js
   // src/data/stock.js
   const STOCK = { "<ürün-slug>_<varyant-slug>": true /* veya false */, ... };
   ```
   `index.html`, bu dosyayı `card.js`'ten hemen sonra, Babel script'inden **önce** `<script src="src/data/stock.js"></script>` ile yükler. `ProductCard` stok durumunu `STOCK[productId] !== false` ile okur (anahtar eksikse varsayılan olarak stokta kabul edilir). Atölye sahibi bir ürünün stok durumunu değiştirmek için sadece bu dosyadaki ilgili satırı `true`/`false` yapar — başka hiçbir dosyaya dokunmaz.
   `inStock: true` → kartta "Sipariş Ver" butonu/formu gösterilir; `inStock: false` → görselde "Tükendi" rozeti + "Stok Bildirimi İste" butonu/formu gösterilir. İki eylem asla aynı anda gösterilmez.
5. **Webhook gönderim yardımcıları**: `WEBHOOK_URL` sabiti, `slugify`/`getProductId` ve `sendToWebhook` yardımcı fonksiyonları `index.html`'in Babel script bloğunun başında tanımlıdır ve tüm form bileşenleri bunları kullanır. `sendToWebhook`, isteği `mode: "no-cors"` + `text/plain` içerik tipiyle gönderir (çoğu webhook hedefi tarayıcıdan gelen `application/json` isteklerinde CORS preflight'ı reddeder — bkz. Yaygın Hatalar). `fetch` başarısız olsa bile hatayı yutar ve payload'ı konsola loglar — çağıran kod her zaman "gönderildi" varsayıp onay mesajını gösterebilir.

## Webhook Veri Sözleşmesi

İki eylem webhook'a POST edilir: **Sipariş Ver** ve **Stok Bildirimi İste**. Payload'lar **düzdür** (nested `customer`/`items` nesnesi yok) — alanlar doğrudan kök seviyede yer alır. `productId`, ürün+varyant kombinasyonunu tekil biçimde tanımlayan kebab-case bir slug'dır: `<ürün-slug>_<varyant-slug>` (Türkçe karakterler ASCII'ye çevrilir, boşluk `-` olur).

### Sipariş Ver → `order.created`
Alanlar: `event`, `name`, `productId`, `productName`, `phone`, `email`, `quantity`, `source`.
```json
{
  "event": "order.created",
  "name": "Ayşe Yılmaz",
  "productId": "kati-sampuan-bari_argan-keratin",
  "productName": "Katı Şampuan Barı — Argan & Keratin",
  "phone": "+90 555 000 00 00",
  "email": "ayse@example.com",
  "quantity": 1,
  "source": "atolyekart-web"
}
```
- Tüm alanlar zorunludur; `quantity` ≥ 1 tamsayı.
- `productName`, ürün adı + " — " + varyant adı birleşimidir (bkz. örnek).
- `source`: isteğin geldiği yeri sabitler — katalog sayfası için her zaman `"atolyekart-web"`.

### Stok Bildirimi İste → `stock_notification.requested`
Alanlar: `event`, `name`, `productId`, `productName`, `email`, `source` (sipariş alanlarıyla aynı isimlendirme, sadece `phone` ve `quantity` yok).
```json
{
  "event": "stock_notification.requested",
  "name": "Ayşe Yılmaz",
  "productId": "aromaterapik-dus-tableti_lavanta-ylang-ylang",
  "productName": "Aromaterapik Duş Tableti — Lavanta & Ylang Ylang",
  "email": "ayse@example.com",
  "source": "atolyekart-web"
}
```
- Tüm alanlar zorunludur (telefon/miktar bu payload'da yoktur).

## Hızlı Referans

| Konu | Kural |
|---|---|
| Bileşen dosyası | Hepsi `index.html` içinde, tek `<script type="text/babel">` |
| Bileşen tipi | Sadece fonksiyon bileşeni |
| Veri konumu | `src/data/card.js` → global `CARD_DATA` |
| Stok konumu | `src/data/stock.js` → global `STOCK` (`productId` → `true/false`) |
| Webhook isteği modu | `fetch(..., { mode: "no-cors", headers: { "Content-Type": "text/plain;charset=UTF-8" } })` |
| Stokta → gösterilen aksiyon | "Sipariş Ver" (OrderForm) |
| Tükendi → gösterilen aksiyon | "Stok Bildirimi İste" (StockNotifyForm) + "Tükendi" rozeti |
| Sipariş event adı | `order.created` |
| Stok bildirimi event adı | `stock_notification.requested` |
| Sipariş alanları (hepsi zorunlu) | `event, name, productId, productName, phone, email, quantity, source` |
| Stok bildirimi alanları (hepsi zorunlu) | `event, name, productId, productName, email, source` |
| `productId` formatı | `<ürün-slug>_<varyant-slug>` (kebab-case, ASCII) |
| `source` değeri | Katalog sayfası için sabit: `"atolyekart-web"` |

## Yaygın Hatalar
- Yeni bir bileşeni ayrı `.jsx` dosyasına taşımak → **yapma**, `index.html` içinde kalmalı.
- Payload'ı `customer`/`items` gibi iç içe (nested) nesnelerle göndermek → **yanlış**, tüm alanlar payload'ın kök seviyesinde düz olmalı.
- Stok bildirimi payload'ına `phone` veya `quantity` eklemek → **yanlış**, bu alanlar sadece sipariş payload'ındadır.
- `products.json`'a geri dönmek veya yeni veri dosyasını `.json` yapmak → **yapma**, veri `src/data/card.js` içinde düz JS sabiti olarak kalmalı (fetch değil, doğrudan script include).
- Stok bilgisini tekrar `card.js`'e taşımak veya `variant.inStock` alanına dönmek → **yapma**, stok durumu tek kaynak olarak `src/data/stock.js`'teki `STOCK` haritasından okunur.
- `sendToWebhook`'ta `fetch`'i `Content-Type: application/json` + `mode` belirtmeden (varsayılan `cors`) çağırmak → **yapma**, hedef adres CORS başlığı döndürmüyorsa (webhook.site dahil çoğu servis) istek sessizce engellenir; `mode: "no-cors"` + `text/plain` kullan.
