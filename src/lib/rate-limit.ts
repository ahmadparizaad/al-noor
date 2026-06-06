/**
 * In-memory sliding-window rate limiter — per serverless instance only.
 *
 * ⚠️  PRODUCTION NOTE: On Vercel Fluid Compute, requests are distributed across
 * multiple warm instances. Each instance has its own counter, so a determined
 * attacker can multiply their effective limit by N instances.
 *
 * Before scaling beyond a single region, replace this store with Upstash Redis:
 *   @upstash/ratelimit + @upstash/redis  (Vercel Marketplace integration available)
 * That gives a single shared counter across all instances and regions.
 *
 * Current limits (login: 10/15 min, register: 5/15 min) are acceptable for
 * launch on a single warm instance; revisit when traffic grows.
 */

interface RateLimitEntry {
  count:     number
  windowStart: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up stale entries every 5 minutes to prevent memory growth
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now - entry.windowStart > 60_000 * 5) store.delete(key)
  }
}, 60_000 * 5)

interface RateLimitOptions {
  /** Unique key (e.g. IP + endpoint) */
  key: string
  /** Max requests allowed in the window */
  limit: number
  /** Window duration in milliseconds */
  windowMs: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number  // epoch ms
}

export function checkRateLimit({ key, limit, windowMs }: RateLimitOptions): RateLimitResult {
  const now   = Date.now()
  const entry = store.get(key)

  if (!entry || now - entry.windowStart >= windowMs) {
    // New window
    store.set(key, { count: 1, windowStart: now })
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.windowStart + windowMs }
  }

  entry.count++
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.windowStart + windowMs }
}
