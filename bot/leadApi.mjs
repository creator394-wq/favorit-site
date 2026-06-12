// E8 — HTTP API приёма заявок с сайта. POST /api/lead.
// Встроенный node:http (без зависимостей). Пишет в leads.json и
// вызывает onLead(lead) для уведомления в Telegram.

import { createServer } from 'node:http'
import { addLead } from './leads.mjs'

const MAX_BODY = 10_000 // байт — защита от больших тел

function sendJson(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(obj))
}

/**
 * Запустить API. { port, onLead } — onLead(lead) вызывается после успешной записи.
 * Возвращает http.Server.
 */
export function startLeadApi({ port, onLead }) {
  const server = createServer((req, res) => {
    // CORS — сайт на другом origin может слать POST.
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    if (req.method === 'POST' && req.url === '/api/lead') {
      let body = ''
      let aborted = false
      req.on('data', (chunk) => {
        body += chunk
        if (body.length > MAX_BODY) {
          aborted = true
          sendJson(res, 413, { success: false, error: 'payload too large' })
          req.destroy()
        }
      })
      req.on('end', async () => {
        if (aborted) return
        let payload
        try {
          payload = JSON.parse(body || '{}')
        } catch {
          sendJson(res, 400, { success: false, error: 'invalid json' })
          return
        }
        const result = await addLead(payload)
        if (!result.ok) {
          sendJson(res, 400, { success: false, error: result.error })
          return
        }
        sendJson(res, 200, { success: true })
        if (onLead) Promise.resolve(onLead(result.lead)).catch(() => {})
      })
      return
    }

    sendJson(res, 404, { success: false, error: 'not found' })
  })

  server.listen(port, () => console.log(`✅ Lead API слушает :${port} (POST /api/lead)`))
  return server
}
