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
  const realIp = req.headers["x-real-ip"];
  if (realIp) {
    return realIp;
  }
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
