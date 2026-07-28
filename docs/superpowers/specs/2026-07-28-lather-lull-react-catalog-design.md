# Lather & Lull — React Katalog Sayfası Tasarımı

**Tarih:** 2026-07-28

## Amaç
Mevcut statik `index.html` tanıtım sayfasını, kurulum gerektirmeyen (npm'siz), tek dosyada CDN script'leriyle çalışan bir React sayfasına dönüştürmek. Bileşenler: `ProductCard`, `ProductList`, `ProductImage`.

## Mimari
Tek `index.html` dosyası. `<head>` içinde CDN üzerinden `react`, `react-dom` ve `@babel/standalone` script'leri yüklenir. `<body>` içindeki tek bir `<script type="text/babel">` bloğunda JSX yazılır ve tarayıcıda anında derlenir. Build adımı, `node_modules`, `package.json` yoktur.

## Veri Modeli (değişmez)
```js
const PRODUCTS = [
  {
    name: "Soğuk Proses Kalıp Sabun",
    description: "...", // mevcut kısa açıklama
    price: "₺150",
    priceNote: "örnek fiyat",
    imageKeyword: "soap,natural",
    alt: "Doğal soğuk proses sabun",
  },
  // Katı Şampuan Barı, Aromaterapik Duş Tableti — aynı şekil
];
```
Bu dizi tek doğruluk kaynağıdır; isim/açıklama/fiyat metinleri mevcut CLAUDE.md ve index.html içeriğiyle birebir aynı kalır.

## Bileşenler
- **`ProductImage({ imageKeyword, alt })`** — `https://loremflickr.com/640/400/${imageKeyword}` üzerinden gerçek, telifsiz/CC bir stok fotoğraf çeker. `loading="lazy"`, `onError` ile yumuşak renkli bir fallback bloğuna düşer (kırık resim ikonu asla görünmez).
- **`ProductCard({ product })`** — kartın kendisi: üstte tam genişlikte `ProductImage` (16:10 oran, üst köşeleri yuvarlak), görselin sağ-üst köşesinde yüzen fiyat rozeti (`price` + `priceNote`), altında ürün adı ve açıklama. Hover'da kart hafif yukarı kalkar + gölge artar, görsel hafifçe (scale 1.03) yakınlaşır.
- **`ProductList({ products })`** — `products.map(...)` ile her ürün için bir `ProductCard` render eder, mevcut responsive grid düzeninde (`auto-fit, minmax(260px, 1fr)`).
- **`App()`** — header (başlık + marka açıklaması), kategori etiketi ("Doğal Bakım Ürünleri"), `<ProductList products={PRODUCTS} />`, footer. `ReactDOM.createRoot(document.getElementById("root")).render(<App />)` ile mount edilir.

## Stil
Mevcut light/dark CSS değişkenleri (`--bg`, `--surface`, `--accent` vb.) korunur. Kart tasarımı yenilenir: görsel-üstte-metin-altta düzeni, yüzen fiyat rozeti, hover geçişleri (`transition: transform, box-shadow`). Tüm CSS aynı dosya içinde `<style>` bloğunda kalır (harici stylesheet yok).

## Hata Durumu
`ProductImage` içindeki `onError` handler, `<img>` etiketini gizleyip yerine markaya uygun renkli bir gradient blok gösterir — ağ hatası veya kaynak bulunamazsa sayfa bozuk görünmez.

## Test / Doğrulama
Otomatik test yok (build aracı olmadığından). Doğrulama: dosya tarayıcıda açılıp (a) 3 kartın da göründüğü, (b) görsellerin yüklendiği veya fallback'in çalıştığı, (c) hover efektinin çalıştığı, (d) light/dark modun bozulmadığı gözle kontrol edilir.

## Kapsam Dışı
- Sepete ekleme, filtreleme, arama gibi etkileşimli katalog özellikleri
- Gerçek ödeme/fiyat entegrasyonu (fiyatlar hâlâ geçici/örnek)
- Ayrı CSS/JS dosyalarına bölme (tek dosya kısıtı gereği hepsi index.html içinde)
