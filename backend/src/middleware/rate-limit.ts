import type { RequestHandler } from "express";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const requests = new Map<string, RateLimitEntry>();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 100;

const rateLimit: RequestHandler = (req, res, next) => {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || "unknown";

  let entry = requests.get(key);

  if (!entry || now >= entry.resetAt) {
    entry = {
      count: 0,
      resetAt: now + WINDOW_MS,
    };
  }

  entry.count += 1;
  requests.set(key, entry);

  const remaining = Math.max(0, MAX_REQUESTS - entry.count);
  const resetSeconds = Math.max(
    0,
    Math.ceil((entry.resetAt - now) / 1000)
  );

  res.setHeader("RateLimit-Limit", MAX_REQUESTS);
  res.setHeader("RateLimit-Remaining", remaining);
  res.setHeader("RateLimit-Reset", resetSeconds);

  if (entry.count > MAX_REQUESTS) {
    res.setHeader("Retry-After", resetSeconds);

    res.status(429).json({
      success: false,
      message: "Çok fazla istek gönderdin. Lütfen daha sonra tekrar dene.",
    });

    return;
  }

  next();
};

// Süresi dolmuş kayıtların bellekte birikmesini önle.
const cleanupInterval = setInterval(() => {
  const now = Date.now();

  for (const [key, entry] of requests.entries()) {
    if (now >= entry.resetAt) {
      requests.delete(key);
    }
  }
}, 60_000);

// Node.js'in yalnızca bu zamanlayıcı nedeniyle açık kalmasını önle.
cleanupInterval.unref();

export default rateLimit;