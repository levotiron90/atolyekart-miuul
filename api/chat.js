const MAX_MESSAGE_LENGTH = 500;
const MAX_SESSION_ID_LENGTH = 100;

function isBoundedString(value, maxLength) {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { sessionId, chatInput } = req.body || {};
  if (!isBoundedString(sessionId, MAX_SESSION_ID_LENGTH) || !isBoundedString(chatInput, MAX_MESSAGE_LENGTH)) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const webhookUrl = process.env.CHAT_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error("CHAT_WEBHOOK_URL ortam değişkeni tanımlı değil");
    return res.status(500).json({ error: "Chat webhook not configured" });
  }

  try {
    const webhookRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "sendMessage",
        sessionId,
        chatInput: chatInput.trim(),
      }),
    });

    if (!webhookRes.ok) {
      const responseText = await webhookRes.text().catch(() => "");
      console.error("Chat webhook hedefi hata döndü:", webhookRes.status, responseText);
      return res.status(502).json({ error: "Chat webhook delivery failed" });
    }

    const data = await webhookRes.json().catch(() => null);
    const output = data && typeof data.output === "string" ? data.output : null;
    if (!output) {
      console.error("Chat webhook beklenmeyen yanıt döndü:", data);
      return res.status(502).json({ error: "Chat webhook returned unexpected response" });
    }

    return res.status(200).json({ output });
  } catch (err) {
    console.error("Chat webhook'a ulaşılamadı:", err);
    return res.status(502).json({ error: "Chat webhook delivery failed" });
  }
};
