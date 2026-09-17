const RATE_LIMIT_WINDOW_MS = 3 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const requestLog = new Map();

// Muafiyet yok — bilinçli tercih: /api/webhook ve /api/token'ı çağıran her
// istemci (atölye sahibi dahil) aynı limite tabidir. Sabit bir "admin" veya
// "internal" IP/token muafiyeti tanımlamıyoruz; böyle bir istisna hem
// unutulup güncel kalmayabilir hem de tahmin edilebilir bir bypass yolu
// olurdu. Gerekirse (ör. atölye sahibi toplu test yapacaksa) limit süreç
// içinde geçici olarak RATE_LIMIT_MAX_REQUESTS değiştirilerek gevşetilir.
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

// Vercel'in kendi edge ağının ayarladığı x-vercel-forwarded-for önceliklidir
// (istemcinin taklit edemeyeceği tek değer). x-forwarded-for standart ama
// birden fazla proxy'den geçmiş olabilir, ilk değer alınır. x-real-ip
// KASITLI OLARAK kullanılmıyor: Vercel bu header'ı garanti olarak üzerine
// yazmıyor, istemci kendi X-Real-Ip başlığını göndererek sayaçı taklit
// edip rate limit'i atlatabilirdi.
function getClientIp(req) {
  const vercelForwarded = req.headers["x-vercel-forwarded-for"];
  if (vercelForwarded) {
    return vercelForwarded.split(",")[0].trim();
  }
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

module.exports = { isRateLimited, getClientIp };
