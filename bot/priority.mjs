// E36 — Priority Engine V2. Чистый модуль без состояния и сайд-эффектов.
// Каждая проблема бизнеса имеет «вид» (kind) и вес. Сумма весов активных
// проблем даёт priorityScore, который маппится в уровень LOW/MEDIUM/HIGH/CRITICAL.
// Используется operations.mjs (analyzeBusiness), alerts.mjs и watchers.mjs.

/** Вес каждого вида проблемы. Сайт офлайн доминирует над всем остальным. */
export const PROBLEM_WEIGHTS = {
  site_offline: 100,
  lead_overdue: 40,
  callback_overdue: 35,
  fleet_offline: 35,
  low_conversion: 25,
  no_leads: 20,
  no_driver: 20,
  no_fuel: 15,
  stale_news: 15,
  no_news: 15,
  high_reject: 10,
  idling: 10,
  no_promo: 10,
}

/** Вес по виду проблемы (0, если вид неизвестен). */
export function weightFor(kind) {
  return PROBLEM_WEIGHTS[kind] ?? 0
}

/** Сумма весов списка issue ({ kind, weight }). weight в issue имеет приоритет. */
export function priorityScore(issues = []) {
  return issues.reduce((sum, i) => sum + (i.weight ?? weightFor(i.kind)), 0)
}

/** Уровень приоритета по сумме весов. 0–20 LOW · 20–50 MEDIUM · 50–80 HIGH · 80+ CRITICAL. */
export function priorityLevel(score) {
  if (score >= 80) return 'CRITICAL'
  if (score >= 50) return 'HIGH'
  if (score >= 20) return 'MEDIUM'
  return 'LOW'
}

/** Эмодзи-маркер уровня (для Telegram-вывода). */
export const LEVEL_EMOJI = {
  LOW: '🟢',
  MEDIUM: '🟡',
  HIGH: '🟠',
  CRITICAL: '🔴',
}

/** «🔴 CRITICAL» — уровень с маркером. */
export function levelBadge(level) {
  return `${LEVEL_EMOJI[level] ?? '⚪'} ${level}`
}
