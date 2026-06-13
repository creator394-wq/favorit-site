// E22.1 — Audit Log: журнал изменений (цены, контент, заявки, деплой, backup).
// Хранится в data/audit.json (top-level, в .gitignore → не влияет на gitDeploy).
// logEvent безопасен: любые ошибки гасятся внутри, основной поток не ломается.

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = resolve(__dirname, '..')
const DATA_DIR = resolve(PROJECT_ROOT, 'data')
export const AUDIT_FILE = resolve(DATA_DIR, 'audit.json')

function nowIso() {
  return new Date().toISOString()
}

/** Прочитать audit.json. Никогда не бросает — при сбое отдаёт пустую структуру. */
export async function readAudit() {
  try {
    const d = JSON.parse(await readFile(AUDIT_FILE, 'utf8'))
    if (!Array.isArray(d.events)) d.events = []
    if (typeof d.updatedAt !== 'string') d.updatedAt = ''
    return d
  } catch {
    return { updatedAt: '', events: [] }
  }
}

/**
 * Записать событие в audit.json. НЕ бросает исключений: сбой аудита не должен
 * ломать основную операцию (изменение цен, деплой и т.д.).
 * Возвращает записанное событие или null.
 */
export async function logEvent({ userId, action, details } = {}) {
  try {
    const d = await readAudit()
    const ev = {
      id: randomUUID(),
      createdAt: nowIso(),
      userId: userId != null ? String(userId) : '',
      action: String(action ?? ''),
      details: String(details ?? ''),
    }
    d.events.push(ev)
    d.updatedAt = nowIso()
    await mkdir(DATA_DIR, { recursive: true })
    await writeFile(AUDIT_FILE, JSON.stringify(d, null, 2) + '\n', 'utf8')
    return ev
  } catch {
    return null
  }
}

/** Последние n событий, новые сверху. */
export async function recentEvents(n = 20) {
  const { events } = await readAudit()
  return events.slice(-n).reverse()
}

/** Самое последнее событие или null. */
export async function lastEvent() {
  const { events } = await readAudit()
  return events[events.length - 1] ?? null
}

/** Поиск по action/details (без учёта регистра), новые сверху. */
export async function searchEvents(term, limit = 20) {
  const q = String(term ?? '').trim().toLowerCase()
  if (!q) return []
  const { events } = await readAudit()
  return events
    .filter((e) => `${e.action} ${e.details}`.toLowerCase().includes(q))
    .slice(-limit)
    .reverse()
}

/** Количество событий в журнале. */
export async function auditCount() {
  return (await readAudit()).events.length
}

/** Последнее событие с action из переданного списка (для /system_status). */
export async function lastEventMatching(actions) {
  const set = new Set(actions)
  const { events } = await readAudit()
  for (let i = events.length - 1; i >= 0; i--) {
    if (set.has(events[i].action)) return events[i]
  }
  return null
}
