import { WebSocketServer, type WebSocket } from 'ws'
import type { IncomingMessage } from 'node:http'
import type { Server } from 'node:http'
import { fetchGitHubUserData } from '../services/github.js'
import { renderTemplate } from '../templates/registry.js'
import { compileLaTeX } from '../utils/compile.js'
import { createResume } from '../db/index.js'
import { createLogger } from '../utils/logger.js'
import type { ServerWebSocket } from 'ws'

const log = createLogger('ws')

interface WsMessage {
  type: 'compile'
  username: string
  template: string
  customSections?: Array<{ title: string; items: string[] }>
}

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' })

  wss.on('connection', (ws: WebSocket, _req: IncomingMessage) => {
    log.info('client connected')

    ws.on('message', async (raw: Buffer) => {
      try {
        const msg: WsMessage = JSON.parse(raw.toString())

        if (msg.type !== 'compile') {
          ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }))
          return
        }

        ws.send(JSON.stringify({ type: 'progress', step: 'fetching', message: 'Fetching GitHub data...' }))

        const userData = await fetchGitHubUserData(msg.username, msg.customSections || [])

        ws.send(JSON.stringify({ type: 'progress', step: 'rendering', message: 'Rendering template...' }))

        const texContent = renderTemplate(msg.template, userData)

        const pdfBuffer = await compileLaTeX(texContent, (step, message) => {
          ws.send(JSON.stringify({ type: 'progress', step, message }))
        })

        ws.send(JSON.stringify({ type: 'progress', step: 'saving', message: 'Saving resume...' }))

        const record = createResume(msg.username, msg.template, msg.customSections || [], userData.stats as any)

        ws.send(JSON.stringify({
          type: 'complete',
          shareId: record.share_id,
          stats: userData.stats,
        }))
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        log.error({ err: message }, 'compile failed')
        ws.send(JSON.stringify({ type: 'error', message }))
      }
    })

    ws.on('close', () => log.info('client disconnected'))
  })

  log.info('websocket server ready')
}
