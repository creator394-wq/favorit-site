// E42 — Morning CEO Report + Shift Ledger (контур №1: ДОХОДЫ / Топаз).
// Хранит ПОДТВЕРЖДЁННЫЕ смены Топаз (data/topaz_ledger.json, root → gitignored
// через /data/) и собирает короткую управленческую сводку для владельца.
//
// АРХИТЕКТУРА КОНТУРОВ (важно — не смешивать):
//   Контур №1 TOPAZ   = доходы. Источник: группа МАЗС Камышлов → смены/OCR.   ← здесь.
//   Контур №2 EXPENSES = расходы. Отдельная Telegram-группа, отдельный поток.   ← E43, НЕ реализовано.
// Transport/Scout в этот поток НЕ входят: сверок Topaz ↔ Scout нет.
//
// Задел под расходы (E43, только тип — не реализуется сейчас):
//   ExpenseRecord = {
//     id, date, category, amount, currency, comment,
//     sourceGroupId, sourceMessageId, createdAt
//   }
//   Хранилище: data/expenses_ledger.json (отдельное от topaz_ledger.json).
//   Контуры не смешиваются: доход (Топаз) и расход (Expenses) живут раздельно.

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = resolve(__dirname, '..', 'data')
const LEDGER_FILE = resolve(DATA_DIR, 'topaz_ledger.json')

const nowIso = () => new Date().toISOString()
const NF = 'не найдено'

// ===== Хранилище смен (никогда не бросает на чтении) =====
async function readLedger() {
  try {
    const d = JSON.parse(await readFile(LEDGER_FILE, 'utf8'))
    if (!Array.isArray(d.shifts)) d.shifts = []
    if (typeof d.updatedAt !== 'string') d.updatedAt = ''
    return d
  } catch {
    return { updatedAt: '', shifts: [] }
  }
}
async function writeLedger(d) {
  d.updatedAt = nowIso()
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(LEDGER_FILE, JSON.stringify(d, null, 2) + '\n', 'utf8')
}

// ===== Даты =====
const p2 = (n) => String(n).padStart(2, '0')
/** 'DD.MM.YYYY[ HH:MM:SS]' → 'YYYY-MM-DD' (ключ для сравнения) или null. */
function ruToKey(s) {
  const m = String(s ?? '').match(/(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})/)
  if (!m) return null
  let [, dd, mm, yy] = m
  if (yy.length === 2) yy = '20' + yy
  return `${yy}-${p2(mm)}-${p2(dd)}`
}
/** Ключ YYYY-MM-DD для сегодня + offset дней. */
function dayKey(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`
}
function keyToRu(key) {
  const m = String(key ?? '').match(/(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[3]}.${m[2]}.${m[1]}` : key
}

// ===== Ledger API =====
/**
 * Добавить ПОДТВЕРЖДЁННУЮ смену из structuredReport (парсер E41-B3).
 * Дедуп по sourceSessionId: одна сессия (= одна смена) → одна запись.
 * { created, record }.
 */
export async function addShift({ structured, sourceSessionId }) {
  const d = await readLedger()
  const existing = d.shifts.find((s) => s.sourceSessionId === sourceSessionId)
  if (existing) return { created: false, record: existing }
  const s = structured ?? {}
  const record = {
    id: randomUUID(),
    date: s.reportDate ?? (s.shiftStart ? String(s.shiftStart).split(/\s+/)[0] : null),
    station: s.station ?? null,
    shiftNumber: s.shiftNumber ?? null,
    operator: s.operator ?? null,
    shiftStart: s.shiftStart ?? null,
    shiftEnd: s.shiftEnd ?? null,
    fuel: s.fuel ?? { detected: [] },
    sales: s.sales ?? null,
    totals: s.totals ?? { numbers: [] },
    sourceSessionId: sourceSessionId ?? null,
    createdAt: nowIso(),
  }
  d.shifts.push(record)
  await writeLedger(d)
  return { created: true, record }
}

export async function listShifts() {
  return (await readLedger()).shifts
}
export async function shiftsForKey(key) {
  return (await listShifts()).filter((s) => ruToKey(s.date) === key)
}
export async function latestShift() {
  const shifts = await listShifts()
  return shifts.length
    ? shifts.slice().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))[0]
    : null
}

// ===== Форматирование (Morning CEO Report) =====
const v = (x) => (x == null || x === '' ? NF : x)
const FUEL_ORDER = ['ГАЗ', 'АИ-92', 'АИ-95', 'ДТ']

/** 📊 FAVORIT АЗС — карточка одной смены. Чего нет — честно «не найдено». */
export function formatCeoReport(rec) {
  const detected = rec.fuel?.detected ?? []
  const salesBlock = FUEL_ORDER.map((f) => `${f}: ${detected.includes(f) ? 'обнаружено' : NF}`).join('\n')
  const nums = rec.totals?.numbers ?? []
  const numsLine = nums.length ? nums.slice(0, 12).join(', ') : NF
  return (
    '📊 FAVORIT АЗС\n\n' +
    `АЗС:\n${v(rec.station)}\n\n` +
    `Смена:\n${v(rec.shiftNumber)}\n\n` +
    `Оператор:\n${v(rec.operator)}\n\n` +
    `Начало смены:\n${v(rec.shiftStart)}\n` +
    `Окончание смены:\n${v(rec.shiftEnd)}\n\n` +
    `Продажи:\n${salesBlock}\n\n` +
    `Выручка:\n${NF}\n\n` +
    `Остатки:\n${NF}\n\n` +
    `Числовые показатели (OCR):\n${numsLine}\n\n` +
    'Источник:\nТопаз\n\n' +
    'Статус:\nПодтверждено'
  )
}

function joinReports(recs) {
  return recs.map(formatCeoReport).join('\n\n——————————————\n\n').slice(0, 3900)
}

/** /report_today */
export async function reportToday() {
  const key = dayKey(0)
  const recs = await shiftsForKey(key)
  return recs.length
    ? joinReports(recs)
    : `📊 FAVORIT АЗС\n\nЗа сегодня (${keyToRu(key)}) подтверждённых смен не найдено.`
}
/** /report_yesterday */
export async function reportYesterday() {
  const key = dayKey(-1)
  const recs = await shiftsForKey(key)
  return recs.length
    ? joinReports(recs)
    : `📊 FAVORIT АЗС\n\nЗа вчера (${keyToRu(key)}) подтверждённых смен не найдено.`
}
/** /report_last + утренняя авто-сводка. */
export async function reportLast() {
  const rec = await latestShift()
  return rec ? formatCeoReport(rec) : '📊 FAVORIT АЗС\n\nПодтверждённых смен пока нет.'
}

/** Текст утренней сводки (последняя подтверждённая смена). */
export async function morningReportText() {
  return '☀️ Утренняя сводка\n\n' + (await reportLast())
}
