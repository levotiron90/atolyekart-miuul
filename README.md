# Lather & Lull — AtölyeKart

Doğal ve sürdürülebilir el yapımı kişisel bakım ürünleri satan bir atölyenin dijital kataloğu.

🔗 **Canlı demo:** https://levotiron90.github.io/atolyekart-miuul/

## Özellikler

- **Ürün kataloğu** — 3 ana ürün, her biri 3 çeşit (varyant) seçeneğiyle:
  - Soğuk Proses Kalıp Sabun
  - Katı Şampuan Barı
  - Aromaterapik Duş Tableti
- **Çeşit seçimi** — her ürün kartında açılır menüden çeşit seçilir; fiyat, açıklama ve etiketler seçime göre anlık güncellenir.
- **Sipariş Ver** — stoktaki bir çeşit için ad, e-posta, telefon ve adet bilgisiyle sipariş formu; webhook'a gönderilir.
- **Stok Bildirimi İste** — tükenmiş bir çeşit için ad + e-posta formu; ürün stoğa girdiğinde haber verilmek üzere webhook'a gönderilir.
- **QR kod** — sayfanın kendi (canlı) adresini kodlar, telefonla hızlı erişim için footer'da yer alır.

## Teknoloji

Build aracı yok — `npm`, `node_modules`, derleme adımı bulunmuyor. Tek bir `index.html` dosyası, React ve Babel Standalone'u doğrudan CDN üzerinden yükleyip tarayıcıda JSX'i anında derler.

## Proje Yapısı

```
index.html          Tüm bileşenler, stiller ve uygulama mantığı
src/data/card.js     Ürün/varyant verisi (isim, açıklama, fiyat, etiketler)
src/data/stock.js    Stok durumu (productId → true/false)
CLAUDE.md            Atölye ve ürün bağlamı
.claude/skills/      Proje kuralları (bileşen ve webhook sözleşmesi)
```

## Yerelde Çalıştırma

Build adımı gerekmediği için herhangi bir statik dosya sunucusu yeterli:

```bash
python -m http.server 8765
```

Sonra `http://localhost:8765/index.html` adresini açın. (`fetch` kullanılmadığından `file://` ile doğrudan açmak da çalışır.)

## Stok Durumunu Güncelleme

Bir ürün tükendiğinde veya stoğa girdiğinde `src/data/stock.js` dosyasındaki ilgili satırı `true`/`false` yapıp kaydetmeniz yeterli — başka hiçbir dosyaya dokunmanız gerekmez.

## Webhook Veri Sözleşmesi

Detaylar için `.claude/skills/atolyekart-conventions/SKILL.md` dosyasına bakın. Özet:

- **Sipariş Ver** → `event: "order.created"` — `name, productId, productName, phone, email, quantity, source`
- **Stok Bildirimi İste** → `event: "stock_notification.requested"` — `name, productId, productName, email, source`
