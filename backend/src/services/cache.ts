import { createLogger } from '../utils/logger.js'

const log = createLogger('cache')

interface CacheEntry {
  value: string
  expiresAt: number
}

export class ResumeCache {
  private store = new Map<string, CacheEntry>()
  private redis: null = null
  private useRedis = false

  constructor(redisUrl?: string) {
    if (redisUrl) {
      import('ioredis')
        .then(({ Redis }) => {
          const client = new Redis(redisUrl, { lazyConnect: true })
          client.connect().then(() => {
            this.useRedis = true
            log.info('redis connected')
          }).catch((err: Error) => {
            log.warn({ err: err.message }, 'redis unavailable, using memory')
          })
        })
        .catch(() => log.info('ioredis not installed, using memory'))
    }
  }

  async get(key: string): Promise<string | null> {
    const now = Date.now()
    const entry = this.store.get(key)
    if (entry && now < entry.expiresAt) return entry.value
    this.store.delete(key)
    return null
  }

  async set(key: string, value: string, ttlMs = 300000): Promise<void> {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs })
  }

  async del(key: string): Promise<void> {
    this.store.delete(key)
  }

  cacheKey(prefix: string, ...parts: string[]): string {
    return `${prefix}:${parts.join(':')}`
  }
}

export const cache = new ResumeCache(process.env.REDIS_URL)
