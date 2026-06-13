// E25 — AI Director. Анализирует бизнес по реальным данным (лиды, воронка,
// заявки, новости, акции, напоминания, сайт, аналитика) и формирует отчёт
// с проблемами и рекомендациями. Используется в /report и Daily Report 08:00.
// Чистый анализ: ничего не пишет, только читает. Все источники — мягко (try).

import { leadStats, readLeads } from './leads.mjs'
import { news, promos } from './collections.mjs'
import { listReminders } from './reminders.mjs'
import { checkHealth } from './monitor.mjs'
import { getOverview } from './analytics.mjs'

const DAY = 86400000
const OPEN_STATUSES = ['new', 'in_progress', 'callback']
const NEWS_STALE_DAYS = 7
const LEAD_STALE_DAYS = 2

function daysSince(iso) {
  if (!iso) return null
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return null
  return Math.floor((Date.now() - t) / DAY)
}

/** Собрать все метрики и вывести проблемы/рекомендации. */
async function gather() {
  const safe = (p, fallback) => p.then((v) => v).catch(() => fallback)
  const [stats, leadsData, newsList, promoList, reminders, health, overview] = await Promise.all([
    safe(leadStats(), { total: 0, today: 0, week: 0, conversion: 0, byStatus: {} }),
    safe(readLeads(), { leads: [] }),
    safe(news.list(), []),
    safe(promos.list(), []),
    safe(listReminders(), []),
    safe(checkHealth(), { ok: false }),
    safe(getOverview(7), null),
  ])
  const byStatus = {
    new: stats.byStatus?.new ?? 0,
    in_progress: stats.byStatus?.in_progress ?? 0,
    callback: stats.byStatus?.callback ?? 0,
    closed: stats.byStatus?.closed ?? 0,
    rejected: stats.byStatus?.rejected ?? 0,
  }

  // Застоявшиеся открытые лиды: давность последней активности.
  const open = (leadsData.leads ?? []).filter((l) => OPEN_STATUSES.includes(l.status))
  let staleCount = 0
  let staleMax = 0
  for (const l of open) {
    const lastNote = l.notes?.length ? l.notes[l.notes.length - 1].at : null
    const d = daysSince(lastNote || l.updatedAt || l.createdAt) ?? 0
    if (d >= LEAD_STALE_DAYS) {
      staleCount++
      if (d > staleMax) staleMax = d
    }
  }

  // Давность последней новости.
  const lastNews = newsList.length
    ? newsList.reduce((a, b) => (String(a.createdAt) > String(b.createdAt) ? a : b))
    : null
  const newsAge = lastNews ? daysSince(lastNews.createdAt) : null

  const problems = []
  if (!health.ok) problems.push('сайт недоступен')
  if (!newsList.length) problems.push('на сайте нет новостей')
  else if (newsAge != null && newsAge >= NEWS_STALE_DAYS)
    problems.push(`нет новых новостей ${newsAge} дней`)
  if (!promoList.length) problems.push('нет активных акций')
  if (staleCount > 0) problems.push(`открытые лиды без движения ${staleMax} дней (${staleCount} шт.)`)
  if (byStatus.new > 0) problems.push(`${byStatus.new} необработанных заявок`)
  if (byStatus.callback > 0) problems.push(`${byStatus.callback} ждут перезвона`)
  if (stats.total >= 5 && stats.conversion < 30) problems.push(`низкая конверсия ${stats.conversion}%`)

  const recommendations = []
  if (!health.ok) recommendations.push('Проверить доступность сайта (/health)')
  if (!newsList.length || (newsAge != null && newsAge >= NEWS_STALE_DAYS))
    recommendations.push('Создать новость (/news_create)')
  if (!promoList.length) recommendations.push('Опубликовать акцию (/promo_create)')
  if (staleCount > 0 || byStatus.new > 0 || byStatus.callback > 0)
    recommendations.push('Перезвонить клиентам (/leads, /lead_work)')
  if (!recommendations.length)
    recommendations.push('Всё под контролем — критичных действий не требуется')

  return {
    stats: { ...stats, byStatus },
    newsCount: newsList.length,
    promoCount: promoList.length,
    remindersCount: reminders.length,
    health,
    overview,
    newsAge,
    staleCount,
    staleMax,
    problems,
    recommendations,
  }
}

const bullets = (arr) => (arr.length ? arr.map((p) => `- ${p}`).join('\n') : '- не выявлено')
const numbered = (arr) => arr.map((r, i) => `${i + 1}. ${r}`).join('\n')

/** /report — отчёт директора. Возвращает { text, ...metrics }. */
export async function directorReport() {
  const g = await gather()
  const text =
    '📊 Отчёт директора\n\n' +
    `Лидов за неделю:\n${g.stats.week}\n\n` +
    `Закрыто:\n${g.stats.byStatus.closed}\n\n` +
    `Конверсия:\n${g.stats.conversion}%\n\n` +
    'Проблемы:\n' +
    bullets(g.problems) +
    '\n\n' +
    'Рекомендации:\n' +
    numbered(g.recommendations)
  return { text, ...g }
}

/** Daily Business Report (08:00). Возвращает { text, ...metrics }. */
export async function dailyReport() {
  const g = await gather()
  const s = g.stats
  const text =
    '📊 Daily Business Report\n\n' +
    `Сайт:\n${g.health.ok ? '🟢 ONLINE' : '🔴 OFFLINE'}\n\n` +
    `Заявки:\nсегодня ${s.today} · неделя ${s.week} · всего ${s.total}\n\n` +
    `Лиды:\nnew ${s.byStatus.new} · work ${s.byStatus.in_progress} · callback ${s.byStatus.callback} · closed ${s.byStatus.closed} · reject ${s.byStatus.rejected}\n\n` +
    `Конверсия:\n${s.conversion}%\n\n` +
    'Проблемы:\n' +
    bullets(g.problems) +
    '\n\n' +
    'Рекомендации:\n' +
    numbered(g.recommendations)
  return { text, ...g }
}
