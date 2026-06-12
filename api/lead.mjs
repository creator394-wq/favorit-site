// E8.1 — Vercel Serverless Function: POST /api/lead (production lead intake).
// На проде заявки НЕ хранятся в файле — достаточно Telegram-уведомления.
// Env (Vercel Project Settings): TELEGRAM_BOT_TOKEN, TELEGRAM_ADMIN_IDS.

const MAX_BODY = 10_000

function pad(n) {
  return String(n).padStart(2, '0')
}
// dd.mm.yyyy HH:MM
function formatRu(d = new Date()) {
  return (
    `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}`
  )
}

// Чтение тела из потока с ограничением размера (если req.body не распарсен).
function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ''
    let aborted = false
    req.on('data', (chunk) => {
      raw += chunk
      if (raw.length > MAX_BODY) {
        aborted = true
        reject(new Error('payload too large'))
        req.destroy()
      }
    })
    req.on('end', () => {
      if (aborted) return
      try {
        resolve(raw ? JSON.parse(raw) : {})
      } catch {
        reject(new Error('invalid json'))
      }
    })
    req.on('error', reject)
  })
}

async function notifyTelegram(lead) {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim()
  const ids = (process.env.TELEGRAM_ADMIN_IDS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (!token || ids.length === 0) {
    // Токен не логируем; сообщаем только факт отсутствия конфигурации.
    console.warn('lead: TELEGRAM_BOT_TOKEN/ADMIN_IDS не настроены — уведомление пропущено')
    return
  }
  const text =
    '🔔 Новая заявка\n\n' +
    `Имя:\n${lead.name}\n\n` +
    `Телефон:\n${lead.phone}\n\n` +
    `Комментарий:\n${lead.message || '—'}\n\n` +
    `Время:\n${formatRu()}\n\n` +
    `Источник:\n${lead.source}`
  const url = `https://api.telegram.org/bot${token}/sendMessage`
  await Promise.all(
    ids.map((id) =>
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: id, text }),
      }).catch(() => {}),
    ),
  )
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'method not allowed' })
    return
  }

  const len = Number(req.headers['content-length'] || 0)
  if (len > MAX_BODY) {
    res.status(413).json({ success: false, error: 'payload too large' })
    return
  }

  // Vercel часто парсит JSON в req.body; иначе читаем поток сами.
  let payload = req.body
  if (payload == null || typeof payload === 'string') {
    try {
      payload = typeof payload === 'string' && payload ? JSON.parse(payload) : await readBody(req)
    } catch (err) {
      res.status(400).json({ success: false, error: err.message })
      return
    }
  }

  const name = String(payload?.name ?? '').trim()
  const phone = String(payload?.phone ?? '').trim()
  const message = String(payload?.message ?? '').trim()
  if (!name) {
    res.status(400).json({ success: false, error: 'имя обязательно' })
    return
  }
  if (!phone) {
    res.status(400).json({ success: false, error: 'телефон обязателен' })
    return
  }

  await notifyTelegram({ name, phone, message, source: 'website' })
  res.status(200).json({ success: true })
}
