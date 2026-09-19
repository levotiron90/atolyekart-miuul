# Lather & Lull

## Atölye Hakkında
- **Ad:** Lather & Lull
- **Sektör:** Doğal ve sürdürülebilir el yapımı kişisel bakım ürünleri
- **Hedef Kitle:** Çevre bilincine sahip, ürün içeriğini önemseyen, plastiksiz ve kimyasalsız doğal bakım ürünleri arayan tüketiciler
- **Ürün Kategorisi:** Doğal Bakım Ürünleri

## Ürünler

### Soğuk Proses Kalıp Sabun
Zeytinyağı ve hindistan cevizi yağı gibi sabit yağların kostik (sodyum hidroksit) çözeltisiyle saponifikasyon reaksiyonuna sokulmasıyla üretilir. Karışım ahşap veya silikon kalıplara dökülür, kesildikten sonra 4-6 hafta kürlenmeye bırakılır. Lavanta yağı, aktif karbon veya pembe kil gibi doğal katkılarla zenginleştirilebilir.

**Varyasyonlar:**
- **Lavanta & Pembe Kil** (Yatıştırıcı & Hassas Ciltler) — Fransız pembe kili ile cildi nazikçe arındırırken, lavanta uçucu yağı ile kızarıklıkları ve stresi yatıştırır. Günlük yüz ve vücut temizliği için idealdir.
- **Aktif Karbon & Çay Ağacı** (Detoks & Gözenek Arındırıcı) — Aktif hindistan cevizi kömürü ile tıkalı gözenekleri derinlemesine temizler. Çay ağacı yağı sayesinde anti-bakteriyel özellik gösterir; özellikle yağlı ve akneye meyilli ciltler için tasarlanmıştır.
- **Yulaf & Ham Bal** (Hafif Peeling & Kuru Ciltler) — İçeriğindeki öğütülmüş yulaf taneleriyle ölü deriyi nazikçe soyar. Ham bal ve zeytinyağı bazı sayesinde cildi kurumaktan korur, yoğun nem verir.

### Katı Şampuan Barı
Sıvı şampuanların plastiksiz ve susuz formüle edilmiş konsantre halidir. Bitkisel kökenli toz surfaktanlar (örn. SCI), argan/jojoba yağı, keratin ve bitki tozları karıştırılıp el presi veya kalıplarla şekillendirilir. Kürlenme süresi gerektirmez, kuruduğu an kullanıma hazırdır.

**Varyasyonlar:**
- **Argan & Keratin** (Onarıcı & Kuru Saçlar) — Argan yağı ve bitkisel keratin proteini ile zenginleştirilmiştir. Isıl işlem görmüş veya boyalı saç tellerin bağlarını güçlendirir, kabarmayı önler.
- **Biberiye & Isırgan Otu** (Dökülme Karşıtı & Hacim) — Biberiye yağı kan dolaşımını hızlandırarak saç köklerini besler, ısırgan otu ekstraktı ise saçlara hacim kazandırır ve dökülmeyi azaltmaya yardımcı olur.
- **Yeşil Çay & Narenciye** (Yağ Dengeleyici & Arındırıcı) — Yeşil çay tozu ve tatlı portakal/limon kabuğu yağları ile saç derisindeki fazla sebumu dengeler. Saçta gün boyu süren bir ferahlık ve hafiflik bırakır.

### Aromaterapik Duş Tableti
Klasik banyo topunun duş kabinine uygun versiyonudur. Karbonat, sitrik asit (limon tuzu) ve mısır nişastasının, yüksek oranda okaliptüs, mentol veya nane yağlarıyla ıslatılıp kalıplara preslenmesiyle üretilir. Duş zemininde sıcak suyla temas ettikçe erir ve ortama yoğun bir buhar terapisi yayar.

**Varyasyonlar:**
- **Okaliptüs & Nane** (Nefes Açıcı & Canlandırıcı) — Yoğun mentol kristalleri ve okaliptüs yağı içerir. Sıcak duş buharıyla birleştiğinde tıkalı solunum yollarını açar, sabahları zihni anında uyandırır.
- **Lavanta & Ylang Ylang** (Gece / Stres Giderici) — Günün yorgunluğunu atmak ve uykuya geçişi kolaylaştırmak için tasarlanmıştır. Akşam duşunda zihni sakinleştiren tatlı ve çiçeksi bir buhar yayar.
- **Tatlı Portakal & Bergamot** (Mod Yükseltici & Enerji) — Narenciye aromalarıyla neşe ve enerji veren bir atmosfer sunar. Güne pozitif başlama ritüelleri için ideal bir motivasyon kapsülüdür.

Her ürün kategorisi, ziyaretçinin katalogda seçim yapabileceği 3 varyasyon sunar; seçilen varyasyona göre fiyat ve kısa açıklama değişir (bkz. `index.html` / `products.json`).

## Kullanım Senaryosu / Proje Kapsamı
Bu proje, yukarıdaki üç ürünü tanıtan ve satan bir dijital katalog/mağaza deneyimi geliştirmeyi hedefler. Temel senaryo:

1. **Ziyaretçi ürün kataloğuna bakar** — tüm ürünleri, açıklamalarını ve (ileride eklenecek) fiyatlarını inceler.
2. **Ziyaretçi sipariş verir** — beğendiği ürün(ler) için sipariş oluşturur.
3. **Stok bildirimi talep eder** — istediği ürün stokta yoksa (tükenmişse), ürün tekrar stoğa girdiğinde haberdar olmak ister ("bana haber ver" / stok bildirimi talebi).

## Teknik Mimari (Güncel Durum)

Proje artık uçtan uca çalışır durumda: web ve mobilde canlı, sipariş/stok/chatbot akışları n8n üzerinden işliyor.

### Web ve Mobil
- **Web:** `react.html` (React SPA) + Vercel serverless fonksiyonları (`api/chat.js`, `api/webhook.js`, `api/token.js`). Canlı adres: Vercel (proje: `atolyekart`, GitHub reposu `ders4` branch'inden otomatik deploy).
- **Mobil:** `mobile/` altında Expo (React Native) portu. Aynı backend (Vercel API + n8n) ile konuşur.
- Webhook çağrıları JWT ile korunur (`/api/token` → kısa ömürlü token, `/api/webhook`'a `Authorization: Bearer` ile iletilir).

### Sipariş ve Stok Bildirimi Akışı
1. Ziyaretçi sipariş verir veya stok bildirimi ister → `api/webhook.js` isteği doğrular (JWT, KVKK onayı, alan uzunlukları, izinli ürün ID'si) ve temiz bir payload olarak n8n'e forward eder.
2. n8n workflow'u **"AtöyleKart_webhook"**, gelen `event` alanına göre (`order.created` / `stock_notification.requested`) dallanır ve satırı bir Google Sheet'e ekler.
3. Bu akışın execution geçmişi n8n REST API ile sorgulanabilir (bkz. "n8n API ile Operasyonel Sorgular").

### SSS Chatbot (RAG + Redis + MCP)
- Workflow: **"AtolyeKart - SSS Chatbot"**. Ziyaretçi mesajı `api/chat.js` üzerinden n8n'in chat webhook'una gider.
- **Dil modeli:** OpenRouter üzerinden ücretsiz bir model (`deepseek/deepseek-v4-flash:free`) — maliyetsiz ama paylaşımlı/kuyruklu olduğu için yanıt süresi değişken (birkaç saniye ile ~2 dakika arası).
- **Konuşma hafızası:** Redis (Docker container, `Redis Chat Memory` node) — ziyaretçi bazlı, session ID `localStorage`'da (`atolyekart_chat_session`) tutulur, TTL=0 (süresiz), pencere uzunluğu son 5 mesaj.
- **Ürün bilgisi (RAG):** `urun_bilgi_arama` node'u (in-memory Vector Store, Ollama `nomic-embed-text` embedding). Kaynak dokümanlar (ürün bilgi PDF'i + kargo/iade PDF'i) **"AtolyeKart - RAG Indeksleme"** workflow'u ile parçalanıp (chunk size 1500, overlap 200) indekslenir. Arama sırasında en alakalı 10 parça (topK=10) modele veriliyor.
  - ⚠️ Bu vector store **in-memory**'dir: n8n container restart olduğunda sıfırlanır, dokümanların forma tekrar yüklenmesi gerekir (form URL: `On form submission` node'unun test/production linki).
  - ⚠️ Bilinen sınırlama: ücretsiz/yerel embedding modeli bazen çok benzer ürünleri (aynı kategori, yakın fiyat) tam ayırt edemiyor; nadiren yanlış ürünün fiyatını karıştırabiliyor. Hız (düşük topK) ile doğruluk (yüksek topK) arasında ödünleşim var; şu an doğruluk öncelikli ayardayız.
- **MCP:** Aynı workflow'daki `MCP Server Trigger` node'u, `urun_bilgi_arama` tool'unu dışarıya MCP protokolüyle (Streamable HTTP/SSE) açar. Test endpoint: `http://localhost:5678/mcp-test/<path>`, production: `http://localhost:5678/mcp/<path>`.
- Chatbot'un sistem promptu, "aynı ürün mü yeni ürün mü" ayrımı, hesaplama kalıbına takılmama ve döngüye girmeme (Max Iterations=4, tool'u mesaj başına en fazla 1 kez çağırma) gibi kurallar içerir — bunlar üretim sırasında karşılaşılan gerçek hatalara karşı eklendi.
- `/api/chat` üzerinde rate limiting **yoktur** (kasıtlı olarak kaldırıldı — chatbot testleri gerçek ziyaretçi trafiğini engellemesin diye). `/api/webhook` (sipariş/stok) kendi ayrı rate limitini korur (IP başına 3 dakikada 10 istek).

### n8n Altyapısı
- Self-hosted, yerel Docker container (`n8n`, port 5678) + ayrı `redis` container, aynı Docker network'ünde.
- Dışarıya (Vercel'e) açılmak için **Cloudflare Quick Tunnel** (`cloudflared tunnel --url http://localhost:5678`) kullanılıyor.
  - ⚠️ Bilinen sınırlama: hesapsız "quick tunnel" kalıcı değildir, rastgele zamanlarda kopabilir (`Unauthorized: Tunnel not found`). Koptuğunda: `cloudflared` yeniden başlatılır, yeni URL alınır, Vercel'deki `WEBHOOK_URL` / `CHAT_WEBHOOK_URL` env değişkenleri güncellenip **gerçekten yeni bir deployment oluştuğu doğrulanarak** redeploy edilir.
  - Kalıcı çözüm (denenmedi, gelecekte yapılabilir): sahip olunan bir domain + Cloudflare'a bağlı "named tunnel".

### n8n API ile Operasyonel Sorgular
- n8n Ayarlar → n8n API'den bir API key oluşturulup, n8n'in kendi **"n8n" node**'u (Resource: Execution, Operation: Get Many) ile self-referential sorgu yapılabilir.
- Örnek: "bu hafta kaç sipariş geldi" sorusu, `AtöyleKart_webhook` workflow'unun execution'ları çekilip `startedAt` bu haftaya filtrelenerek ve execution verisi içinde `order.created` / `stock_notification.requested` ayrımı yapılarak cevaplanabilir (örnek workflow: **"AtolyeKart - n8n API Sorgu Ornegi"**).

Bu doküman artık teknik/mimari kararları da içerir; iş ve ürün bağlamı yukarıdaki "Ürünler" ve "Kullanım Senaryosu" bölümlerinde değişmeden duruyor.
