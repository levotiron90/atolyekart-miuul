const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { isRateLimited, getClientIp } = require("./_rateLimit");

module.exports = async (req, res) => {
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    res.setHeader("Retry-After", "60");
    return res.status(429).json({ error: "Too Many Requests" });
  }

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

  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({ token });
};
