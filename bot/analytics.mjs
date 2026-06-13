// E23 — Analytics Intelligence. Реальная интеграция с Google Analytics 4
// (Data API v1beta). Трафик/страницы/источники берутся из GA4; конверсия и
// заявки считаются по РЕАЛЬНЫМ данным CRM (leads.json) — это не заглушка.
//
// Подключение GA4 (без правок кода, только .env):
//   GA4_PROPERTY_ID=123456789
//   и ЛИБО сервис-аккаунт:  GA_CLIENT_EMAIL=...  GA_PRIVATE_KEY="-----BEGIN...".
//   ЛИБО готовый токен:     GA4_ACCESS_TOKEN=ya29....
// Если ключей нет — трафик-команды честно сообщают «GA4 не подключён»,
// а конверсия/заявки работают всегда. Токены/ключи НЕ логируются.

import { createSign } from 'node:crypto'
import { leadStats, readLeads } from './leads.mjs'

const GA4_RUN_REPORT = (propertyId) =>
  `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`
const GA_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GA_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly'

/** Конфигурация GA4 из окружения. Секреты наружу не отдаём. */
export function getAnalyticsConfig() {
  const propertyId = process.env.GA4_PROPERTY_ID?.trim() || ''
  const hasToken = !!process.env.GA4_ACCESS_TOKEN?.trim()
  const hasServiceAccount =
    !!process.env.GA_CLIENT_EMAIL?.trim() && !!process.env.GA_PRIVATE_KEY?.trim()
  return {
    propertyId,
    hasCredentials: hasToken || hasServiceAccount,
    configured: !!propertyId && (hasToken || hasServiceAccount),
    method: hasToken ? 'access_token' : hasServiceAccount ? 'service_account' : 'none',
  }
}

const b64url = (input) => Buffer.from(input).toString('base64url')

// Кэш access-token до истечения, чтобы не подписывать JWT на каждый вызов.
let tokenCache = { value: '', exp: 0 }

/** Получить access token: готовый из env или через сервис-аккаунт (RS256 JWT). */
async function getAccessToken() {
  const direct = process.env.GA4_ACCESS_TOKEN?.trim()
  if (direct) return direct

  const email = process.env.GA_CLIENT_EMAIL?.trim()
  let key = process.env.GA_PRIVATE_KEY?.trim()
  if (!email || !key) return null
  key = key.replace(/\\n/g, '\n') // переводы строк, экранированные в .env

  const now = Math.floor(Date.now() / 1000)
  if (tokenCache.value && tokenCache.exp - 60 > now) return tokenCache.value

  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = b64url(
    JSON.stringify({ iss: email, scope: GA_SCOPE, aud: GA_TOKEN_URL, iat: now, exp: now + 3600 }),
  )
  const signer = createSign('RSA-SHA256')
  signer.update(`${header}.${claims}`)
  const signature = signer.sign(key, 'base64url')
  const assertion = `${header}.${claims}.${signature}`

  const res = await fetch(GA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  })
  if (!res.ok) throw new Error(`OAuth token error ${res.status}`)
  const json = await res.json()
  tokenCache = { value: json.access_token, exp: now + (json.expires_in ?? 3600) }
  return tokenCache.value
}

/** Низкоуровневый вызов GA4 runReport. { configured, data } | { configured:false }. */
async function runReport(body) {
  const cfg = getAnalyticsConfig()
  if (!cfg.configured) return { configured: false }
  const token = await getAccessToken()
  if (!token) return { configured: false }
  const res = await fetch(GA4_RUN_REPORT(cfg.propertyId), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`GA4 API ${res.status}`)
  return { configured: true, data: await res.json() }
}

const range = (days) => [{ startDate: `${days}daysAgo`, endDate: 'today' }]

/**
 * Сводка: трафик из GA4 (если подключён) + заявки/конверсия из CRM (всегда).
 * { gaConfigured, visitors, sessions, pageViews, leads, leadsWeek, conversion, gaError? }
 */
export async function getOverview(days = 7) {
  const stats = await leadStats()
  const cfg = getAnalyticsConfig()
  const out = {
    gaConfigured: cfg.configured,
    visitors: null,
    sessions: null,
    pageViews: null,
    leads: stats.total,
    leadsWeek: stats.week,
    conversion: stats.conversion,
  }
  try {
    const r = await runReport({
      dateRanges: range(days),
      metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }],
    })
    if (r.configured) {
      const m = r.data?.rows?.[0]?.metricValues?.map((v) => Number(v.value)) ?? [0, 0, 0]
      out.visitors = m[0] ?? 0
      out.sessions = m[1] ?? 0
      out.pageViews = m[2] ?? 0
    }
  } catch (err) {
    out.gaError = err.message // без токенов/ключей
  }
  return out
}

/** ТОП страниц по просмотрам. { configured, rows:[{path,views}] } | { configured:false }. */
export async function getTopPages(days = 7, limit = 5) {
  if (!getAnalyticsConfig().configured) return { configured: false }
  try {
    const r = await runReport({
      dateRanges: range(days),
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit,
    })
    if (!r.configured) return { configured: false }
    const rows = (r.data?.rows ?? []).map((row) => ({
      path: row.dimensionValues?.[0]?.value ?? '—',
      views: Number(row.metricValues?.[0]?.value ?? 0),
    }))
    return { configured: true, rows }
  } catch (err) {
    return { configured: true, error: err.message, rows: [] }
  }
}

/** Источники трафика (каналы). { configured, rows:[{source,sessions}] } | { configured:false }. */
export async function getTrafficSources(days = 7, limit = 8) {
  if (!getAnalyticsConfig().configured) return { configured: false }
  try {
    const r = await runReport({
      dateRanges: range(days),
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit,
    })
    if (!r.configured) return { configured: false }
    const rows = (r.data?.rows ?? []).map((row) => ({
      source: row.dimensionValues?.[0]?.value ?? '—',
      sessions: Number(row.metricValues?.[0]?.value ?? 0),
    }))
    return { configured: true, rows }
  } catch (err) {
    return { configured: true, error: err.message, rows: [] }
  }
}

/**
 * Конверсия — РЕАЛЬНЫЕ данные CRM. Если GA4 даёт сессии — добавляем конверсию
 * сайта (заявки/сессии). { total, closed, conversionPct, today, week, month,
 * sessions?, siteConversionPct?, gaConfigured }.
 */
export async function getConversion(days = 7) {
  const { leads } = await readLeads()
  const stats = await leadStats()
  const now = Date.now()
  const within = (d) =>
    leads.filter((l) => now - new Date(l.createdAt).getTime() <= d * 86400000).length
  const out = {
    total: stats.total,
    closed: stats.byStatus.closed,
    conversionPct: stats.conversion,
    today: stats.today,
    week: stats.week,
    month: within(30),
    gaConfigured: getAnalyticsConfig().configured,
  }
  try {
    const ov = await getOverview(days)
    if (ov.sessions && ov.sessions > 0) {
      out.sessions = ov.sessions
      out.siteConversionPct = Math.round((out.week / ov.sessions) * 100)
    }
  } catch {
    /* конверсия по CRM остаётся валидной без GA4 */
  }
  return out
}
