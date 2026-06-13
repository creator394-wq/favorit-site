// E30/E31 — Operations Director + Daily CEO Report. Активный анализ бизнеса:
// CRM, транспорт (СКАУТ), сайт, контент → проблемы, CEO Score, приоритет.
// Чистое чтение (ничего не меняет). Все источники — мягко (catch → дефолты).

import { leadStats, readLeads } from './leads.mjs'
import { getFleetStats } from './scout.mjs'
import { checkHealth } from './monitor.mjs'
import { news, promos } from './collections.mjs'
import { readPrices } from './prices.mjs'

const DAY = 86400000
const HOUR = 3600000

const p2 = (n) => String(n).padStart(2, '0')
function dateRu(d = new Date()) {
  return `${p2(d.getDate())}.${p2(d.getMonth() + 1)}.${d.getFullYear()}`
}
function timeRu(d = new Date()) {
  return `${p2(d.getHours())}:${p2(d.getMinutes())}`
}

// ===== Анализаторы =====

/** Проблемы CRM: необработанные >24ч, просроченные callback, отказы, конверсия. */
export async function analyzeLeads() {
  const [stats, data] = await Promise.all([
    leadStats().catch(() => ({
      total: 0,
      today: 0,
      week: 0,
      conversion: 0,
      byStatus: { new: 0, in_progress: 0, callback: 0, closed: 0, rejected: 0 },
    })),
    readLeads().catch(() => ({ leads: [] })),
  ])
  const now = Date.now()
  const leads = data.leads ?? []
  const unprocessed = leads.filter(
    (l) => l.status === 'new' && now - new Date(l.createdAt).getTime() > 24 * HOUR,
  )
  const callbackOverdue = leads.filter(
    (l) => l.status === 'callback' && now - new Date(l.updatedAt || l.createdAt).getTime() > 24 * HOUR,
  )
  const overdue = unprocessed.length + callbackOverdue.length
  const problems = []
  if (unprocessed.length) problems.push(`${unprocessed.length} заявки без обработки >24ч`)
  if (callbackOverdue.length) problems.push(`${callbackOverdue.length} просроченных перезвонов`)
  if (stats.total >= 5 && stats.conversion < 30) problems.push(`низкая конверсия ${stats.conversion}%`)
  if (stats.total >= 5 && stats.byStatus.rejected / stats.total >= 0.5)
    problems.push(`много отказов (${stats.byStatus.rejected})`)
  const oldestOpen =
    [...unprocessed, ...callbackOverdue].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )[0] ?? null
  return { problems, stats, overdue, oldestOpen }
}

/** Проблемы транспорта: offline, нет топлива, простой (двигатель/скорость 0), нет водителя. */
export async function analyzeFleet() {
  const stats = await getFleetStats().catch(() => ({ error: true }))
  if (stats == null) return { configured: false, problems: [], stats: null }
  if (stats.error) return { configured: true, error: true, problems: ['СКАУТ недоступен'], stats: null }
  const problems = []
  if (stats.offline > 0) problems.push(`${stats.offline} машин(а) offline`)
  if (stats.noFuel.length > 0) problems.push(`${stats.noFuel.length} без датчика топлива`)
  if (stats.idling > 0) problems.push(`${stats.idling} с работающим двигателем на стоянке`)
  if (stats.noDriver.length > 0) problems.push(`${stats.noDriver.length} без водителя`)
  return { configured: true, problems, stats }
}

/** Проблемы сайта: доступность + нет заявок длительное время. */
export async function analyzeSite() {
  const [h, data] = await Promise.all([
    checkHealth().catch(() => ({ ok: false })),
    readLeads().catch(() => ({ leads: [] })),
  ])
  const leads = data.leads ?? []
  const lastLead = leads.length
    ? leads.reduce((a, b) => (new Date(a.createdAt) > new Date(b.createdAt) ? a : b))
    : null
  const daysNoLeads = lastLead
    ? Math.floor((Date.now() - new Date(lastLead.createdAt).getTime()) / DAY)
    : null
  const problems = []
  if (!h.ok) problems.push('сайт недоступен')
  if (daysNoLeads != null && daysNoLeads >= 3) problems.push(`нет заявок ${daysNoLeads} дней`)
  return { ok: h.ok, problems, daysNoLeads }
}

/** Проблемы контента: устаревшие/отсутствующие новости, отсутствие акций. */
export async function analyzeContent() {
  const [newsList, promoList] = await Promise.all([
    news.list().catch(() => []),
    promos.list().catch(() => []),
  ])
  const newest = (arr) =>
    arr.length ? arr.reduce((a, b) => (String(a.createdAt) > String(b.createdAt) ? a : b)) : null
  const lastAny = newest([...newsList, ...promoList])
  const lastNews = newest(newsList)
  const ageDays = (rec) =>
    rec ? Math.floor((Date.now() - new Date(rec.createdAt).getTime()) / DAY) : null
  const newsAge = ageDays(lastNews)
  const problems = []
  if (!newsList.length) problems.push('нет новостей')
  else if (newsAge != null && newsAge >= 7) problems.push(`нет новостей ${newsAge} дней`)
  if (!promoList.length) problems.push('нет акций')
  return {
    newsCount: newsList.length,
    promoCount: promoList.length,
    newsAge,
    lastPublishDays: ageDays(lastAny),
    problems,
  }
}

// ===== E31.1 CEO Score / E31.2 Priority =====

function computeCeoScore({ crm, fleet, site, content }) {
  let score = 100
  if (!site.ok) score -= 40
  if (site.daysNoLeads != null && site.daysNoLeads >= 3) score -= 10
  score -= Math.min(20, crm.overdue * 7)
  if (crm.stats.total >= 5 && crm.stats.conversion < 30) score -= 10
  if (fleet.stats) {
    score -= Math.min(15, fleet.stats.offline * 5)
    score -= Math.min(10, fleet.stats.noFuel.length * 2)
    score -= Math.min(8, (fleet.stats.noDriver?.length ?? 0) * 3)
  }
  if (content.newsCount === 0 || (content.newsAge != null && content.newsAge >= 7)) score -= 10
  if (content.promoCount === 0) score -= 5
  return Math.max(0, Math.min(100, Math.round(score)))
}

function computePriority({ site }, problemsCount) {
  if (!site.ok) return 'CRITICAL'
  if (problemsCount === 0) return 'LOW'
  if (problemsCount <= 2) return 'MEDIUM'
  if (problemsCount <= 4) return 'HIGH'
  return 'CRITICAL'
}

function pickTop({ crm, fleet, site, content, problems }) {
  if (!site.ok)
    return { topProblem: 'Сайт недоступен', recommendation: 'Проверить доступность сайта (/health)' }
  if (crm.overdue > 0) {
    const name = crm.oldestOpen?.name
    return {
      topProblem: `${crm.overdue} заявок без своевременной обработки`,
      recommendation: name ? `Связаться с клиентом ${name} (/leads)` : 'Обработать заявки (/leads, /lead_work)',
    }
  }
  if (fleet.stats?.offline > 0)
    return {
      topProblem: `${fleet.stats.offline} машин offline`,
      recommendation: 'Проверить связь с машинами (/scout_offline)',
    }
  if (content.problems.length)
    return {
      topProblem: content.problems[0],
      recommendation:
        content.newsCount === 0 || (content.newsAge != null && content.newsAge >= 7)
          ? 'Создать новость (/news_create)'
          : 'Опубликовать акцию (/promo_create)',
    }
  if (problems.length)
    return { topProblem: problems[0].text, recommendation: 'Разобрать отмеченные проблемы' }
  return { topProblem: null, recommendation: 'Всё под контролем — критичных действий не требуется' }
}

/** Главный агрегатор: собирает все анализаторы, считает CEO Score и приоритет. */
export async function analyzeBusiness() {
  const [crm, fleet, site, content] = await Promise.all([
    analyzeLeads(),
    analyzeFleet(),
    analyzeSite(),
    analyzeContent(),
  ])
  const problems = [
    ...crm.problems.map((text) => ({ section: 'CRM', text })),
    ...fleet.problems.map((text) => ({ section: 'Транспорт', text })),
    ...content.problems.map((text) => ({ section: 'Контент', text })),
    ...site.problems.map((text) => ({ section: 'Сайт', text })),
  ]
  const ceoScore = computeCeoScore({ crm, fleet, site, content })
  const priority = computePriority({ site }, problems.length)
  const { topProblem, recommendation } = pickTop({ crm, fleet, site, content, problems })
  return { crm, fleet, site, content, problems, ceoScore, priority, topProblem, recommendation }
}

// ===== E31 — Daily CEO Report =====

function ratingLine(score) {
  if (score >= 80) return '🟢 Бизнес стабилен'
  if (score >= 50) return '🟡 Требует внимания'
  return '🔴 Критическая ситуация'
}

/** Полный текст CEO-отчёта. { text, score, priority }. */
export async function ceoReport() {
  const [b, p] = await Promise.all([analyzeBusiness(), readPrices().catch(() => ({}))])
  const now = new Date()

  // ⛽ АЗС — актуальность цен (по общему updatedAt prices.json).
  const priceAge = p.updatedAt ? (Date.now() - new Date(p.updatedAt).getTime()) / DAY : null
  const priceLabel = priceAge == null ? 'нет данных' : priceAge <= 7 ? 'Цены актуальны' : '⚠️ Цены устарели'
  const stations = p.stations ? Object.values(p.stations) : []
  const azsBlock = stations.length
    ? stations.map((st) => `${st.name}:\n${priceLabel}`).join('\n\n')
    : 'нет данных по АЗС'

  // 📞 CRM
  const s = b.crm.stats
  const crmBlock =
    `Сегодня:\n${s.today} заявки\n\n` +
    `Неделя:\n${s.week} заявок\n\n` +
    `Конверсия:\n${s.conversion}%\n\n` +
    `Просрочено:\n${b.crm.overdue}`

  // 🚚 Транспорт
  let fleetBlock
  if (!b.fleet.configured) fleetBlock = 'СКАУТ не подключён'
  else if (b.fleet.error || !b.fleet.stats) fleetBlock = 'СКАУТ недоступен'
  else {
    const f = b.fleet.stats
    fleetBlock =
      `Всего:\n${f.total} машины\n\n` +
      `В работе:\n${f.engineOn}\n\n` +
      `Стоят:\n${f.total - f.engineOn}\n\n` +
      `Offline:\n${f.offline}`
  }

  // 📰 Контент
  const contentBlock =
    `Новости:\n${b.content.newsCount}\n\n` +
    `Акции:\n${b.content.promoCount}\n\n` +
    `Последняя публикация:\n${b.content.lastPublishDays == null ? '—' : `${b.content.lastPublishDays} дней назад`}`

  const text =
    '🏢 FAVORIT Daily CEO Report\n\n' +
    `Дата:\n${dateRu(now)}\n\n` +
    '——————————————\n\n' +
    `⛽ АЗС\n\n${azsBlock}\n\n` +
    '——————————————\n\n' +
    `📞 CRM\n\n${crmBlock}\n\n` +
    '——————————————\n\n' +
    `🚚 Транспорт\n\n${fleetBlock}\n\n` +
    '——————————————\n\n' +
    `🌐 Сайт\n\nСтатус:\n${b.site.ok ? 'ONLINE' : 'OFFLINE'}\n\nПоследняя проверка:\n${timeRu(now)}\n\n` +
    '——————————————\n\n' +
    `📰 Контент\n\n${contentBlock}\n\n` +
    '——————————————\n\n' +
    `🧠 AI Director\n\nОсновная проблема:\n${b.topProblem ?? 'не выявлено'}\n\nРекомендация:\n${b.recommendation}\n\n` +
    '——————————————\n\n' +
    `CEO Score: ${b.ceoScore}/100\n` +
    `Приоритет: ${b.priority}\n\n` +
    `Общий рейтинг:\n${ratingLine(b.ceoScore)}`

  return { text, score: b.ceoScore, priority: b.priority }
}
