import type { Context, Next } from 'hono'

interface RateLimitEntry {
  count: number
  resetTime: number
}

const store = new Map<string, RateLimitEntry>()

const CLEANUP_INTERVAL = 60000
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now >= entry.resetTime) store.delete(key)
  }
}, CLEANUP_INTERVAL)

export function rateLimit() {
  return async (c: Context, next: Next) => {
    const hasToken = !!process.env.GITHUB_TOKEN
    const max = hasToken ? 30 : 10
    const windowMs = 60000

    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown'
    const key = `${ip}:${hasToken ? 'auth' : 'anon'}`
    const now = Date.now()

    const record = store.get(key)
    if (record && now < record.resetTime) {
      if (record.count >= max) {
        c.header('X-RateLimit-Limit', String(max))
        c.header('X-RateLimit-Remaining', '0')
        c.header('X-RateLimit-Reset', String(Math.ceil(record.resetTime / 1000)))
        return c.json({ error: 'Too many requests, please try again later' }, 429)
      }
      record.count++
      c.header('X-RateLimit-Limit', String(max))
      c.header('X-RateLimit-Remaining', String(max - record.count))
    } else {
      store.set(key, { count: 1, resetTime: now + windowMs })
      c.header('X-RateLimit-Limit', String(max))
      c.header('X-RateLimit-Remaining', String(max - 1))
    }

    await next()
  }
}
