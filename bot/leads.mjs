// E8 — Lead Manager data-слой. Хранит заявки в src/data/leads.json.
// Бот — обычный Node-процесс, поэтому randomUUID()/new Date() доступны.

import { readFile, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const LEADS_PATH = resolve(__dirname, '..', 'src', 'data', 'leads.json')

/** Прочитать leads.json (с безопасными дефолтами). */
export async function readLeads() {
  try {
    const data = JSON.parse(await readFile(LEADS_PATH, 'utf8'))
    if (!Array.isArray(data.leads)) data.leads = []
    return data
  } catch {
    return { updatedAt: '', leads: [] }
  }
}

/**
 * Добавить заявку с валидацией (имя и телефон обязательны).
 * Возвращает { ok, lead } | { ok:false, error }.
 */
export async function addLead({ name, phone, message } = {}) {
  const n = String(name ?? '').trim()
  const p = String(phone ?? '').trim()
  const m = String(message ?? '').trim()
  if (!n) return { ok: false, error: 'имя обязательно' }
  if (!p) return { ok: false, error: 'телефон обязателен' }

  const data = await readLeads()
  const lead = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    name: n,
    phone: p,
    message: m,
    source: 'website',
  }
  data.leads.push(lead)
  data.updatedAt = lead.createdAt
  await writeFile(LEADS_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8')
  return { ok: true, lead }
}

/** Полностью очистить заявки. */
export async function clearLeads() {
  const data = { updatedAt: new Date().toISOString(), leads: [] }
  await writeFile(LEADS_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8')
  return data
}

/** Статистика: всего / сегодня / за 7 дней / последняя. */
export async function leadStats() {
  const { leads } = await readLeads()
  const now = Date.now()
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const today = leads.filter((l) => new Date(l.createdAt) >= startOfToday).length
  const week = leads.filter((l) => now - new Date(l.createdAt).getTime() <= 7 * 86400000).length
  return { total: leads.length, today, week, last: leads[leads.length - 1] ?? null }
}
