// E28 — общие чистые помощники для модулей-обработчиков. Без состояния и сайд-эффектов.
import { STATUS_LABEL } from '../leads.mjs'

export const LABELS = { ai92: 'АИ-92', ai95: 'АИ-95', dt: 'ДТ', gas: 'СУГ' }

export const SCOUT_NOT_CONFIGURED =
  '⚪ СКАУТ не настроен.\nДобавьте в .env: SCOUT_API_TOKEN (и при необходимости ' +
  'SCOUT_API_BASE). Интеграция строго read-only.'

// dd.mm.yyyy HH:MM / dd.mm.yyyy (бот — обычный Node, Date доступен)
export function formatRu(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
}
export function formatRuDate(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`
}

export const sid = (id) => String(id).slice(0, 8)

export const leadCard = (l) =>
  `📋 Заявка ${sid(l.id)}\n\n` +
  `Имя:\n${l.name}\n\n` +
  `Телефон:\n${l.phone}\n\n` +
  `Комментарий:\n${l.message || '—'}\n\n` +
  `Статус: ${STATUS_LABEL[l.status] ?? l.status}\n` +
  `Источник: ${l.source}\n` +
  `Создана: ${formatRu(l.createdAt)}\n` +
  (l.notes?.length
    ? '\nЗаметки:\n' + l.notes.map((n) => `• ${formatRuDate(n.at)}: ${n.text}`).join('\n')
    : '')
