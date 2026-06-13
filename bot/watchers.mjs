// E34 — Autonomous Watchers. Периодический (каждые 15 минут, из index.mjs)
// проход по бизнесу: запуск анализаторов, авто-генерация задач (E33) и сбор
// новых тревог с кулдауном (E35). Сам Telegram не трогает — возвращает данные,
// рассылку делает планировщик в index.mjs.

import {
  analyzeLeads,
  analyzeFleet,
  analyzeSite,
  analyzeContent,
  analyzeBusiness,
  generateTasks,
} from './operations.mjs'
import { popNewAlerts } from './alerts.mjs'
import { readPrices } from './prices.mjs'

const DAY = 86400000

// --- Именованные наблюдатели (каждый возвращает результат своего анализатора). ---
export async function watchLeads() {
  return analyzeLeads()
}
export async function watchFleet() {
  return analyzeFleet()
}
export async function watchSite() {
  return analyzeSite()
}
export async function watchContent() {
  return analyzeContent()
}

/** Наблюдатель цен: устаревание прайса (>14 дней без обновления). */
export async function watchPrices() {
  const p = await readPrices().catch(() => ({}))
  if (!p.updatedAt) return []
  const days = Math.floor((Date.now() - new Date(p.updatedAt).getTime()) / DAY)
  if (days >= 14)
    return [{ kind: 'stale_prices', weight: 15, section: 'Цены', text: `Цены не обновлялись ${days} дней` }]
  return []
}

/**
 * Один проход всех наблюдателей. Возвращает { analysis, tasks, alerts }:
 * tasks — вновь созданные задачи, alerts — тревоги, которые пора отправить.
 */
export async function runWatchers() {
  const analysis = await analyzeBusiness()
  const priceIssues = await watchPrices().catch(() => [])
  // Цены подмешиваем только в поток тревог (на задачи/score не влияют).
  const merged = { ...analysis, issues: [...analysis.issues, ...priceIssues] }
  const tasks = await generateTasks(analysis).catch(() => [])
  const alerts = await popNewAlerts(merged).catch(() => [])
  return { analysis, tasks, alerts }
}
