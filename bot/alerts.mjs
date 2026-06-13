// E35 — Smart Alerts. Превращает структурные проблемы бизнеса (issues из
// analyzeBusiness) в Telegram-уведомления. Чтобы не спамить каждые 15 минут,
// у каждого вида тревоги есть кулдаун: повторно шлём не раньше, чем через
// ALERT_COOLDOWN_MS. Когда проблема исчезает — состояние сбрасывается, и при
// её повторном появлении тревога придёт заново.
//
// Все функции принимают готовый analysis (из operations.analyzeBusiness) —
// модуль НЕ импортирует operations, поэтому циклов зависимостей нет.

import { readStore, writeStore, nowIso } from './store.mjs'

const STATE_FILE = 'alerts.json'
const ALERT_COOLDOWN_MS = Number(process.env.ALERT_COOLDOWN_MINUTES) * 60000 || 6 * 3600000

async function readState() {
  const d = await readStore(STATE_FILE, { updatedAt: '', sent: {} })
  if (!d.sent || typeof d.sent !== 'object') d.sent = {}
  return d
}

/**
 * Активные тревоги из анализа. Каждая: { key, text, weight }.
 * key = вид проблемы (kind) → по нему идёт дедуп/кулдаун.
 */
export function buildAlerts(analysis) {
  const issues = analysis?.issues ?? []
  return issues.map((i) => ({
    key: i.kind,
    text: `⚠️ ${i.text}`,
    weight: i.weight ?? 0,
  }))
}

/**
 * Вернуть тревоги, которые ПОРА отправить (с учётом кулдауна), и записать факт
 * отправки. Сбрасывает из состояния ключи, которых уже нет среди активных, —
 * чтобы исчезнувшая и вновь возникшая проблема снова дала тревогу.
 */
export async function popNewAlerts(analysis) {
  const active = buildAlerts(analysis)
  const activeKeys = new Set(active.map((a) => a.key))
  const state = await readState()
  const now = Date.now()

  const toSend = []
  for (const a of active) {
    const lastIso = state.sent[a.key]
    const last = lastIso ? new Date(lastIso).getTime() : 0
    if (!last || now - last >= ALERT_COOLDOWN_MS) {
      toSend.push(a)
      state.sent[a.key] = nowIso()
    }
  }

  // Чистим разрешившиеся проблемы — их кулдаун больше не нужен.
  for (const key of Object.keys(state.sent)) {
    if (!activeKeys.has(key)) delete state.sent[key]
  }

  state.updatedAt = nowIso()
  await writeStore(STATE_FILE, state).catch(() => {})
  return toSend
}

/** Текст /alerts — все активные тревоги, отсортированные по весу (без кулдауна). */
export function formatAlerts(analysis) {
  const active = buildAlerts(analysis).sort((a, b) => b.weight - a.weight)
  if (!active.length) return '✅ Тревог нет — все системы в норме.'
  return '🚨 Активные тревоги\n\n' + active.map((a) => a.text).join('\n')
}
