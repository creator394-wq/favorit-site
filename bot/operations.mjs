// E30/E31 — Operations Director + Daily CEO Report. Активный анализ бизнеса:
// CRM, транспорт (СКАУТ), сайт, контент → проблемы, CEO Score, приоритет.
// Чистое чтение (ничего не меняет). Все источники — мягко (catch → дефолты).

import { leadStats, readLeads } from './leads.mjs'
import { getFleetStats } from './scout.mjs'
import { checkHealth } from './monitor.mjs'
import { news, promos } from './collections.mjs'
import { readPrices } from './prices.mjs'
import { getOverview } from './analytics.mjs'
import { priorityScore, priorityLevel } from './priority.mjs'
import { ensureTask } from './tasks.mjs'
import { buildAlerts } from './alerts.mjs'
import { taskStats } from './tasks.mjs'

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
  // Структурные проблемы для Priority Engine V2 / Smart Alerts / Task Generator.
  const issues = []
  if (unprocessed.length)
    issues.push({ kind: 'lead_overdue', weight: 40, text: `Лиды без обработки >24ч: ${unprocessed.length}`, count: unprocessed.length })
  if (callbackOverdue.length)
    issues.push({ kind: 'callback_overdue', weight: 35, text: `Просроченные перезвоны: ${callbackOverdue.length}` })
  if (stats.total >= 5 && stats.conversion < 30)
    issues.push({ kind: 'low_conversion', weight: 25, text: `Низкая конверсия: ${stats.conversion}%` })
  if (stats.total >= 5 && stats.byStatus.rejected / stats.total >= 0.5)
    issues.push({ kind: 'high_reject', weight: 10, text: `Много отказов: ${stats.byStatus.rejected}` })
  return { problems, issues, stats, overdue, oldestOpen }
}

/** Проблемы транспорта: offline, нет топлива, простой (двигатель/скорость 0), нет водителя. */
export async function analyzeFleet() {
  const stats = await getFleetStats().catch(() => ({ error: true }))
  if (stats == null) return { configured: false, problems: [], issues: [], stats: null }
  if (stats.error)
    return { configured: true, error: true, problems: ['СКАУТ недоступен'], issues: [], stats: null }
  const problems = []
  const issues = []
  if (stats.offline > 0) {
    problems.push(`${stats.offline} машин(а) offline`)
    issues.push({ kind: 'fleet_offline', weight: 35, text: `Машины offline: ${stats.offline}`, count: stats.offline })
  }
  if (stats.noFuel.length > 0) {
    problems.push(`${stats.noFuel.length} без датчика топлива`)
    issues.push({ kind: 'no_fuel', weight: 15, text: `Без датчика топлива: ${stats.noFuel.length}` })
  }
  if (stats.idling > 0) {
    problems.push(`${stats.idling} с работающим двигателем на стоянке`)
    issues.push({ kind: 'idling', weight: 10, text: `Простой с работающим двигателем: ${stats.idling}` })
  }
  if (stats.noDriver.length > 0) {
    problems.push(`${stats.noDriver.length} без водителя`)
    issues.push({ kind: 'no_driver', weight: 20, text: `Без водителя: ${stats.noDriver.length}` })
  }
  return { configured: true, problems, issues, stats }
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
  const issues = []
  if (!h.ok) {
    problems.push('сайт недоступен')
    issues.push({ kind: 'site_offline', weight: 100, text: 'Сайт недоступен (offline)' })
  }
  if (daysNoLeads != null && daysNoLeads >= 3) {
    problems.push(`нет заявок ${daysNoLeads} дней`)
    issues.push({ kind: 'no_leads', weight: 20, text: `Нет заявок ${daysNoLeads} дней` })
  }
  return { ok: h.ok, problems, issues, daysNoLeads }
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
  const issues = []
  if (!newsList.length) {
    problems.push('нет новостей')
    issues.push({ kind: 'no_news', weight: 15, text: 'Нет ни одной новости' })
  } else if (newsAge != null && newsAge >= 7) {
    problems.push(`нет новостей ${newsAge} дней`)
    issues.push({ kind: 'stale_news', weight: 15, text: `Нет новостей ${newsAge} дней` })
  }
  if (!promoList.length) {
    problems.push('нет акций')
    issues.push({ kind: 'no_promo', weight: 10, text: 'Нет активных акций' })
  }
  return {
    newsCount: newsList.length,
    promoCount: promoList.length,
    newsAge,
    lastPublishDays: ageDays(lastAny),
    problems,
    issues,
  }
}

// ===== E37.1 — Analytics-анализатор (мягко, для CEO Score V2) =====
/** Сводка трафика для CEO Score. configured=false, если GA4 не подключён. */
export async function analyzeAnalytics() {
  const ov = await getOverview(7).catch(() => ({ gaConfigured: false }))
  if (!ov.gaConfigured || ov.gaError) {
    return { configured: false, visitors: null, conversion: ov.conversion ?? null, issues: [] }
  }
  return {
    configured: true,
    visitors: ov.visitors ?? 0,
    sessions: ov.sessions ?? 0,
    conversion: ov.conversion ?? 0,
    issues: [],
  }
}

// ===== E38 Business Health / E37 CEO Score V2 =====
const clampPct = (n) => Math.max(0, Math.min(100, Math.round(n)))

/**
 * Здоровье каждой секции в процентах (0–100). fleet = null, если СКАУТ не
 * подключён (тогда исключается из общего индекса). overall — среднее по
 * доступным секциям.
 */
function businessHealth({ crm, fleet, site, content }) {
  const lowConv = crm.stats.total >= 5 && crm.stats.conversion < 30
  const crmH = clampPct(100 - Math.min(60, crm.overdue * 15) - (lowConv ? 15 : 0))

  let fleetH = null
  if (fleet.configured && fleet.stats) {
    const f = fleet.stats
    fleetH = clampPct(
      100 -
        Math.min(50, f.offline * 20) -
        Math.min(20, f.noFuel.length * 5) -
        Math.min(20, (f.noDriver?.length ?? 0) * 8) -
        Math.min(10, (f.idling ?? 0) * 5),
    )
  }

  const siteH = clampPct((site.ok ? 100 : 0) - (site.daysNoLeads != null && site.daysNoLeads >= 3 ? 15 : 0))

  const noNews = content.newsCount === 0
  const staleNews = content.newsAge != null && content.newsAge >= 7
  const contentH = clampPct(100 - (noNews ? 40 : staleNews ? 20 : 0) - (content.promoCount === 0 ? 20 : 0))

  const parts = [crmH, fleetH, siteH, contentH].filter((v) => v != null)
  const overall = clampPct(parts.reduce((a, b) => a + b, 0) / parts.length)
  return { crm: crmH, fleet: fleetH, site: siteH, content: contentH, overall }
}

/**
 * CEO Score V2 (0–100). Взвешенное смешение здоровья секций (CRM/Fleet/Site/
 * Content) плюс мягкая поправка от Analytics (конверсия трафика).
 */
function ceoScoreV2(health, analytics) {
  const w = { site: 0.3, crm: 0.3, fleet: 0.2, content: 0.2 }
  let sum = 0
  let wsum = 0
  for (const key of ['site', 'crm', 'fleet', 'content']) {
    if (health[key] == null) continue
    sum += health[key] * w[key]
    wsum += w[key]
  }
  let score = wsum ? sum / wsum : 100
  // Analytics-поправка: хорошая конверсия трафика тянет вверх, плохая — вниз.
  if (analytics?.configured && typeof analytics.conversion === 'number') {
    score += analytics.conversion >= 30 ? 5 : analytics.conversion < 10 ? -5 : 0
  }
  return clampPct(score)
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
  const [crm, fleet, site, content, analytics] = await Promise.all([
    analyzeLeads(),
    analyzeFleet(),
    analyzeSite(),
    analyzeContent(),
    analyzeAnalytics(),
  ])
  const problems = [
    ...crm.problems.map((text) => ({ section: 'CRM', text })),
    ...fleet.problems.map((text) => ({ section: 'Транспорт', text })),
    ...content.problems.map((text) => ({ section: 'Контент', text })),
    ...site.problems.map((text) => ({ section: 'Сайт', text })),
  ]
  // Плоский список структурных проблем с весами — основа Priority Engine,
  // Smart Alerts и AI Task Generator.
  const issues = [
    ...(crm.issues ?? []).map((i) => ({ ...i, section: 'CRM' })),
    ...(fleet.issues ?? []).map((i) => ({ ...i, section: 'Транспорт' })),
    ...(site.issues ?? []).map((i) => ({ ...i, section: 'Сайт' })),
    ...(content.issues ?? []).map((i) => ({ ...i, section: 'Контент' })),
  ]
  const health = businessHealth({ crm, fleet, site, content })
  const ceoScore = ceoScoreV2(health, analytics)
  const score = priorityScore(issues)
  const priority = priorityLevel(score)
  const { topProblem, recommendation } = pickTop({ crm, fleet, site, content, problems })
  return {
    crm,
    fleet,
    site,
    content,
    analytics,
    problems,
    issues,
    health,
    ceoScore,
    priorityScore: score,
    priority,
    topProblem,
    recommendation,
  }
}

// ===== E33 — AI Task Generator =====
// Карта: вид проблемы → шаблон задачи. source = kind → дедуп в ensureTask.
const TASK_TEMPLATES = {
  site_offline: { title: 'Проверить доступность сайта', priority: 'critical' },
  lead_overdue: { title: 'Связаться с клиентом', priority: 'high' },
  callback_overdue: { title: 'Перезвонить клиенту (просрочено)', priority: 'high' },
  fleet_offline: { title: 'Проверить транспорт (offline)', priority: 'high' },
  no_driver: { title: 'Назначить водителя на машину', priority: 'medium' },
  low_conversion: { title: 'Разобрать причины низкой конверсии', priority: 'medium' },
  no_news: { title: 'Опубликовать новость', priority: 'medium' },
  stale_news: { title: 'Опубликовать новость', priority: 'medium' },
  no_promo: { title: 'Создать акцию', priority: 'low' },
}

/**
 * Создать задачи из проблем анализа (идемпотентно — дубли не плодятся).
 * Принимает готовый analysis или сам его собирает. Возвращает созданные задачи.
 */
export async function generateTasks(analysis) {
  const b = analysis ?? (await analyzeBusiness())
  const created = []
  for (const issue of b.issues) {
    const tpl = TASK_TEMPLATES[issue.kind]
    if (!tpl) continue
    const r = await ensureTask({
      source: issue.kind,
      title: tpl.title,
      description: issue.text,
      priority: tpl.priority,
    }).catch(() => ({ created: false }))
    if (r.created && r.task) created.push(r.task)
  }
  return created
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

// ===== E40 — AI Director 2.0 / Executive Report =====
// Сводит воедино CRM · Scout · Analytics · Content · Site · Tasks · Alerts.
export async function executiveReport() {
  const b = await analyzeBusiness()
  const ts = await taskStats().catch(() => ({
    open: 0,
    byStatus: { done: 0 },
    byPriority: { critical: 0, high: 0, medium: 0, low: 0 },
  }))
  const alerts = buildAlerts(b)
  const SEP = '——————————————'

  const s = b.crm.stats
  const crmBlock =
    `Сегодня: ${s.today} · Неделя: ${s.week}\n` +
    `Конверсия: ${s.conversion}%\n` +
    `Просрочено: ${b.crm.overdue}`

  let fleetBlock
  if (!b.fleet.configured) fleetBlock = 'СКАУТ не подключён'
  else if (b.fleet.error || !b.fleet.stats) fleetBlock = 'СКАУТ недоступен'
  else {
    const f = b.fleet.stats
    fleetBlock =
      `Машин: ${f.total} · В работе: ${f.engineOn}\n` +
      `Offline: ${f.offline} · Без водителя: ${f.noDriver.length}`
  }

  const siteBlock = b.site.ok ? '🟢 ONLINE' : '🔴 OFFLINE'

  const contentBlock =
    `Новости: ${b.content.newsCount} · Акции: ${b.content.promoCount}\n` +
    `Последняя публикация: ${b.content.lastPublishDays == null ? '—' : `${b.content.lastPublishDays} дн. назад`}`

  const tasksBlock = ts.open
    ? `Открытых: ${ts.open}\n` +
      `🔴 ${ts.byPriority.critical} · 🟠 ${ts.byPriority.high} · 🟡 ${ts.byPriority.medium} · 🟢 ${ts.byPriority.low}\n` +
      `Выполнено: ${ts.byStatus.done}`
    : `Открытых задач нет · Выполнено: ${ts.byStatus.done}`

  const top = [...b.issues].sort((a, c) => c.weight - a.weight).slice(0, 5)
  const topBlock = top.length
    ? top.map((i) => `• [${i.section}] ${i.text}`).join('\n')
    : '🟢 Проблем не обнаружено'

  const recBlock =
    `• ${b.recommendation}` + (alerts.length ? `\n• Активных тревог: ${alerts.length} (/alerts)` : '')

  const text =
    '🏢 FAVORIT Executive Report\n\n' +
    `CEO Score:\n${b.ceoScore}/100\n\n` +
    `Business Health:\n${b.health.overall}%\n\n` +
    `Priority:\n${b.priority}\n\n` +
    `${SEP}\n\nCRM\n\n${crmBlock}\n\n` +
    `${SEP}\n\nFleet\n\n${fleetBlock}\n\n` +
    `${SEP}\n\nSite\n\n${siteBlock}\n\n` +
    `${SEP}\n\nContent\n\n${contentBlock}\n\n` +
    `${SEP}\n\nTasks\n\n${tasksBlock}\n\n` +
    `${SEP}\n\nTop Problems\n\n${topBlock}\n\n` +
    `${SEP}\n\nRecommendations\n\n${recBlock}`

  return { text, score: b.ceoScore, health: b.health.overall, priority: b.priority }
}
