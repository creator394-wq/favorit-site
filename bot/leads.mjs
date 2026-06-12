// E8/E9 — Lead Manager + CRM. Хранит заявки в src/data/leads.json.
// Бот — обычный Node-процесс, поэтому randomUUID()/new Date() доступны.

import { readFile, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const LEADS_PATH = resolve(__dirname, '..', 'src', 'data', 'leads.json')

export const LEAD_STATUSES = ['new', 'in_progress', 'callback', 'closed', 'rejected']
export const STATUS_LABEL = {
  new: 'Новая',
  in_progress: 'В работе',
  callback: 'Перезвонить',
  closed: 'Закрыто',
  rejected: 'Отказ',
}

export async function readLeads() {
  try {
    const data = JSON.parse(await readFile(LEADS_PATH, 'utf8'))
    if (!Array.isArray(data.leads)) data.leads = []
    // мягкая миграция старых заявок без статуса/заметок
    for (const l of data.leads) {
      if (!l.status) l.status = 'new'
      if (!Array.isArray(l.notes)) l.notes = []
      if (!l.updatedAt) l.updatedAt = l.createdAt ?? ''
    }
    return data
  } catch {
    return { updatedAt: '', leads: [] }
  }
}

async function save(data) {
  data.updatedAt = new Date().toISOString()
  await writeFile(LEADS_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8')
}

/** Добавить заявку (имя и телефон обязательны). { ok, lead } | { ok:false, error }. */
export async function addLead({ name, phone, message } = {}) {
  const n = String(name ?? '').trim()
  const p = String(phone ?? '').trim()
  const m = String(message ?? '').trim()
  if (!n) return { ok: false, error: 'имя обязательно' }
  if (!p) return { ok: false, error: 'телефон обязателен' }

  const data = await readLeads()
  const now = new Date().toISOString()
  const lead = {
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
    name: n,
    phone: p,
    message: m,
    source: 'website',
    status: 'new',
    notes: [],
  }
  data.leads.push(lead)
  await save(data)
  return { ok: true, lead }
}

/** Найти заявку по точному id или префиксу (первые символы). */
export async function findLead(idOrPrefix) {
  if (!idOrPrefix) return null
  const { leads } = await readLeads()
  return leads.find((l) => l.id === idOrPrefix || l.id.startsWith(idOrPrefix)) ?? null
}

/** Сменить статус. { ok, lead } | { ok:false, error }. */
export async function setLeadStatus(idOrPrefix, status) {
  if (!LEAD_STATUSES.includes(status)) return { ok: false, error: `неизвестный статус «${status}»` }
  const data = await readLeads()
  const lead = data.leads.find((l) => l.id === idOrPrefix || l.id.startsWith(idOrPrefix))
  if (!lead) return { ok: false, error: 'заявка не найдена' }
  lead.status = status
  lead.updatedAt = new Date().toISOString()
  await save(data)
  return { ok: true, lead }
}

/** Добавить заметку к заявке. */
export async function addLeadNote(idOrPrefix, text) {
  const t = String(text ?? '').trim()
  if (!t) return { ok: false, error: 'пустая заметка' }
  const data = await readLeads()
  const lead = data.leads.find((l) => l.id === idOrPrefix || l.id.startsWith(idOrPrefix))
  if (!lead) return { ok: false, error: 'заявка не найдена' }
  lead.notes.push({ at: new Date().toISOString(), text: t })
  lead.updatedAt = new Date().toISOString()
  await save(data)
  return { ok: true, lead }
}

export async function clearLeads() {
  const data = { updatedAt: new Date().toISOString(), leads: [] }
  await writeFile(LEADS_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8')
  return data
}

/** Воронка: всего + по каждому статусу + сегодня/7 дней + конверсия + последняя. */
export async function leadStats() {
  const { leads } = await readLeads()
  const now = Date.now()
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const byStatus = Object.fromEntries(LEAD_STATUSES.map((s) => [s, 0]))
  for (const l of leads) byStatus[l.status] = (byStatus[l.status] ?? 0) + 1
  const today = leads.filter((l) => new Date(l.createdAt) >= startOfToday).length
  const week = leads.filter((l) => now - new Date(l.createdAt).getTime() <= 7 * 86400000).length
  const total = leads.length
  const conversion = total ? Math.round((byStatus.closed / total) * 100) : 0
  return { total, today, week, byStatus, conversion, last: leads[leads.length - 1] ?? null }
}

/** CSV-экспорт всех заявок. */
export async function exportLeadsCsv() {
  const { leads } = await readLeads()
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const header = ['id', 'createdAt', 'name', 'phone', 'message', 'source', 'status'].join(',')
  const rows = leads.map((l) =>
    [l.id, l.createdAt, l.name, l.phone, l.message, l.source, l.status].map(esc).join(','),
  )
  return [header, ...rows].join('\n') + '\n'
}
