// E11 — Напоминания по заявкам. Хранятся в src/data/reminders.json
// (runtime, gitignored). Планировщик в index.mjs опрашивает due-напоминания.

import { makeCollection, nowIso } from './store.mjs'

const reminders = makeCollection('reminders.json', 'reminders')

/**
 * Разобрать время: относительное (30m / 4h / 2d) или абсолютное
 * "YYYY-MM-DD HH:MM". Возвращает ISO-строку или null.
 */
export function parseWhen(parts) {
  const raw = parts.join(' ').trim()
  if (!raw) return null
  const rel = raw.match(/^(\d+)\s*(m|h|d)$/i)
  if (rel) {
    const n = Number(rel[1])
    const unit = rel[2].toLowerCase()
    const ms = unit === 'm' ? 60000 : unit === 'h' ? 3600000 : 86400000
    return new Date(Date.now() + n * ms).toISOString()
  }
  const abs = raw.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/)
  if (abs) {
    const [, y, mo, d, h, mi] = abs
    const dt = new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), 0)
    if (!Number.isNaN(dt.getTime())) return dt.toISOString()
  }
  return null
}

export async function addReminder({ leadId, dueAt, text }) {
  return reminders.add({ leadId: leadId ?? '', dueAt, text: text ?? '' })
}
export async function listReminders() {
  return (await reminders.list()).slice().sort((a, b) => a.dueAt.localeCompare(b.dueAt))
}
export async function cancelReminder(idOrPrefix) {
  return reminders.remove(idOrPrefix)
}

/** Вернуть и удалить напоминания, срок которых наступил (dueAt <= now). */
export async function popDueReminders() {
  const data = await reminders.all()
  const now = nowIso()
  const due = data.reminders.filter((r) => r.dueAt && r.dueAt <= now)
  if (due.length) {
    data.reminders = data.reminders.filter((r) => !(r.dueAt && r.dueAt <= now))
    const { writeStore } = await import('./store.mjs')
    await writeStore('reminders.json', data)
  }
  return due
}
