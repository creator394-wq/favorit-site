// E32 — Task Center. Внутренние задачи цифрового операционного директора.
// Хранятся в src/data/tasks.json (runtime, gitignored) поверх makeCollection.
// Источник задачи (source) — стабильный ключ: либо ручной 'manual', либо вид
// проблемы из Priority Engine ('lead_overdue', 'no_news', …) — по нему идёт
// дедупликация авто-генерации (E33), чтобы не плодить дубли каждые 15 минут.

import { makeCollection, nowIso, shortId } from './store.mjs'

const tasks = makeCollection('tasks.json', 'tasks')

export const TASK_STATUSES = ['new', 'in_progress', 'waiting', 'done', 'cancelled']
export const TASK_PRIORITIES = ['low', 'medium', 'high', 'critical']

/** Открытые статусы — задача ещё «живёт» (для дедупа и счётчиков). */
export const OPEN_STATUSES = ['new', 'in_progress', 'waiting']

export const STATUS_LABEL = {
  new: '🆕 Новая',
  in_progress: '⏳ В работе',
  waiting: '⏸ Ожидание',
  done: '✅ Выполнена',
  cancelled: '🚫 Отменена',
}

export const PRIORITY_LABEL = {
  low: '🟢 Низкий',
  medium: '🟡 Средний',
  high: '🟠 Высокий',
  critical: '🔴 Критический',
}

// Порядок сортировки списка: сначала критичные и новые.
const PRIORITY_RANK = { critical: 0, high: 1, medium: 2, low: 3 }
const STATUS_RANK = { in_progress: 0, new: 1, waiting: 2, done: 3, cancelled: 4 }

const norm = (v, allowed, fallback) => (allowed.includes(v) ? v : fallback)
const isOpen = (t) => OPEN_STATUSES.includes(t.status)

/** Создать задачу. Обязателен title; остальное — с дефолтами. Возвращает запись. */
export async function createTask({
  title,
  description = '',
  source = 'manual',
  priority = 'medium',
  assignedTo = '',
  dueDate = '',
} = {}) {
  const t = String(title ?? '').trim()
  if (!t) return { ok: false, error: 'нужен заголовок задачи' }
  const rec = await tasks.add({
    updatedAt: nowIso(),
    title: t,
    description: String(description ?? '').trim(),
    source: String(source ?? 'manual'),
    priority: norm(priority, TASK_PRIORITIES, 'medium'),
    status: 'new',
    assignedTo: String(assignedTo ?? ''),
    dueDate: String(dueDate ?? ''),
  })
  return { ok: true, task: rec }
}

/**
 * Идемпотентное создание (E33). Если уже есть ОТКРЫТАЯ задача с тем же source —
 * не создаём дубль. Возвращает { created, task }.
 */
export async function ensureTask({ source, title, description = '', priority = 'medium' }) {
  const open = (await tasks.list()).filter(isOpen)
  const existing = open.find((t) => t.source === source)
  if (existing) return { created: false, task: existing }
  const r = await createTask({ title, description, source, priority })
  return { created: r.ok, task: r.task ?? null }
}

/** Все задачи или с фильтром по статусу. Открытые — сверху, по приоритету. */
export async function listTasks({ status } = {}) {
  let list = await tasks.list()
  if (status) list = list.filter((t) => t.status === status)
  return list.slice().sort((a, b) => {
    const s = (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9)
    if (s !== 0) return s
    return (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9)
  })
}

/** Только открытые задачи. */
export async function openTasks() {
  return (await listTasks()).filter(isOpen)
}

export async function findTask(idOrPrefix) {
  return tasks.find(idOrPrefix)
}

/** Сменить статус. { ok, task } | { ok:false, error }. */
export async function setTaskStatus(idOrPrefix, status) {
  if (!TASK_STATUSES.includes(status)) return { ok: false, error: `неизвестный статус «${status}»` }
  const t = await tasks.update(idOrPrefix, { status })
  if (!t) return { ok: false, error: 'задача не найдена' }
  return { ok: true, task: t }
}

export async function completeTask(idOrPrefix) {
  return setTaskStatus(idOrPrefix, 'done')
}
export async function cancelTask(idOrPrefix) {
  return setTaskStatus(idOrPrefix, 'cancelled')
}

/** Счётчики: всего, открытых, по статусам и приоритетам. */
export async function taskStats() {
  const list = await tasks.list()
  const byStatus = Object.fromEntries(TASK_STATUSES.map((s) => [s, 0]))
  const byPriority = Object.fromEntries(TASK_PRIORITIES.map((p) => [p, 0]))
  for (const t of list) {
    byStatus[t.status] = (byStatus[t.status] ?? 0) + 1
    if (isOpen(t)) byPriority[t.priority] = (byPriority[t.priority] ?? 0) + 1
  }
  const open = list.filter(isOpen).length
  return { total: list.length, open, byStatus, byPriority }
}

// ===== Форматтеры (Telegram) =====

const p2 = (n) => String(n).padStart(2, '0')
function dateRu(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return `${p2(d.getDate())}.${p2(d.getMonth() + 1)}.${d.getFullYear()}`
}

/** Однострочное представление для списка. */
export function taskLine(t) {
  const pr = PRIORITY_LABEL[t.priority] ?? t.priority
  return `${pr.slice(0, 2)} ${shortId(t.id)} · ${t.title}\n   ${STATUS_LABEL[t.status] ?? t.status}`
}

/** Карточка задачи для /task_view. */
export function taskCard(t) {
  return (
    `📋 Задача ${shortId(t.id)}\n\n` +
    `${t.title}\n\n` +
    (t.description ? `${t.description}\n\n` : '') +
    `Статус: ${STATUS_LABEL[t.status] ?? t.status}\n` +
    `Приоритет: ${PRIORITY_LABEL[t.priority] ?? t.priority}\n` +
    `Источник: ${t.source}\n` +
    (t.assignedTo ? `Ответственный: ${t.assignedTo}\n` : '') +
    (t.dueDate ? `Срок: ${dateRu(t.dueDate)}\n` : '') +
    `Создана: ${dateRu(t.createdAt)}`
  )
}

/** Текст /tasks: открытые задачи + сводка. */
export async function formatTaskList() {
  const list = await openTasks()
  const st = await taskStats()
  if (!list.length) {
    return `📋 Задачи\n\nОткрытых задач нет.\nВсего в журнале: ${st.total} · выполнено: ${st.byStatus.done}`
  }
  const body = list.slice(0, 20).map(taskLine).join('\n\n')
  return (
    `📋 Открытые задачи (${st.open})\n\n` +
    body +
    `\n\n——————————————\n` +
    `🔴 ${st.byPriority.critical} · 🟠 ${st.byPriority.high} · 🟡 ${st.byPriority.medium} · 🟢 ${st.byPriority.low}`
  )
}
