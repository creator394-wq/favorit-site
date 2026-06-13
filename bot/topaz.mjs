// E41-A — Topaz Group Photo Intake. Приём фото-отчётов Топаз из рабочей группы
// операторов. БЕЗ OCR — только надёжный приём и группировка фото в сменные
// сессии. В группу бот НИКОГДА не пишет; уведомления идут только админу в личку
// (TOPAZ_ADMIN_CHAT_ID). Хранилище — data/topaz_sessions.json (root, gitignored
// через /data/). OCR/распознавание будет в E41-B.

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { InlineKeyboard } from 'grammy'
import { logEvent } from './audit.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = resolve(__dirname, '..', 'data')
const STORE_FILE = resolve(DATA_DIR, 'topaz_sessions.json')

export const TOPAZ_STATUSES = ['collecting', 'ready', 'cancelled', 'processed']

// ===== Конфигурация (читается из окружения по вызову — как у Scout) =====
export function getTopazConfig() {
  return {
    groupId: process.env.TOPAZ_GROUP_ID?.trim() || '',
    adminChatId: process.env.TOPAZ_ADMIN_CHAT_ID?.trim() || '',
    groupTitle: process.env.TOPAZ_GROUP_TITLE?.trim() || '',
    idleMinutes: Number(process.env.TOPAZ_SESSION_IDLE_MINUTES) || 3,
  }
}
export function isTopazConfigured() {
  return !!getTopazConfig().groupId
}
export function getTopazAdminChatId() {
  return getTopazConfig().adminChatId
}
/** true, если апдейт пришёл из настроенной группы Топаз. */
export function isTopazGroup(ctx) {
  const gid = getTopazConfig().groupId
  return !!gid && String(ctx.chat?.id) === String(gid)
}

// ===== Хранилище (root data/, как audit.mjs; никогда не бросает на чтении) =====
function nowIso() {
  return new Date().toISOString()
}
async function readStore() {
  try {
    const d = JSON.parse(await readFile(STORE_FILE, 'utf8'))
    if (!Array.isArray(d.sessions)) d.sessions = []
    if (typeof d.updatedAt !== 'string') d.updatedAt = ''
    return d
  } catch {
    return { updatedAt: '', sessions: [] }
  }
}
async function writeStore(d) {
  d.updatedAt = nowIso()
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(STORE_FILE, JSON.stringify(d, null, 2) + '\n', 'utf8')
}

const matches = (s, idOrPrefix) => s.id === idOrPrefix || s.id.startsWith(idOrPrefix)
const short = (id) => String(id).slice(0, 8)

/** Имя оператора из ctx.from. */
function operatorName(from) {
  const full = [from?.first_name, from?.last_name].filter(Boolean).join(' ')
  return full || (from?.username ? `@${from.username}` : String(from?.id ?? 'unknown'))
}

/**
 * Принять фото: добавить в текущую collecting-сессию оператора или создать новую.
 * photo — самая большая версия { file_id, file_unique_id }. Возвращает
 * { session, isNew }. Аудит — без полного file_id (только photoCount/id/operator).
 */
export async function createOrUpdateTopazSession(ctx, photo) {
  const cfg = getTopazConfig()
  const d = await readStore()
  const operatorId = String(ctx.from?.id ?? '')
  const groupId = String(ctx.chat?.id ?? '')

  let session = d.sessions.find(
    (s) => s.status === 'collecting' && s.operatorId === operatorId && s.groupId === groupId,
  )
  let isNew = false
  if (!session) {
    isNew = true
    session = {
      id: randomUUID(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
      status: 'collecting',
      groupId,
      groupTitle: ctx.chat?.title || cfg.groupTitle || '',
      operatorId,
      operatorName: operatorName(ctx.from),
      photoCount: 0,
      photos: [],
    }
    d.sessions.push(session)
  }

  session.photos.push({
    fileId: photo?.file_id ?? '',
    uniqueId: photo?.file_unique_id ?? '',
    receivedAt: nowIso(),
  })
  session.photoCount = session.photos.length
  session.updatedAt = nowIso()
  await writeStore(d)

  await logEvent({
    userId: 'system',
    action: 'topaz_photo_received',
    details: `session ${short(session.id)} · ${session.operatorName} · photo #${session.photoCount}`,
  })
  return { session, isNew }
}

/** Последние сессии (новые сверху). */
export async function listTopazSessions(limit = 10) {
  const { sessions } = await readStore()
  return sessions
    .slice()
    .sort((a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt))
    .slice(0, limit)
}

export async function getTopazSession(idOrPrefix) {
  if (!idOrPrefix) return null
  const { sessions } = await readStore()
  return sessions.find((s) => matches(s, idOrPrefix)) ?? null
}

/** Сводка по статусам (для /topaz_status). */
export async function topazSessionCounts() {
  const { sessions } = await readStore()
  const counts = Object.fromEntries(TOPAZ_STATUSES.map((s) => [s, 0]))
  for (const s of sessions) counts[s.status] = (counts[s.status] ?? 0) + 1
  return { total: sessions.length, ...counts }
}

async function setStatus(idOrPrefix, status, { from } = {}) {
  const d = await readStore()
  const s = d.sessions.find((x) => matches(x, idOrPrefix))
  if (!s) return { ok: false, error: 'сессия не найдена' }
  if (from && (status === 'processed' || status === 'ready') && !['collecting', 'ready'].includes(s.status)) {
    // защита: processed/ready только из collecting/ready
    return { ok: false, error: `нельзя из статуса «${s.status}»` }
  }
  s.status = status
  s.updatedAt = nowIso()
  await writeStore(d)
  return { ok: true, session: s }
}

/** Отменить сессию (любой статус → cancelled). */
export async function cancelTopazSession(idOrPrefix) {
  const r = await setStatus(idOrPrefix, 'cancelled')
  if (r.ok)
    await logEvent({
      userId: 'system',
      action: 'topaz_session_cancelled',
      details: `session ${short(r.session.id)} · ${r.session.operatorName} · ${r.session.photoCount} photo`,
    })
  return r
}

/** Перевести в processed (ready/collecting → processed). OCR не выполняется. */
export async function processTopazSession(idOrPrefix) {
  const r = await setStatus(idOrPrefix, 'processed', { from: true })
  if (r.ok)
    await logEvent({
      userId: 'system',
      action: 'topaz_session_processed',
      details: `session ${short(r.session.id)} · ${r.session.operatorName} · ${r.session.photoCount} photo`,
    })
  return r
}

/** Inline-клавиатура управления сессией (для ready-уведомления и просмотра). */
export function topazSessionKeyboard(id) {
  return new InlineKeyboard()
    .text('👁 Просмотр', `topaz:view:${id}`)
    .row()
    .text('✅ Подтвердить получение', `topaz:process:${id}`)
    .row()
    .text('❌ Отменить', `topaz:cancel:${id}`)
}

/**
 * Авто-финализация: collecting-сессии без новых фото дольше idleMinutes →
 * ready + уведомление админу в личку с кнопками. Возвращает финализированные.
 */
export async function finalizeIdleTopazSessions(bot) {
  const cfg = getTopazConfig()
  if (!cfg.groupId) return []
  const d = await readStore()
  const now = Date.now()
  const idleMs = cfg.idleMinutes * 60000
  const finalized = []
  for (const s of d.sessions) {
    if (s.status !== 'collecting') continue
    if (now - new Date(s.updatedAt).getTime() < idleMs) continue
    s.status = 'ready'
    s.updatedAt = nowIso()
    finalized.push(s)
  }
  if (!finalized.length) return []
  await writeStore(d)

  for (const s of finalized) {
    await logEvent({
      userId: 'system',
      action: 'topaz_session_ready',
      details: `session ${short(s.id)} · ${s.operatorName} · ${s.photoCount} photo`,
    })
    if (cfg.adminChatId) {
      const text =
        '✅ Отчёт Топаз готов к обработке\n\n' +
        `Сессия:\n${short(s.id)}\n\n` +
        `Оператор:\n${s.operatorName}\n\n` +
        `Фото:\n${s.photoCount}`
      try {
        await bot.api.sendMessage(cfg.adminChatId, text, { reply_markup: topazSessionKeyboard(s.id) })
      } catch {
        /* недоставленное уведомление не валит планировщик */
      }
    }
  }
  return finalized
}

// ===== Форматтеры (Telegram) =====
const p2 = (n) => String(n).padStart(2, '0')
function dateRu(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return `${p2(d.getDate())}.${p2(d.getMonth() + 1)}.${d.getFullYear()} ${p2(d.getHours())}:${p2(d.getMinutes())}`
}

/**
 * Короткое уведомление админу при приёме фото. Первое фото новой сессии
 * (photoCount === 1) → «Получен отчёт», далее → «Добавлено фото».
 */
export function formatTopazSessionNotice(session) {
  if (session.photoCount <= 1) {
    return (
      '📄 Получен отчёт Топаз\n\n' +
      `Группа:\n${session.groupTitle || '—'}\n\n` +
      `Оператор:\n${session.operatorName}\n\n` +
      `Фото:\n${session.photoCount}\n\n` +
      `Сессия:\n${short(session.id)}\n\n` +
      'Бот собирает фото. Когда оператор закончит, сессия будет готова автоматически.'
    )
  }
  return (
    '📄 Добавлено фото к отчёту\n\n' +
    `Оператор:\n${session.operatorName}\n\n` +
    `Фото:\n${session.photoCount}\n\n` +
    `Сессия:\n${short(session.id)}`
  )
}

const STATUS_LABEL = {
  collecting: '🟡 Собирается',
  ready: '✅ Готова',
  cancelled: '🚫 Отменена',
  processed: '📦 Обработана',
}

/** Карточка сессии для /topaz_view и callback view. */
export function formatTopazSessionCard(session) {
  return (
    `🧾 Сессия Топаз ${short(session.id)}\n\n` +
    `Оператор:\n${session.operatorName}\n\n` +
    `Группа:\n${session.groupTitle || '—'}\n\n` +
    `Статус: ${STATUS_LABEL[session.status] ?? session.status}\n` +
    `Фото: ${session.photoCount}\n\n` +
    `Создана: ${dateRu(session.createdAt)}\n` +
    `Обновлена: ${dateRu(session.updatedAt)}`
  )
}

export const topazShortId = short
