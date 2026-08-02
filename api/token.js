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
