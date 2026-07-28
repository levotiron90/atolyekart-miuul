# Lather & Lull React Katalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `index.html`'i, kurulum gerektirmeyen (npm'siz) tek dosyalık bir React sayfasına dönüştürmek; `ProductImage`, `ProductCard`, `ProductList` bileşenleriyle, yeni bir kart tasarımı ve gerçek/telifsiz ürün görselleriyle.

**Architecture:** Tek `index.html` dosyası. `<head>`'te CDN'den `react@18`, `react-dom@18`, `@babel/standalone` yüklenir. `<body>`'de tek bir `<script type="text/babel">` bloğu içinde `PRODUCTS` veri dizisi ve üç bileşen tanımlanır, `ReactDOM.createRoot` ile mount edilir.

**Tech Stack:** React 18 (UMD, CDN), Babel Standalone (CDN, in-browser JSX derleme), düz CSS (`<style>` içinde, harici dosya yok). Build aracı, npm, test runner yok.

## Global Constraints

- Tek dosya: her şey `index.html` içinde (CSS + JSX dahil). Ayrı `.js`/`.css` dosyası yok.
- npm/yarn kurulumu yok — sadece CDN `<script>` etiketleri.
- Ürün verisi (`PRODUCTS` dizisi) spec'te tanımlı isim/açıklama/fiyat metinleriyle birebir aynı kalmalı, değiştirilmemeli.
- Görseller: `https://loremflickr.com/640/400/<keyword>` üzerinden gerçek/CC fotoğraf; ağ hatasında `onError` ile renkli fallback'e düşülmeli.
- Light/dark tema CSS değişkenleri (`--bg`, `--surface`, `--accent`, vb.) korunmalı.
- Otomatik test framework'ü yok; her görevin doğrulaması dosyayı tarayıcıda açıp gözle kontroldür (bu proje türü için normal — spec'te de belirtildi).
- Bu dizin git deposu değil; plandaki adımlarda "commit" yerine "dosyayı kaydet" kullanılır.

---

### Task 1: CDN iskeleti + veri modeli + App kabuğu

**Files:**
- Modify: `index.html` (tamamen yeniden yazılacak)

**Interfaces:**
- Produces: `PRODUCTS` (global const, `{name, description, price, priceNote, imageKeyword, alt}[]`), `App` bileşeni (root'a mount edilir)

- [ ] **Step 1: `index.html`'in `<head>` bölümünü CDN script'leriyle kur**

`<head>` içine, mevcut `<title>` ve `<style>` bloğundan önce ekle:

```html
<script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script crossorigin src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
```

- [ ] **Step 2: `<body>`'i `<div id="root"></div>` + `<script type="text/babel">` iskeletiyle değiştir**

Mevcut statik `<header>`, `<main>`, `<footer>` markup'ını kaldır, yerine:

```html
<body>
<div id="root"></div>
<script type="text/babel">

const PRODUCTS = [
  {
    name: "Soğuk Proses Kalıp Sabun",
    description: "Zeytinyağı ve hindistan cevizi yağı gibi doğal sabit yağlarla geleneksel yöntemle üretilir, 4-6 hafta kürlenir. Lavanta, aktif karbon veya pembe kil gibi doğal katkılarla zenginleştirilir.",
    price: "₺150",
    priceNote: "örnek fiyat",
    imageKeyword: "soap,natural",
    alt: "Doğal soğuk proses kalıp sabun",
  },
  {
    name: "Katı Şampuan Barı",
    description: "Susuz ve plastiksiz formüle edilmiş konsantre şampuan. Bitkisel surfaktanlar, argan/jojoba yağı ve keratin ile saçınızı besler; kürlenme beklemeden kullanıma hazırdır.",
    price: "₺120",
    priceNote: "örnek fiyat",
    imageKeyword: "shampoo,spa",
    alt: "Katı şampuan barı",
  },
  {
    name: "Aromaterapik Duş Tableti",
    description: "Okaliptüs, mentol ve nane yağlarıyla hazırlanan duş tableti, sıcak suyla temas ettiğinde eriyerek duşunuzu bir buhar terapisi seansına dönüştürür.",
    price: "₺90",
    priceNote: "örnek fiyat",
    imageKeyword: "spa,steam",
    alt: "Aromaterapik duş tableti",
  },
];

function App() {
  return (
    <React.Fragment>
      <header>
        <h1>Lather & Lull</h1>
        <p>Doğaya sadık, cildinize nazik. Plastiksiz ve kimyasalsız el yapımı bakım ürünleriyle günlük rutininizi sakin bir ritüele dönüştürüyoruz.</p>
      </header>
      <main>
        <div className="category-label">Doğal Bakım Ürünleri</div>
        <div className="grid" id="product-grid-placeholder" />
      </main>
      <footer>&copy; 2026 Lather &amp; Lull — Doğal &amp; Sürdürülebilir Bakım</footer>
    </React.Fragment>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

</script>
</body>
```

- [ ] **Step 3: Dosyayı tarayıcıda açıp doğrula**

`index.html`'e çift tıkla (veya mevcut tarayıcı sekmesini yenile). Beklenen: "Lather & Lull" başlığı, alt metin, "Doğal Bakım Ürünleri" etiketi ve footer görünür; konsolda kırmızı hata yok (F12 > Console).

- [ ] **Step 4: Dosyayı kaydet**

Bu adımda git yok — dosya zaten diske kaydedilmiş durumda, ek işlem gerekmiyor.

---

### Task 2: `ProductImage` ve `ProductCard` bileşenleri (yeni kart tasarımı)

**Files:**
- Modify: `index.html` (`<style>` bloğu ve `<script type="text/babel">` bloğu)

**Interfaces:**
- Consumes: `PRODUCTS` öğe şekli (Task 1) — `{name, description, price, priceNote, imageKeyword, alt}`
- Produces: `ProductImage({ imageKeyword, alt })`, `ProductCard({ product })` — Task 3'te `ProductList` tarafından kullanılacak

- [ ] **Step 1: `<style>` bloğuna yeni kart tasarımı kurallarını ekle**

Mevcut `.card` kuralını şu şekilde güncelle (eski `.card`, `.price-row` kurallarının yerine):

```css
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.12);
}
.card-media {
  position: relative;
  aspect-ratio: 16 / 10;
  overflow: hidden;
}
.card-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;
}
.card:hover .card-media img {
  transform: scale(1.03);
}
.card-media-fallback {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--accent-soft), var(--accent));
}
.price-badge {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: var(--surface);
  color: var(--price-badge);
  font-weight: 700;
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  font-size: 0.9rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.price-badge .price-note {
  display: block;
  font-size: 0.65rem;
  font-weight: 400;
  font-style: italic;
  color: var(--muted);
}
.card-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.card-body h2 {
  margin: 0;
  font-size: 1.25rem;
}
.card-body p {
  margin: 0;
  color: var(--muted);
  font-size: 0.95rem;
}
```

- [ ] **Step 2: `ProductImage` bileşenini `<script type="text/babel">` içine, `App` fonksiyonundan önce ekle**

```jsx
function ProductImage({ imageKeyword, alt }) {
  const [failed, setFailed] = React.useState(false);
  if (failed) {
    return <div className="card-media-fallback" role="img" aria-label={alt} />;
  }
  return (
    <img
      src={`https://loremflickr.com/640/400/${imageKeyword}`}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
```

- [ ] **Step 3: `ProductCard` bileşenini `ProductImage`'dan sonra ekle**

```jsx
function ProductCard({ product }) {
  return (
    <div className="card">
      <div className="card-media">
        <ProductImage imageKeyword={product.imageKeyword} alt={product.alt} />
        <div className="price-badge">
          {product.price}
          <span className="price-note">{product.priceNote}</span>
        </div>
      </div>
      <div className="card-body">
        <h2>{product.name}</h2>
        <p>{product.description}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Geçici olarak `App` içinde tek bir kartı render edip doğrula**

`#product-grid-placeholder` `div`'ini geçici olarak şu şekilde değiştir:

```jsx
<div className="grid">
  <ProductCard product={PRODUCTS[0]} />
</div>
```

`index.html`'i tarayıcıda yenile. Beklenen: tek bir kart görünür — üstte 16:10 oranlı görsel (veya gradient fallback), sağ üst köşede "₺150 / örnek fiyat" rozeti, altında "Soğuk Proses Kalıp Sabun" başlığı ve açıklaması. Karta mouse ile üzerine gelince kart yukarı kalkmalı ve görsel hafif büyümeli.

- [ ] **Step 5: Dosyayı kaydet**

Git yok, ek işlem gerekmiyor.

---

### Task 3: `ProductList` ile tam entegrasyon

**Files:**
- Modify: `index.html` (`<script type="text/babel">` bloğu)

**Interfaces:**
- Consumes: `ProductCard({ product })` (Task 2), `PRODUCTS` (Task 1)
- Produces: `ProductList({ products })` — `App` tarafından kullanılır

- [ ] **Step 1: `ProductList` bileşenini `ProductCard`'dan sonra, `App`'ten önce ekle**

```jsx
function ProductList({ products }) {
  return (
    <div className="grid">
      {products.map((product) => (
        <ProductCard key={product.name} product={product} />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: `App` içindeki geçici tek-kart render'ını `ProductList` ile değiştir**

Task 2 Step 4'te eklenen geçici bloğu kaldır, `<main>` içeriğini şuna güncelle:

```jsx
<main>
  <div className="category-label">Doğal Bakım Ürünleri</div>
  <ProductList products={PRODUCTS} />
</main>
```

- [ ] **Step 3: Tam sayfayı tarayıcıda doğrula**

`index.html`'i yenile. Beklenen: 3 kart da (Soğuk Proses Kalıp Sabun / ₺150, Katı Şampuan Barı / ₺120, Aromaterapik Duş Tableti / ₺90) responsive grid içinde görünür, her birinde ilgili anahtar kelimeye uygun bir fotoğraf (veya ağ yoksa gradient fallback) yüklenir, hover efekti çalışır. F12 > Console'da kırmızı hata olmamalı. İşletim sistemi/tarayıcı karanlık modunu değiştirip renk şemasının bozulmadığını kontrol et.

- [ ] **Step 4: Dosyayı kaydet**

Git yok, ek işlem gerekmiyor. İş tamamlandı.
