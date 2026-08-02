# Anonim JWT Koruması ve Rate Limiting — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/api/webhook`'u login eklemeden anonim bir JWT ile ve IP başına dakikada 10 isteklik bir rate limit ile koruma altına almak; mevcut sipariş/stok-bildirimi UI'sını ve akışını hiç bozmadan.

**Architecture:** İki yeni/güncellenen Vercel Serverless Function (`api/token.js`, `api/webhook.js`) + `react.html`'de token bootstrap ve `sendToWebhook` güncellemesi. Rate limit, `api/webhook.js` içinde modül seviyesinde bir bellek `Map`'i ile fixed-window algoritmasıyla uygulanır (proje Hobby planda, Vercel Firewall native rate limiting kullanılamıyor).

**Tech Stack:** Node.js (CommonJS, `module.exports`), `jsonwebtoken` npm paketi, vanilla React 18 (CDN + Babel Standalone, build aracı yok), Vercel Serverless Functions.

## Global Constraints

- Login/kayıt ekranı **eklenmeyecek** — token tamamen anonim (`sessionId` = `crypto.randomUUID()`).
- Yeni API endpoint'leri mevcut `api/webhook.js` ile aynı desende yazılır: `module.exports = async (req, res) => { ... }` (CommonJS, "type": "module" yok).
- `OrderForm` ve `StockNotifyForm` ayrı ayrı değiştirilmez; ikisi de ortak `sendToWebhook` yardımcısını kullanır ve oradan otomatik korunur.
- localStorage anahtarı sabit: `"atolyekart_jwt"`.
- JWT süresi: `expiresIn: "24h"`.
- Rate limit: IP başına 60 saniyede en fazla 10 istek; aşılırsa `429` + `Retry-After: 60`.
- İşlem sırası `api/webhook.js` içinde: önce rate limit kontrolü, sonra JWT doğrulaması, sonra mevcut webhook forward mantığı.
- `WEBHOOK_URL` ve `JWT_SECRET` asla tarayıcıya/istemci koduna sızmaz — yalnızca sunucu tarafında (`process.env`) okunur.
- Mevcut görsel tasarım ve kullanıcı deneyimi (buton metinleri, onay mesajları, hata yutma davranışı) değişmeyecek.
- Spec: `docs/superpowers/specs/2026-08-02-anonim-jwt-koruma-design.md`

---

### Task 1: `package.json` ve `jsonwebtoken` bağımlılığı

**Files:**
- Create: `package.json`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `node_modules/jsonwebtoken` paketi (sonraki task'larda `require("jsonwebtoken")` ile kullanılacak).

- [ ] **Step 1: `package.json` dosyasını oluştur**

```json
{
  "name": "atolyekart",
  "private": true,
  "dependencies": {
    "jsonwebtoken": "^9.0.2"
  }
}
```

- [ ] **Step 2: Bağımlılığı kur**

Run: `npm install`

Expected: `node_modules/` dizini ve `package-lock.json` oluşur, hata vermeden biter.

- [ ] **Step 3: `node_modules`'u `.gitignore`'a ekle**

`.gitignore` dosyasının sonuna ekle:

```
node_modules/
```

Sonuç dosya tamamı şu şekilde olmalı:

```
.worktrees/
.claude/worktrees/

.vercel
.env*
node_modules/
```

- [ ] **Step 4: `node_modules`'un ignore edildiğini doğrula**

Run: `git status --short`

Expected: `node_modules/` **listede görünmemeli** (ignore ediliyor); `package.json`, `package-lock.json` ve `.gitignore` değişikliği `??`/`M` olarak görünmeli.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json .gitignore
git commit -m "chore: jsonwebtoken bagimliligi eklendi"
```

---

### Task 2: `JWT_SECRET` ortam değişkenini üret ve kaydet

**Files:**
- Modify: `.env.development`
- Modify: `.env.production`

**Interfaces:**
- Produces: Vercel projesinde (Production/Preview/Development) ve yerel `.env.*` dosyalarında `JWT_SECRET` değeri — sonraki task'larda `process.env.JWT_SECRET` ile okunacak.

- [ ] **Step 1: Rastgele bir sır üret**

Run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

Expected: 64 karakterlik hex bir string basılır (örn. `a1b2c3...`). Bu değeri sonraki adımlarda `<GENERATED_SECRET>` yerine kullan.

- [ ] **Step 2: `.env.development`'a ekle**

`.env.development` dosyasının sonuna ekle (WEBHOOK_URL satırının altına):

```
JWT_SECRET="<GENERATED_SECRET>"
```

- [ ] **Step 3: `.env.production`'a aynı değeri ekle**

`.env.production` dosyasının sonuna ekle:

```
JWT_SECRET="<GENERATED_SECRET>"
```

- [ ] **Step 4: Değeri Vercel projesine kaydet**

Run: `vercel env add JWT_SECRET production,preview,development --value "<GENERATED_SECRET>" --no-sensitive --yes`

Expected: `✓ Added JWT_SECRET` çıktısı, `Environments: Production, Preview, Development`.

- [ ] **Step 5: Doğrula**

Run: `vercel env ls`

Expected: Listede `JWT_SECRET` (Production, Preview, Development) ve `WEBHOOK_URL` görünür.

Not: `.env.development` / `.env.production` zaten `.gitignore`'daki `.env*` deseniyle yok sayılıyor — bu adım için ayrı bir `git commit` gerekmez.

---

### Task 3: `api/token.js` — yeni Serverless Function

**Files:**
- Create: `api/token.js`

**Interfaces:**
- Consumes: `process.env.JWT_SECRET` (Task 2'de eklendi), `jsonwebtoken` paketi (Task 1'de eklendi).
- Produces: `GET /api/token` → `200 { token: string }` — sonraki task'larda `react.html` bu endpoint'i çağıracak.

- [ ] **Step 1: `api/token.js` dosyasını oluştur**

```js
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("JWT_SECRET ortam değişkeni tanımlı değil");
    return res.status(500).json({ error: "Token service not configured" });
  }

  const sessionId = crypto.randomUUID();
  const token = jwt.sign({ sessionId }, secret, { expiresIn: "24h" });

  return res.status(200).json({ token });
};
```

- [ ] **Step 2: Yerel test sunucusunu başlat**

Run: `vercel dev --listen 3114 --yes`

Expected: `> Ready! Available at http://localhost:3114` (arka planda çalışır bırak, sonraki step'te ayrı bir terminalden/komutla test edilecek).

- [ ] **Step 3: `/api/token`'ı test et**

Run: `curl -s http://localhost:3114/api/token -w "\nHTTP:%{http_code}\n"`

Expected: `HTTP:200` ve gövdede `{"token":"eyJ..."}` formatında bir JWT (üç nokta ile ayrılmış üç base64 parçası).

- [ ] **Step 4: Token'ın içeriğini doğrula (opsiyonel ama önerilir)**

Run:
```bash
TOKEN=$(curl -s http://localhost:3114/api/token | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).token))")
node -e "console.log(require('jsonwebtoken').decode('$TOKEN'))"
```

Expected: `{ sessionId: '...', iat: ..., exp: ... }` — `sessionId` bir UUID, `exp - iat` yaklaşık `86400` (24 saat) saniye.

- [ ] **Step 5: Commit**

```bash
git add api/token.js
git commit -m "feat: /api/token ile anonim JWT uretimi eklendi"
```

---

### Task 4: `api/webhook.js` — rate limiting ekle

**Files:**
- Modify: `api/webhook.js`

**Interfaces:**
- Produces: Rate limit aşıldığında `429 { error: "Too Many Requests" }` + `Retry-After: 60` header'ı. Sonraki task (JWT doğrulama) bu kontrolün **hemen ardından** eklenecek.

- [ ] **Step 1: Mevcut dosyanın başına rate limit yardımcılarını ekle**

`api/webhook.js`'in en başına (`module.exports = async (req, res) => {` satırından **önce**) ekle:

```js
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const requestLog = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const entry = requestLog.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    requestLog.set(ip, { count: 1, windowStart: now });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX_REQUESTS;
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}
```

- [ ] **Step 2: Rate limit kontrolünü `POST` kontrolünden hemen sonra ekle**

`api/webhook.js` içinde şu bloğu:

```js
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const webhookUrl = process.env.WEBHOOK_URL;
```

şununla değiştir:

```js
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    res.setHeader("Retry-After", "60");
    return res.status(429).json({ error: "Too Many Requests" });
  }

  const webhookUrl = process.env.WEBHOOK_URL;
```

- [ ] **Step 3: Yerel sunucuyu yeniden başlat**

Task 3'te açtığın `vercel dev` sürecini durdur (`pkill -f "vercel dev"`) ve yeniden başlat:

Run: `vercel dev --listen 3114 --yes`

- [ ] **Step 4: Rate limit'in tetiklendiğini doğrula**

Run:
```bash
for i in $(seq 1 11); do
  curl -s -o /dev/null -w "%{http_code} " -X POST http://localhost:3114/api/webhook \
    -H "Content-Type: application/json" -d '{"event":"rate.test"}'
done
echo
```

Expected: İlk 10 istek `200` (JWT olmadığı için normalde `401` bekleriz, ama bu adımda henüz JWT kontrolü eklenmedi — sadece rate limit test ediliyor; 10 istek webhook'a forward edilir), 11. istek **`429`** döner.

- [ ] **Step 5: Commit**

```bash
git add api/webhook.js
git commit -m "feat: webhook api icine dakikada 10 istek rate limit eklendi"
```

---

### Task 5: `api/webhook.js` — JWT doğrulaması ekle

**Files:**
- Modify: `api/webhook.js`

**Interfaces:**
- Consumes: `process.env.JWT_SECRET`, `jsonwebtoken`, `Authorization` header.
- Produces: Header yoksa/geçersizse `401 { error: "Unauthorized" }`; geçerliyse mevcut forward akışı değişmeden çalışır.

- [ ] **Step 1: Dosyanın en üstüne `jsonwebtoken` import'unu ekle**

`api/webhook.js`'in ilk satırına ekle:

```js
const jwt = require("jsonwebtoken");
```

(Dosyanın geri kalanı — rate limit sabitleri ve fonksiyonları — bu satırın hemen altında, Task 4'te eklendiği gibi kalır.)

- [ ] **Step 2: JWT doğrulamasını rate limit kontrolünden hemen sonra ekle**

Task 4 sonunda `module.exports` içindeki şu blok:

```js
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    res.setHeader("Retry-After", "60");
    return res.status(429).json({ error: "Too Many Requests" });
  }

  const webhookUrl = process.env.WEBHOOK_URL;
```

şununla değiştir:

```js
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    res.setHeader("Retry-After", "60");
    return res.status(429).json({ error: "Too Many Requests" });
  }

  const authHeader = req.headers["authorization"] || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const webhookUrl = process.env.WEBHOOK_URL;
```

- [ ] **Step 3: Yerel sunucuyu yeniden başlat**

Run: `pkill -f "vercel dev"` sonra `vercel dev --listen 3114 --yes`

- [ ] **Step 4: Token'sız isteğin `401` döndüğünü doğrula**

Run:
```bash
curl -s -X POST http://localhost:3114/api/webhook \
  -H "Content-Type: application/json" -d '{"event":"no.token"}' -w "\nHTTP:%{http_code}\n"
```

Expected: `HTTP:401`

- [ ] **Step 5: Bozuk token ile `401` döndüğünü doğrula**

Run:
```bash
curl -s -X POST http://localhost:3114/api/webhook \
  -H "Authorization: Bearer bozuk.token.degeri" \
  -H "Content-Type: application/json" -d '{"event":"bad.token"}' -w "\nHTTP:%{http_code}\n"
```

Expected: `HTTP:401`

- [ ] **Step 6: Geçerli token ile `200` döndüğünü ve webhook'un çalıştığını doğrula**

Run:
```bash
TOKEN=$(curl -s http://localhost:3114/api/token | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).token))")
curl -s -X POST http://localhost:3114/api/webhook \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"event":"valid.token"}' -w "\nHTTP:%{http_code}\n"
```

Expected: `HTTP:200` ve gövdede `{"ok":true}`.

- [ ] **Step 7: Rate limit + geçerli token kombinasyonunu doğrula (spec'teki tam senaryo)**

Sunucuyu tekrar yeniden başlat (sayaç sıfırlansın): `pkill -f "vercel dev"` sonra `vercel dev --listen 3114 --yes`. Ardından:

```bash
TOKEN=$(curl -s http://localhost:3114/api/token | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).token))")
for i in $(seq 1 11); do
  curl -s -o /dev/null -w "%{http_code} " -X POST http://localhost:3114/api/webhook \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" -d '{"event":"rate.and.auth.test"}'
done
echo
```

Expected: İlk 10 istek `200`, 11. istek `429`. Bu, spec'teki "aynı IP'den 60 saniye içinde 11. istek atıldığında 429 döndüğü, 10. isteğe kadar geçerli token ile 200 alındığı" test kriterini birebir doğrular.

- [ ] **Step 8: Commit**

```bash
git add api/webhook.js
git commit -m "feat: webhook api icin JWT dogrulamasi eklendi"
```

---

### Task 6: `react.html` — sayfa açılışında token edinme

**Files:**
- Modify: `react.html` (`function App()` bloğu — şu an `const { useState, useEffect } = React;` satırının ~330 satır altında)

**Interfaces:**
- Produces: `fetchAuthToken()` — `sendToWebhook` (Task 7) tarafından da kullanılacak paylaşılan yardımcı fonksiyon. Dönüş değeri: `Promise<string>` (token).
- Consumes: `GET /api/token` (Task 3'te oluşturuldu).

- [ ] **Step 1: `fetchAuthToken` yardımcısını `sendToWebhook`'un hemen üstüne ekle**

`react.html` içinde `async function sendToWebhook(payload) {` satırından **hemen önce** ekle:

```js
async function fetchAuthToken() {
  const res = await fetch("/api/token");
  if (!res.ok) {
    throw new Error(`Token alınamadı: ${res.status}`);
  }
  const data = await res.json();
  localStorage.setItem("atolyekart_jwt", data.token);
  return data.token;
}
```

- [ ] **Step 2: `App()` bileşenine mount-time token bootstrap ekle**

Mevcut:

```js
function App() {
  return (
    <React.Fragment>
```

şununla değiştir:

```js
function App() {
  useEffect(() => {
    if (!localStorage.getItem("atolyekart_jwt")) {
      fetchAuthToken().catch((err) => console.warn("Token alınamadı:", err));
    }
  }, []);

  return (
    <React.Fragment>
```

- [ ] **Step 3: Yerel sunucuda test et**

Run: `pkill -f "vercel dev"` sonra `vercel dev --listen 3114 --yes`

Tarayıcıda `http://localhost:3114/react.html` aç (Claude in Chrome veya normal tarayıcı), DevTools Console'da çalıştır:

```js
localStorage.getItem("atolyekart_jwt")
```

Expected: `null` yerine geçerli bir JWT string'i döner (sayfa yüklendikten kısa süre sonra).

- [ ] **Step 4: "Token zaten varsa tekrar üretmesin" davranışını doğrula**

Sayfayı yenile (F5). DevTools Network sekmesinde `/api/token` isteğinin **atılmadığını** doğrula (çünkü `localStorage`'da zaten token var).

- [ ] **Step 5: Commit**

```bash
git add react.html
git commit -m "feat: sayfa acilisinda anonim JWT token localStorage'a aliniyor"
```

---

### Task 7: `react.html` — `sendToWebhook`'a Authorization header ve 401 retry

**Files:**
- Modify: `react.html` (`async function sendToWebhook(payload)` fonksiyonu)

**Interfaces:**
- Consumes: `fetchAuthToken()` (Task 6'da eklendi), `localStorage["atolyekart_jwt"]`.
- Produces: `OrderForm` ve `StockNotifyForm` değişmeden korunmuş olur (ikisi de `sendToWebhook`'u çağırıyor).

- [ ] **Step 1: `sendToWebhook`'u güncelle**

Mevcut:

```js
async function sendToWebhook(payload) {
  try {
    // Gerçek webhook adresi tarayıcıya hiç gönderilmez: istek aynı origin'deki
    // /api/webhook serverless fonksiyonuna gider, o da process.env.WEBHOOK_URL'i
    // sunucu tarafında okuyup hedefe iletir. Aynı origin olduğu için CORS sorunu
    // yaşanmaz, normal application/json isteği yeterlidir.
    await fetch("/api/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn("Webhook'a ulaşılamadı:", err);
  }
  console.log("Webhook payload:", payload);
}
```

şununla değiştir:

```js
async function sendToWebhook(payload) {
  try {
    // Gerçek webhook adresi tarayıcıya hiç gönderilmez: istek aynı origin'deki
    // /api/webhook serverless fonksiyonuna gider, o da process.env.WEBHOOK_URL'i
    // sunucu tarafında okuyup hedefe iletir. Aynı origin olduğu için CORS sorunu
    // yaşanmaz, normal application/json isteği yeterlidir.
    // /api/webhook ayrıca Authorization: Bearer <JWT> header'ını zorunlu kılar
    // (anonim, oturum bazlı token — bkz. fetchAuthToken). Token süresi dolmuşsa
    // (401) yeni bir token alınıp istek bir kez daha denenir.
    let token = localStorage.getItem("atolyekart_jwt");
    let response = await fetch("/api/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token || ""}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 401) {
      token = await fetchAuthToken();
      response = await fetch("/api/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
    }

    if (!response.ok) {
      console.warn("Webhook isteği başarısız:", response.status);
    }
  } catch (err) {
    console.warn("Webhook'a ulaşılamadı:", err);
  }
  console.log("Webhook payload:", payload);
}
```

- [ ] **Step 2: Yerel sunucuda uçtan uca test et (sipariş akışı)**

`vercel dev --listen 3114 --yes` çalışıyorken tarayıcıda `http://localhost:3114/react.html` aç:
1. Herhangi bir üründe "Sipariş Ver"e tıkla, formu doldur, "Siparişi Onayla"ya bas.
2. "Siparişiniz alındı, teşekkürler!" onay mesajının **değişmeden** göründüğünü doğrula.
3. DevTools Network sekmesinde `/api/webhook` isteğinin Request Headers'ında `Authorization: Bearer eyJ...` olduğunu doğrula.
4. Response status `200` olmalı.

- [ ] **Step 3: Stok bildirimi akışını test et**

Stokta olmayan bir varyant seç (`src/data/stock.js`'te `false` olan), "Stok Bildirimi İste" formunu doldurup gönder.

Expected: "Talebiniz alındı — ürün stoğa girdiğinde size haber vereceğiz." mesajı **değişmeden** görünür; `/api/webhook` isteği yine `Authorization` header'ıyla gider.

- [ ] **Step 4: 401 → otomatik retry davranışını doğrula**

DevTools Console'da geçersiz bir token yaz, sonra bir sipariş gönder:

```js
localStorage.setItem("atolyekart_jwt", "gecersiz.token.degeri");
```

Bir "Sipariş Ver" akışını tekrar dene. Expected: Network sekmesinde önce `401` dönen bir `/api/webhook` isteği, hemen ardından bir `/api/token` isteği, sonra `200` dönen ikinci bir `/api/webhook` isteği görünür. Kullanıcıya yine "Siparişiniz alındı" mesajı gösterilir (UX bozulmamış).

- [ ] **Step 5: Commit**

```bash
git add react.html
git commit -m "feat: sendToWebhook Authorization header ve 401 retry eklendi"
```

---

### Task 8: Production'a deploy ve son doğrulama

**Files:** (yok — sadece deploy ve doğrulama)

**Interfaces:** (yok — bu son entegrasyon task'ı)

- [ ] **Step 1: Yerel `vercel dev` sürecini durdur**

Run: `pkill -f "vercel dev"`

- [ ] **Step 2: Production'a deploy et**

Run: `vercel --prod`

Expected: `Deployment ... ready.` çıktısı, `readyState: READY`.

- [ ] **Step 3: Canlı ortamda uçtan uca doğrula**

`vercel:deploy` skill'indeki doğrulama akışını uygula (`vercel inspect <url>`, ardından tarayıcıda canlı URL'de "Sipariş Ver" akışını gerçek bir gönderimle test et — bkz. Task 7 Step 2-3, aynı adımlar production URL'inde tekrarlanır).

Expected: `/api/webhook` `200` döner, onay mesajı değişmeden görünür, `Authorization` header'ı gönderilir.

- [ ] **Step 4: Rate limit'in production'da da çalıştığını doğrula**

Run (production URL'i kendi deploy çıktından al):
```bash
for i in $(seq 1 11); do
  curl -s -o /dev/null -w "%{http_code} " -X POST https://<production-url>/api/webhook \
    -H "Content-Type: application/json" -d '{"event":"rate.test"}'
done
echo
```

Expected: İlk 10 istek `401` (token yok, ama rate limit sayacı işliyor), 11. istek `429`.

- [ ] **Step 5: Commit gerekmiyor — bu task sadece deploy/doğrulama.**
