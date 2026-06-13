// E28 — аналитика и бизнес: /analytics, /top_pages, /sources, /conversion,
// /report (AI Director), /dashboard (Control Center). Поведение идентично.
import { getOverview, getTopPages, getTrafficSources, getConversion } from '../analytics.mjs'
import { directorReport } from '../director.mjs'
import { getFleetStats } from '../scout.mjs'
import { readPrices } from '../prices.mjs'
import { readLeads, leadStats } from '../leads.mjs'
import { listReminders } from '../reminders.mjs'
import { news, promos } from '../collections.mjs'
import { listBackups } from '../backup.mjs'
import { logEvent, lastEvent, lastEventMatching } from '../audit.mjs'
import { checkHealth, gitVersion, formatTs } from '../monitor.mjs'
import { formatRu } from './shared.mjs'

const GA_HINT =
  'ℹ️ GA4 не подключён. Добавьте в .env: GA4_PROPERTY_ID + сервис-аккаунт\n' +
  '(GA_CLIENT_EMAIL, GA_PRIVATE_KEY) или GA4_ACCESS_TOKEN.'

export function registerAnalyticsHandlers(bot, deps) {
  const { command } = deps

  // --- /analytics (сводка трафика + заявки/конверсия) ---
  command('analytics', async (ctx) => {
    try {
      await logEvent({ userId: ctx.from.id, action: 'analytics_view', details: 'overview 7d' })
      const ov = await getOverview(7)
      const num = (v) => (v == null ? '— (GA4 не подключён)' : v)
      let msg =
        '📈 Аналитика (7 дней)\n\n' +
        `Посетители:\n${num(ov.visitors)}\n\n` +
        `Просмотры страниц:\n${num(ov.pageViews)}\n\n` +
        `Сессии:\n${num(ov.sessions)}\n\n` +
        `Заявки:\n${ov.leads} (за 7 дней: ${ov.leadsWeek})\n\n` +
        `Конверсия (закрыто/всего):\n${ov.conversion}%`
      if (!ov.gaConfigured) msg += `\n\n${GA_HINT}`
      else if (ov.gaError) msg += `\n\n⚠️ GA4: ${ov.gaError}`
      await ctx.reply(msg)
    } catch (err) {
      await ctx.reply(`❌ /analytics недоступен\nОшибка: ${err.message}`)
    }
  })

  // --- /top_pages (ТОП страниц) ---
  command('top_pages', async (ctx) => {
    try {
      const r = await getTopPages(7, 7)
      if (!r.configured) {
        await ctx.reply('🗂 ТОП страниц\n\n' + GA_HINT)
        return
      }
      if (r.error) {
        await ctx.reply(`🗂 ТОП страниц\n\n⚠️ GA4: ${r.error}`)
        return
      }
      if (!r.rows.length) {
        await ctx.reply('🗂 ТОП страниц\n\nНет данных за период.')
        return
      }
      await ctx.reply(
        '🗂 ТОП страниц (7 дней)\n\n' +
          r.rows.map((p, i) => `${i + 1}. ${p.path}\n   ${p.views} просмотров`).join('\n'),
      )
    } catch (err) {
      await ctx.reply(`❌ /top_pages недоступен\nОшибка: ${err.message}`)
    }
  })

  // --- /sources (источники трафика) ---
  command('sources', async (ctx) => {
    try {
      const r = await getTrafficSources(7)
      if (!r.configured) {
        await ctx.reply('🌐 Источники трафика\n\n' + GA_HINT)
        return
      }
      if (r.error) {
        await ctx.reply(`🌐 Источники трафика\n\n⚠️ GA4: ${r.error}`)
        return
      }
      if (!r.rows.length) {
        await ctx.reply('🌐 Источники трафика\n\nНет данных за период.')
        return
      }
      await ctx.reply(
        '🌐 Источники трафика (7 дней)\n\n' +
          r.rows.map((s) => `${s.source}: ${s.sessions} сессий`).join('\n'),
      )
    } catch (err) {
      await ctx.reply(`❌ /sources недоступен\nОшибка: ${err.message}`)
    }
  })

  // --- /conversion (конверсия по заявкам — реальные данные CRM) ---
  command('conversion', async (ctx) => {
    try {
      const c = await getConversion(7)
      let msg =
        '🎯 Конверсия\n\n' +
        `Заявки: всего ${c.total} · сегодня ${c.today} · неделя ${c.week} · месяц ${c.month}\n` +
        `Закрыто: ${c.closed}\n` +
        `Конверсия (закрыто/всего): ${c.conversionPct}%`
      if (c.siteConversionPct != null) {
        msg += `\n\nКонверсия сайта (заявки/сессии, 7д):\n${c.siteConversionPct}% (${c.week}/${c.sessions})`
      } else if (!c.gaConfigured) {
        msg += `\n\nКонверсия сайта по сессиям недоступна.\n${GA_HINT}`
      }
      await ctx.reply(msg)
    } catch (err) {
      await ctx.reply(`❌ /conversion недоступен\nОшибка: ${err.message}`)
    }
  })

  // ===== E25 — AI Director (/report) =====
  command('report', async (ctx) => {
    try {
      await logEvent({ userId: ctx.from.id, action: 'director_report', details: 'manual /report' })
      const { text } = await directorReport()
      await ctx.reply(text)
    } catch (err) {
      await ctx.reply(`❌ /report недоступен\nОшибка: ${err.message}`)
    }
  })

  // ===== E24 — FAVORIT Control Center (/dashboard) =====
  command('dashboard', async (ctx) => {
    try {
      await logEvent({ userId: ctx.from.id, action: 'dashboard_view', details: 'control center' })
      const [h, p, s, leadsData, reminders, newsList, promoList, v, backups, lastDep, lastEv, fleet] =
        await Promise.all([
          checkHealth(),
          readPrices().catch(() => ({})),
          leadStats(),
          readLeads().catch(() => ({ leads: [] })),
          listReminders().catch(() => []),
          news.list().catch(() => []),
          promos.list().catch(() => []),
          gitVersion(),
          listBackups().catch(() => []),
          lastEventMatching(['deploy', 'publish', 'price_update']).catch(() => null),
          lastEvent().catch(() => null),
          getFleetStats().catch(() => ({ error: true })),
        ])

      const stationCount = p.stations ? Object.keys(p.stations).length : 0
      const now = Date.now()
      const month = (leadsData.leads ?? []).filter(
        (l) => now - new Date(l.createdAt).getTime() <= 30 * 86400000,
      ).length

      // Актуальность цен: обновлены за последние 7 дней.
      const priceAge = p.updatedAt ? (now - new Date(p.updatedAt).getTime()) / 86400000 : null
      const pricesLine =
        priceAge == null
          ? '—'
          : priceAge <= 7
            ? `АКТУАЛЬНЫ (обновлены ${formatTs(p.updatedAt)})`
            : `⚠️ УСТАРЕЛИ (обновлены ${formatTs(p.updatedAt)})`

      const lastBackupName = backups[0]?.name ?? '—'
      const lastDeployLine = lastDep ? `${lastDep.action} · ${formatRu(lastDep.createdAt)}` : '—'
      const lastAuditLine = lastEv ? `${lastEv.action} · ${formatRu(lastEv.createdAt)}` : '—'

      // E26 — блок транспорта (СКАУТ). null = не настроен, error = API недоступен.
      const fleetBlock =
        fleet == null
          ? 'Транспорт:\nСКАУТ не подключён'
          : fleet.error
            ? 'Транспорт:\nСКАУТ недоступен'
            : 'Транспорт:\n' +
              `Машин: ${fleet.total}\n` +
              `Двигатель ON: ${fleet.engineOn}\n` +
              `Offline: ${fleet.offline}\n` +
              `Топливо известно: ${fleet.fuelKnown}`

      await ctx.reply(
        '🏢 FAVORIT CONTROL CENTER\n\n' +
          `Сайт:\n${h.ok ? '🟢 ONLINE' : '🔴 OFFLINE'}\n\n` +
          `Цены:\n${pricesLine}\n\n` +
          `АЗС:\n${stationCount}\n\n` +
          `Заявки:\nсегодня ${s.today} · неделя ${s.week} · месяц ${month}\n\n` +
          `Лиды:\nnew ${s.byStatus.new} · in_progress ${s.byStatus.in_progress} · ` +
          `closed ${s.byStatus.closed} · rejected ${s.byStatus.rejected}\n\n` +
          `Напоминания: ${reminders.length}\n` +
          `Новости: ${newsList.length}\n` +
          `Акции: ${promoList.length}\n\n` +
          `${fleetBlock}\n\n` +
          `Последний deploy: ${lastDeployLine}\n` +
          `Последний backup: ${lastBackupName}\n` +
          `Последний audit: ${lastAuditLine}\n\n` +
          `Git branch: ${v.branch ?? '—'}\n` +
          `Последний commit: ${v.commit ?? '—'}`,
      )
    } catch (err) {
      await ctx.reply(`❌ /dashboard недоступен\nОшибка: ${err.message}`)
    }
  })
}
