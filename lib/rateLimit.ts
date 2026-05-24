// Simple in-memory rate limiter
// For production, use Redis (Upstash) — this works fine for Vercel serverless

const attempts = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(key: string, maxAttempts: number, windowMs: number): { allowed: boolean; remaining: number; retryAfter?: number } {
  const now = Date.now()
  const record = attempts.get(key)

  if (!record || now > record.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxAttempts - 1 }
  }

  if (record.count >= maxAttempts) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000)
    return { allowed: false, remaining: 0, retryAfter }
  }

  record.count++
  return { allowed: true, remaining: maxAttempts - record.count }
}

// Clean up old entries every 10 minutes
setInterval(() => {
  const now = Date.now()
  attempts.forEach((v, k) => { if (now > v.resetAt) attempts.delete(k) })
}, 10 * 60 * 1000)
