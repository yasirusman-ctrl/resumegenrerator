import { serve, type HttpBindings } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger as honoLogger } from 'hono/logger'
import type { Server } from 'node:http'
import 'dotenv/config'

import { rateLimit } from './middleware/rateLimit.js'
import { securityHeaders } from './middleware/securityHeaders.js'
import { setupWebSocket } from './websocket/index.js'
import { createLogger } from './utils/logger.js'

import generateRoute from './routes/v1/generate.js'
import historyRoute from './routes/v1/history.js'

const log = createLogger('app')

if (!process.env.GITHUB_TOKEN) {
  log.warn('GITHUB_TOKEN not set. Rate limit reduced.')
}

const app = new Hono<{ Bindings: HttpBindings }>()

app.use('*', cors(), honoLogger(), rateLimit(), securityHeaders())

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

const v1 = new Hono()
v1.route('/generate', generateRoute)
v1.route('/resumes', historyRoute)
app.route('/api/v1', v1)
app.route('/api', v1)

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000

const server = serve(
  { fetch: app.fetch, port },
  (info) => log.info({ addr: info }, 'listening'),
) as unknown as Server

setupWebSocket(server)
