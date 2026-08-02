const jwt = require("jsonwebtoken");
const { isRateLimited, getClientIp } = require("./_rateLimit");

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

  const webhookUrl = process.env.WEBHOOK_URL;
  if (!webhookUrl) {
    console.error("WEBHOOK_URL ortam değişkeni tanımlı değil");
    return res.status(500).json({ error: "Webhook not configured" });
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Webhook'a ulaşılamadı:", err);
    return res.status(502).json({ error: "Webhook delivery failed" });
  }
};
