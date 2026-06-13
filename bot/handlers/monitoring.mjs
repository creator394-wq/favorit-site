// E28 — мониторинг: /health, /screenshot, /site_status, /check, /version,
// /git_status, /logs, /restart_info. Поведение идентично прежнему.
import { InputFile } from 'grammy'
import { FUEL_KEYS, STATION_KEYS } from '../../scripts/lib/validate.mjs'
import { readPrices } from '../prices.mjs'
import {
  checkHealth,
  takeScreenshot,
  gitVersion,
  gitStatusInfo,
  readRecentLogs,
  formatTs,
  SITE_URL,
} from '../monitor.mjs'
import { LABELS } from './shared.mjs'

export function registerMonitoringHandlers(bot, deps) {
  const { command } = deps

  // --- /health ---
  command('health', async (ctx) => {
    const h = await checkHealth()
    if (h.ok) {
      await ctx.reply(
        `🟢 Сайт работает\n\nURL: ${SITE_URL}\nHTTP: ${h.status}\nResponse: ${h.ms} ms\nSSL: ${h.ssl}`,
      )
    } else {
      await ctx.reply(`🔴 Сайт недоступен\nОшибка: ${h.error ?? `HTTP ${h.status}`}`)
    }
  })

  // --- /site-status ---
  // Telegram-команды матчат только [A-Za-z0-9_], поэтому регистрируем валидные
  // имена site_status/sitestatus + текстовый fallback на /site-status (с дефисом).
  async function siteStatusHandler(ctx) {
    try {
      const p = await readPrices()
      const blocks = STATION_KEYS.map((sid) => {
        const st = p.stations?.[sid]
        const rows = FUEL_KEYS.map((k) => `${LABELS[k]}: ${st?.fuel?.[k] ?? '—'}`)
        return [`${st?.name ?? sid}`, ...rows].join('\n')
      })
      const h = await checkHealth()
      const siteLine = h.ok ? '🟢 ONLINE' : '🔴 OFFLINE'
      await ctx.reply(
        '📊 Статус сайта\n\n' +
          blocks.join('\n\n') +
          `\n\nПоследнее обновление:\n${formatTs(p.updatedAt)}` +
          `\nИсточник: ${p.source ?? '—'}` +
          `\n\nСайт:\n${siteLine}`,
      )
    } catch (err) {
      await ctx.reply(`❌ /site-status недоступен\nОшибка: ${err.message}`)
    }
  }

  command(['site_status', 'sitestatus'], siteStatusHandler)
  bot.hears(/^\/site-status\b/, siteStatusHandler)

  // --- /screenshot ---
  command('screenshot', async (ctx) => {
    await ctx.reply('Делаю скриншот главной…')
    const shot = await takeScreenshot()
    if (!shot.ok) {
      await ctx.reply(`❌ Screenshot failed\n${shot.error}`)
      return
    }
    try {
      await ctx.replyWithPhoto(new InputFile(shot.path), { caption: SITE_URL })
    } catch (err) {
      await ctx.reply(`❌ Screenshot failed\nОтправка не удалась: ${err.message}\nФайл: ${shot.path}`)
    }
  })

  // --- /version ---
  command('version', async (ctx) => {
    const v = await gitVersion()
    let p
    try {
      p = await readPrices()
    } catch {
      p = {}
    }
    if (v.error) {
      await ctx.reply(`Version:\nНе удалось получить git-данные: ${v.error}`)
      return
    }
    await ctx.reply(
      'Version:\n' +
        `Branch: ${v.branch}\n` +
        `Commit: ${v.commit}\n` +
        `Prices updated:\n${formatTs(p.updatedAt)}`,
    )
  })

  // --- /git_status ---
  command('git_status', async (ctx) => {
    try {
      const g = await gitStatusInfo()
      if (g.error) {
        await ctx.reply(`❌ git_status недоступен\nОшибка: ${g.error}`)
        return
      }
      let msg =
        'Git:\n' +
        `Branch: ${g.branch}\n` +
        `Last commit: ${g.lastCommit}\n` +
        `Status: ${g.clean ? 'clean' : 'dirty'}`
      if (!g.clean) {
        const shown = g.files.slice(0, 30)
        msg += '\n\nИзменённые файлы:\n• ' + shown.join('\n• ')
        if (g.files.length > shown.length) msg += `\n…ещё ${g.files.length - shown.length}`
      }
      await ctx.reply(msg)
    } catch (err) {
      await ctx.reply(`❌ git_status недоступен\nОшибка: ${err.message}`)
    }
  })

  // --- /logs ---
  command('logs', async (ctx) => {
    try {
      const l = await readRecentLogs()
      if (!l.ok) {
        await ctx.reply('Логи пока не настроены.')
        return
      }
      await ctx.reply('Последние логи:\n\n' + l.text.slice(-3500))
    } catch (err) {
      await ctx.reply(`❌ logs недоступны\nОшибка: ${err.message}`)
    }
  })

  // --- /check (сводная: health + version + prices, без screenshot) ---
  command('check', async (ctx) => {
    try {
      const [h, v, p] = await Promise.all([
        checkHealth(),
        gitVersion(),
        readPrices().catch(() => ({})),
      ])
      const stLine = (sid) => {
        const st = p.stations?.[sid]
        const vals = FUEL_KEYS.map((k) => `${LABELS[k]} ${st?.fuel?.[k] ?? '—'}`).join(' / ')
        return `${st?.name ?? sid}: ${vals}`
      }
      await ctx.reply(
        (h.ok ? '🟢 Site OK' : '🔴 Site DOWN') +
          `\nBranch: ${v.branch ?? '—'}` +
          `\nCommit: ${v.commit ?? '—'}` +
          `\nPrices updated: ${formatTs(p.updatedAt)}` +
          `\n${stLine('azs1')}` +
          `\n${stLine('azs2')}` +
          `\nHTTP: ${h.ok ? h.status : h.error ?? '—'}` +
          `\nResponse: ${h.ms != null ? h.ms + ' ms' : '—'}`,
      )
    } catch (err) {
      await ctx.reply(`❌ check недоступен\nОшибка: ${err.message}`)
    }
  })

  // --- /restart_info ---
  command('restart_info', async (ctx) => {
    await ctx.reply(
      'Если бот не отвечает, на Windows открой PowerShell в проекте и выполни:\n\n' +
        'cd C:\\Users\\Данил\\favorit-site\n' +
        'npm run bot',
    )
  })
}
