interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const windowMs = 60 * 1000; // 1 minute window
const maxRequestsPerWindow = 30; // 30 requests per minute per user

const rateLimitMap = new Map<string, RateLimitRecord>();

/**
 * In-memory sliding window rate limiter per user/IP
 */
export function checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetInSec: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { allowed: true, remaining: maxRequestsPerWindow - 1, resetInSec: 60 };
  }

  if (record.count >= maxRequestsPerWindow) {
    return {
      allowed: false,
      remaining: 0,
      resetInSec: Math.ceil((record.resetAt - now) / 1000),
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: maxRequestsPerWindow - record.count,
    resetInSec: Math.ceil((record.resetAt - now) / 1000),
  };
}

