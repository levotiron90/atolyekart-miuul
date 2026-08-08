const jwt = require("jsonwebtoken");
const { isRateLimited, getClientIp } = require("./_rateLimit");
const { isValidProductId } = require("./_catalog");

const ALLOWED_EVENTS = new Set(["order.created", "stock_notification.requested"]);
const ALLOWED_SOURCES = new Set(["atolyekart-web", "atolyekart-mobile"]);
const MAX_TEXT_LENGTH = 200;
const MAX_PHONE_LENGTH = 30;
const MAX_QUANTITY = 100;
const POLICY_VERSION = "2026-08-02";

function isBoundedString(value, maxLength) {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}

// req.body'yi doğrudan forward etmek yerine, sadece bilinen alanları
// (atolyekart-conventions skill'deki webhook veri sözleşmesi) doğrulayıp
// temiz bir kopyasını oluşturur. Bilinmeyen/fazladan alanlar elenir,
// productId gerçek katalogla (src/data/card.js) karşılaştırılır, KVKK
// onayı ve gönderim zamanı sunucu tarafında damgalanır.
function buildValidatedPayload(body) {
  if (!body || typeof body !== "object") return null;
  if (!ALLOWED_EVENTS.has(body.event)) return null;
  if (!isBoundedString(body.name, MAX_TEXT_LENGTH)) return null;
  if (!isBoundedString(body.email, MAX_TEXT_LENGTH)) return null;
  if (!isValidProductId(body.productId)) return null;
  if (!isBoundedString(body.productName, MAX_TEXT_LENGTH)) return null;
  if (!ALLOWED_SOURCES.has(body.source)) return null;
  if (body.kvkkConsent !== true) return null;

  const payload = {
    event: body.event,
    name: body.name.trim(),
    productId: body.productId,
    productName: body.productName.trim(),
    email: body.email.trim(),
    source: body.source,
    kvkkConsent: true,
    consentAt: new Date().toISOString(),
    policyVersion: POLICY_VERSION,
  };

  if (body.event === "order.created") {
    if (!isBoundedString(body.phone, MAX_PHONE_LENGTH)) return null;
    if (!Number.isInteger(body.quantity) || body.quantity < 1 || body.quantity > MAX_QUANTITY) {
      return null;
    }
    payload.phone = body.phone.trim();
    payload.quantity = body.quantity;
  }

  return payload;
}

module.exports = async (req, res) => {
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    res.setHeader("Retry-After", "60");
    return res.status(429).json({ error: "Too Many Requests" });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const authHeader = req.headers["authorization"] || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("JWT_SECRET ortam değişkeni tanımlı değil");
    return res.status(500).json({ error: "Auth service not configured" });
  }

  try {
    jwt.verify(token, secret, { algorithms: ["HS256"] });
  } catch (err) {
    console.warn("JWT doğrulama başarısız:", err.message);
    return res.status(401).json({ error: "Unauthorized" });
  }

  const payload = buildValidatedPayload(req.body);
  if (!payload) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const webhookUrl = process.env.WEBHOOK_URL;
  if (!webhookUrl) {
    console.error("WEBHOOK_URL ortam değişkeni tanımlı değil");
    return res.status(500).json({ error: "Webhook not configured" });
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Webhook'a ulaşılamadı:", err);
    return res.status(502).json({ error: "Webhook delivery failed" });
  }
};
