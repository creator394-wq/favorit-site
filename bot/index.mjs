// E3 — Telegram Price Bot (MVP, grammy, long polling).
// Обновляет цены сайта через scripts/update-prices.mjs с подтверждением.
// Деплой — вариант B: build + Vercel deploy hook. Git push бот НЕ делает.

import { Bot, InlineKeyboard, InputFile } from 'grammy'
import { config, isAdmin } from './config.mjs'
import { validateFuel, FUEL_KEYS, STATION_KEYS } from '../scripts/lib/validate.mjs'
import { readPrices, runUpdate, runBuild, runDeploy, gitDeploy, gitCommitPush } from './prices.mjs'
import {
  checkHealth,
  takeScreenshot,
  gitVersion,
  gitStatusInfo,
  readRecentLogs,
  formatTs,
  SITE_URL,
} from './monitor.mjs'
import {
  readLeads,
  clearLeads,
  leadStats,
  findLead,
  setLeadStatus,
  addLeadNote,
  exportLeadsCsv,
  STATUS_LABEL,
} from './leads.mjs'
import { startLeadApi } from './leadApi.mjs'
import { parseWhen, addReminder, listReminders, cancelReminder, popDueReminders } from './reminders.mjs'
import { news, promos, trucks, maintenance } from './collections.mjs'
import { prepareContentEdit, writeContacts, CONTACTS_REL } from './content.mjs'
import { docsHelp, readRoadmap, appendSessionLog } from './docs.mjs'
import {
  logEvent,
  recentEvents,
  lastEvent,
  searchEvents,
  auditCount,
  lastEventMatching,
} from './audit.mjs'
import { createBackup, listBackups, restoreBackup } from './backup.mjs'

const LABELS = { ai92: 'АИ-92', ai95: 'АИ-95', dt: 'ДТ', gas: 'СУГ' }

// dd.mm.yyyy HH:MM / dd.mm.yyyy (бот — обычный Node, Date доступен)
function formatRu(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
}
function formatRuDate(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`
}

// Ожидающие подтверждения операции по userId (in-memory).
const pending = new Map()
// Активные пошаговые сценарии (мастера news/promo/content) по userId.
const flows = new Map()

const bot = new Bot(config.token)

/**
 * Общий пайплайн публикации контента: коммит указанных файлов → build → deploy.
 * НЕ трогает ценовой gitDeploy. Прогресс/итог пишется в чат.
 */
async function publishFiles(ctx, files, message) {
  const git = await gitCommitPush(files, message)
  if (git.status === 'fail') {
    await ctx.reply(`❌ Git: FAIL (${git.step})\n${String(git.message).slice(-400)}`)
    return
  }
  if (git.status === 'nochange') {
    await ctx.reply('⚠️ Нет изменений для коммита.')
    return
  }
  const build = await runBuild()
  if (!build.ok) {
    await ctx.reply('❌ Build: FAIL\n' + (build.stderr || build.stdout).slice(-800))
    return
  }
  const deploy = await runDeploy()
  const dline =
    deploy.status === 'ok'
      ? 'PASS'
      : deploy.status === 'skipped'
        ? 'SKIPPED (нет deploy hook)'
        : `FAIL (${deploy.message})`
  await ctx.reply(`✅ Git push: PASS\nBuild: PASS\nDeploy: ${dline}`)
}

// --- Глобальный allowlist-гард: чужих молча игнорируем ---
bot.use(async (ctx, next) => {
  const userId = ctx.from?.id
  if (!isAdmin(userId)) {
    if (ctx.callbackQuery) await ctx.answerCallbackQuery({ text: 'Нет доступа' })
    return // не передаём дальше
  }
  await next()
})

// --- /start ---
bot.command('start', async (ctx) => {
  await ctx.reply(
    'Бот обновления цен «Фаворит Сервис».\n\n' +
      'Команды:\n' +
      '/status — текущие цены по каждой АЗС\n' +
      '/price azs1 ai92=60.10 ai95=65.10 dt=69.10 gas=32.10 — обновить цены одной АЗС\n' +
      `   (АЗС: ${STATION_KEYS.join(' | ')})\n` +
      '/publish — задеплоить сайт (Vercel deploy hook)\n\n' +
      'Мониторинг:\n' +
      '/health — доступность сайта\n' +
      '/site_status — цены + состояние сайта\n' +
      '/screenshot — скриншот главной\n' +
      '/deploy — ручной деплой\n' +
      '/version — git-ветка/коммит + дата цен\n\n' +
      'Любое изменение цен требует подтверждения кнопкой.',
  )
})

// --- /status ---
bot.command('status', async (ctx) => {
  try {
    const p = await readPrices()
    const blocks = STATION_KEYS.map((sid) => {
      const st = p.stations?.[sid]
      const head = `${st?.name ?? sid} (${sid}):`
      const rows = FUEL_KEYS.map((k) => `  ${LABELS[k]}: ${st?.fuel?.[k] ?? '—'}`)
      return [head, ...rows].join('\n')
    })
    await ctx.reply(
      'Текущие цены:\n\n' +
        blocks.join('\n\n') +
        `\n\nИсточник: ${p.source ?? '—'}\nОбновлено: ${p.updatedAt ?? '—'}`,
    )
  } catch (err) {
    await ctx.reply(`Не удалось прочитать prices.json: ${err.message}`)
  }
})

// --- /price ---
bot.command('price', async (ctx) => {
  const text = (ctx.match ?? '').trim()
  if (!text) {
    await ctx.reply(`Формат: /price <${STATION_KEYS.join('|')}> ai92=60.10 ai95=65.10 dt=69.10 gas=32.10`)
    return
  }

  const tokens = text.split(/\s+/)
  // первый токен — обязательная станция
  const station = tokens.shift()
  if (!STATION_KEYS.includes(station)) {
    await ctx.reply(
      `Первым укажите АЗС: ${STATION_KEYS.join(' | ')}.\n` +
        `Пример: /price azs1 ai92=60.10 ai95=65.10 dt=69.10 gas=32.10`,
    )
    return
  }
  if (tokens.length === 0) {
    await ctx.reply('Не переданы цены. Пример: ai92=60.10 ai95=65.10 dt=69.10 gas=32.10')
    return
  }

  // разбор key=value токенов
  const input = {}
  let source = 'telegram'
  for (const token of tokens) {
    const eq = token.indexOf('=')
    if (eq === -1) {
      await ctx.reply(`Непонятный аргумент «${token}». Ожидается key=value.`)
      return
    }
    const key = token.slice(0, eq)
    const value = token.slice(eq + 1)
    if (key === 'source') source = value
    else input[key] = value
  }

  // неизвестные ключи
  const unknown = Object.keys(input).filter((k) => !FUEL_KEYS.includes(k))
  if (unknown.length) {
    await ctx.reply(`Неизвестные ключи: ${unknown.join(', ')}. Допустимы: ${FUEL_KEYS.join(', ')}.`)
    return
  }

  const { ok, cleaned, errors } = validateFuel(input)
  if (!ok) {
    await ctx.reply('Ошибки валидации:\n• ' + errors.join('\n• '))
    return
  }

  // preview: было → станет
  let current
  try {
    current = await readPrices()
  } catch (err) {
    await ctx.reply(`Не удалось прочитать prices.json: ${err.message}`)
    return
  }
  const stationBlock = current.stations?.[station]
  const stationName = stationBlock?.name ?? station
  const preview = Object.keys(cleaned)
    .map((k) => `${LABELS[k]}: ${stationBlock?.fuel?.[k] ?? '—'} → ${cleaned[k]}`)
    .join('\n')

  pending.set(ctx.from.id, { type: 'price', station, cleaned, source })
  const kb = new InlineKeyboard()
    .text('✅ Подтвердить', 'price:confirm')
    .text('✖ Отмена', 'price:cancel')
  await ctx.reply(
    `Применить изменения для ${stationName} (${station})?\n\n${preview}\n\nИсточник: ${source}`,
    { reply_markup: kb },
  )
})

// --- /publish ---
bot.command('publish', async (ctx) => {
  pending.set(ctx.from.id, { type: 'publish' })
  const kb = new InlineKeyboard()
    .text('🚀 Деплой', 'publish:confirm')
    .text('✖ Отмена', 'publish:cancel')
  await ctx.reply('Запустить деплой сайта через Vercel deploy hook?', { reply_markup: kb })
})

// ===== E6 — мониторинг (поверх существующей логики, ничего не ломает) =====

// --- /health ---
bot.command('health', async (ctx) => {
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

bot.command(['site_status', 'sitestatus'], siteStatusHandler)
bot.hears(/^\/site-status\b/, siteStatusHandler)

// --- /screenshot ---
bot.command('screenshot', async (ctx) => {
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

// --- /deploy (ручной, прямой вызов runDeploy) ---
bot.command('deploy', async (ctx) => {
  try {
    const deploy = await runDeploy()
    await logEvent({ userId: ctx.from.id, action: 'deploy', details: `manual · ${deploy.status}` })
    if (deploy.status === 'ok') await ctx.reply('🚀 Deploy: PASS')
    else if (deploy.status === 'skipped')
      await ctx.reply('⚠️ Deploy: SKIPPED (VERCEL_DEPLOY_HOOK_URL не задан)')
    else await ctx.reply(`❌ Deploy: FAIL\n${deploy.message}`)
  } catch (err) {
    await ctx.reply(`❌ Deploy: FAIL\n${err.message}`)
  }
})

// --- /version ---
bot.command('version', async (ctx) => {
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

// ===== E7 — Site Manager: дополнительные команды =====

const HELP_TEXT =
  'Команды Site Manager «Фаворит Сервис»:\n\n' +
  '/start — приветствие\n' +
  '/help — этот список\n' +
  '/status — цены (одним списком)\n' +
  '/price azs1 ai92=… ai95=… dt=… gas=… — цены АЗС №1\n' +
  '/price azs2 ai92=… ai95=… dt=… gas=… — цены АЗС №2\n' +
  '/site_status — цены по АЗС + состояние сайта\n' +
  '/health — доступность сайта\n' +
  '/screenshot — скриншот главной\n' +
  '/version — git-ветка/коммит + дата цен\n' +
  '/deploy — ручной деплой (deploy hook)\n' +
  '/publish — деплой с подтверждением\n' +
  '/git_status — состояние git\n' +
  '/logs — последние логи бота\n' +
  '/check — быстрая сводная проверка\n' +
  '/quick_price — шпаргалка по формату цен\n' +
  '/restart_info — как перезапустить бота\n\n' +
  'Заявки (CRM):\n' +
  '/leads — последние 10 · /lead_last · /lead_view <id>\n' +
  '/lead_work /lead_callback /lead_done /lead_reject <id>\n' +
  '/lead_note <id> текст · /lead_export · /lead_stats · /lead_clear\n\n' +
  'Напоминания: /lead_remind <id> <время> · /reminders · /remind_cancel <id>\n\n' +
  'Контент: /news_create /news_list /news_delete <id>\n' +
  '/promo_create /promo_list /promo_delete <id> · /content\n\n' +
  'Транспорт: /trucks /truck_add /truck_edit /truck_delete\n' +
  'ТО: /maintenance /maintenance_add /maintenance_done <id>\n\n' +
  'Аналитика: /analytics /report /dashboard\n\n' +
  'Проектная память: /docs · /roadmap · /session_log <текст>\n\n' +
  'Аудит и бэкапы:\n' +
  '/audit · /audit_last · /audit_search <слово>\n' +
  '/backup_now · /backups · /backup_restore <date>\n' +
  '/system_status'

// --- /help ---
bot.command('help', async (ctx) => {
  await ctx.reply(HELP_TEXT)
})

// --- /git_status ---
bot.command('git_status', async (ctx) => {
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
bot.command('logs', async (ctx) => {
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
bot.command('check', async (ctx) => {
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

// --- /quick_price (шпаргалка) ---
bot.command('quick_price', async (ctx) => {
  await ctx.reply(
    'Формат обновления цен:\n\n' +
      'АЗС №1:\n/price azs1 ai92=60.10 ai95=65.10 dt=69.10 gas=32.10\n\n' +
      'АЗС №2:\n/price azs2 ai92=61.10 ai95=66.10 dt=70.10 gas=33.10',
  )
})

// --- /restart_info ---
bot.command('restart_info', async (ctx) => {
  await ctx.reply(
    'Если бот не отвечает, на Windows открой PowerShell в проекте и выполни:\n\n' +
      'cd C:\\Users\\Данил\\favorit-site\n' +
      'npm run bot',
  )
})

// ===== E9 — Lead CRM =====
const sid = (id) => String(id).slice(0, 8)
const leadCard = (l) =>
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

// --- /leads (последние 10) ---
bot.command('leads', async (ctx) => {
  try {
    const { leads } = await readLeads()
    if (!leads.length) {
      await ctx.reply('📋 Заявок пока нет.')
      return
    }
    const text = leads
      .slice(-10)
      .reverse()
      .map(
        (l) =>
          `${sid(l.id)} · ${STATUS_LABEL[l.status] ?? l.status}\n${l.name} · ${l.phone}\n${formatRuDate(l.createdAt)}`,
      )
      .join('\n\n')
    await ctx.reply('📋 Последние заявки\n(id для команд — слева)\n\n' + text)
  } catch (err) {
    await ctx.reply(`❌ /leads недоступен\nОшибка: ${err.message}`)
  }
})

// --- /lead_last ---
bot.command('lead_last', async (ctx) => {
  try {
    const { leads } = await readLeads()
    const l = leads[leads.length - 1]
    if (!l) {
      await ctx.reply('Заявок пока нет.')
      return
    }
    await ctx.reply(leadCard(l))
  } catch (err) {
    await ctx.reply(`❌ /lead_last недоступен\nОшибка: ${err.message}`)
  }
})

// --- /lead_view <id> ---
bot.command('lead_view', async (ctx) => {
  try {
    const id = (ctx.match ?? '').trim()
    if (!id) {
      await ctx.reply('Формат: /lead_view <id>')
      return
    }
    const l = await findLead(id)
    if (!l) {
      await ctx.reply('Заявка не найдена.')
      return
    }
    await ctx.reply(leadCard(l))
  } catch (err) {
    await ctx.reply(`❌ /lead_view недоступен\nОшибка: ${err.message}`)
  }
})

// --- смена статуса: done/reject/callback/work ---
function statusCommand(command, status) {
  bot.command(command, async (ctx) => {
    try {
      const id = (ctx.match ?? '').trim()
      if (!id) {
        await ctx.reply(`Формат: /${command} <id>`)
        return
      }
      const r = await setLeadStatus(id, status)
      if (!r.ok) {
        await ctx.reply(`❌ ${r.error}`)
        return
      }
      await logEvent({
        userId: ctx.from.id,
        action: 'lead_status',
        details: `${sid(r.lead.id)} → ${STATUS_LABEL[status] ?? status}`,
      })
      await ctx.reply(`✅ Заявка ${sid(r.lead.id)} → ${STATUS_LABEL[status]}`)
    } catch (err) {
      await ctx.reply(`❌ /${command} недоступен\nОшибка: ${err.message}`)
    }
  })
}
statusCommand('lead_done', 'closed')
statusCommand('lead_reject', 'rejected')
statusCommand('lead_callback', 'callback')
statusCommand('lead_work', 'in_progress')

// --- /lead_note <id> текст ---
bot.command('lead_note', async (ctx) => {
  try {
    const raw = (ctx.match ?? '').trim()
    const sp = raw.indexOf(' ')
    if (sp === -1) {
      await ctx.reply('Формат: /lead_note <id> текст заметки')
      return
    }
    const id = raw.slice(0, sp)
    const note = raw.slice(sp + 1).trim()
    const r = await addLeadNote(id, note)
    if (!r.ok) {
      await ctx.reply(`❌ ${r.error}`)
      return
    }
    await ctx.reply(`✅ Заметка добавлена к ${sid(r.lead.id)}`)
  } catch (err) {
    await ctx.reply(`❌ /lead_note недоступен\nОшибка: ${err.message}`)
  }
})

// --- /lead_export (CSV) ---
bot.command('lead_export', async (ctx) => {
  try {
    const csv = await exportLeadsCsv()
    await ctx.replyWithDocument(new InputFile(Buffer.from(csv, 'utf8'), 'leads.csv'))
  } catch (err) {
    await ctx.reply(`❌ /lead_export недоступен\nОшибка: ${err.message}`)
  }
})

// --- /lead_clear (подтверждение) ---
bot.command('lead_clear', async (ctx) => {
  pending.set(ctx.from.id, { type: 'lead_clear' })
  const kb = new InlineKeyboard()
    .text('✅ Очистить', 'lead_clear:confirm')
    .text('❌ Отмена', 'lead_clear:cancel')
  await ctx.reply('Очистить ВСЕ заявки? Действие необратимо.', { reply_markup: kb })
})

// ===== E10 — Sales Funnel =====
bot.command('lead_stats', async (ctx) => {
  try {
    const s = await leadStats()
    await ctx.reply(
      '📈 Воронка заявок\n\n' +
        `Всего: ${s.total}\n` +
        `Новые: ${s.byStatus.new}\n` +
        `В работе: ${s.byStatus.in_progress}\n` +
        `Перезвонить: ${s.byStatus.callback}\n` +
        `Закрыто: ${s.byStatus.closed}\n` +
        `Отказ: ${s.byStatus.rejected}\n\n` +
        `Сегодня: ${s.today} · за 7 дней: ${s.week}\n` +
        `Конверсия (закрыто/всего): ${s.conversion}%`,
    )
  } catch (err) {
    await ctx.reply(`❌ /lead_stats недоступен\nОшибка: ${err.message}`)
  }
})

// ===== E11 — Reminders =====
bot.command('lead_remind', async (ctx) => {
  try {
    const parts = (ctx.match ?? '').trim().split(/\s+/).filter(Boolean)
    const id = parts.shift()
    if (!id || !parts.length) {
      await ctx.reply('Формат: /lead_remind <id> 2026-06-20 14:00 | 2d | 4h | 30m')
      return
    }
    const lead = await findLead(id)
    if (!lead) {
      await ctx.reply('Заявка не найдена.')
      return
    }
    const dueAt = parseWhen(parts)
    if (!dueAt) {
      await ctx.reply('Не понял время. Примеры: 2026-06-20 14:00 / 2d / 4h / 30m')
      return
    }
    const rem = await addReminder({
      leadId: lead.id,
      dueAt,
      text: `Заявка ${sid(lead.id)} — ${lead.name}, ${lead.phone}`,
    })
    await ctx.reply(`⏰ Напоминание ${sid(rem.id)} на ${formatRu(dueAt)}`)
  } catch (err) {
    await ctx.reply(`❌ /lead_remind недоступен\nОшибка: ${err.message}`)
  }
})

bot.command('reminders', async (ctx) => {
  try {
    const list = await listReminders()
    if (!list.length) {
      await ctx.reply('Активных напоминаний нет.')
      return
    }
    await ctx.reply(
      '⏰ Напоминания\n\n' +
        list.map((r) => `${sid(r.id)} · ${formatRu(r.dueAt)}\n${r.text}`).join('\n\n'),
    )
  } catch (err) {
    await ctx.reply(`❌ /reminders недоступен\nОшибка: ${err.message}`)
  }
})

bot.command('remind_cancel', async (ctx) => {
  try {
    const id = (ctx.match ?? '').trim()
    if (!id) {
      await ctx.reply('Формат: /remind_cancel <id>')
      return
    }
    const ok = await cancelReminder(id)
    await ctx.reply(ok ? '✅ Напоминание удалено.' : 'Напоминание не найдено.')
  } catch (err) {
    await ctx.reply(`❌ /remind_cancel недоступен\nОшибка: ${err.message}`)
  }
})

// ===== E12 — News Manager =====
bot.command('news_create', async (ctx) => {
  flows.set(ctx.from.id, { type: 'news', step: 'title', data: {} })
  await ctx.reply('📰 Новая новость. Введите заголовок:')
})

bot.command('news_list', async (ctx) => {
  try {
    const items = await news.list()
    if (!items.length) {
      await ctx.reply('Новостей (через бота) пока нет.')
      return
    }
    await ctx.reply(
      '📰 Новости\n\n' +
        items
          .slice(-10)
          .reverse()
          .map((n) => `${sid(n.id)} · ${formatRuDate(n.createdAt)}\n${n.title}`)
          .join('\n\n'),
    )
  } catch (err) {
    await ctx.reply(`❌ /news_list недоступен\nОшибка: ${err.message}`)
  }
})

bot.command('news_delete', async (ctx) => {
  try {
    const id = (ctx.match ?? '').trim()
    if (!id) {
      await ctx.reply('Формат: /news_delete <id>')
      return
    }
    const ok = await news.remove(id)
    if (!ok) {
      await ctx.reply('Новость не найдена.')
      return
    }
    await logEvent({ userId: ctx.from.id, action: 'news_delete', details: `id ${id}` })
    await ctx.reply('✅ Удалено. Публикую…')
    await publishFiles(ctx, ['src/data/news.json'], 'chore: delete news')
  } catch (err) {
    await ctx.reply(`❌ /news_delete недоступен\nОшибка: ${err.message}`)
  }
})

// ===== E13 — Promo Manager =====
bot.command('promo_create', async (ctx) => {
  flows.set(ctx.from.id, { type: 'promo', step: 'title', data: {} })
  await ctx.reply('🎟 Новая акция. Введите заголовок:')
})

bot.command('promo_list', async (ctx) => {
  try {
    const items = await promos.list()
    if (!items.length) {
      await ctx.reply('Акций пока нет.')
      return
    }
    await ctx.reply(
      '🎟 Акции\n\n' +
        items
          .slice(-10)
          .reverse()
          .map((p) => `${sid(p.id)} · ${p.title}\n${p.text || ''}`)
          .join('\n\n'),
    )
  } catch (err) {
    await ctx.reply(`❌ /promo_list недоступен\nОшибка: ${err.message}`)
  }
})

bot.command('promo_delete', async (ctx) => {
  try {
    const id = (ctx.match ?? '').trim()
    if (!id) {
      await ctx.reply('Формат: /promo_delete <id>')
      return
    }
    const ok = await promos.remove(id)
    if (!ok) {
      await ctx.reply('Акция не найдена.')
      return
    }
    await logEvent({ userId: ctx.from.id, action: 'promo_delete', details: `id ${id}` })
    await ctx.reply('✅ Удалено. Публикую…')
    await publishFiles(ctx, ['src/data/promos.json'], 'chore: delete promo')
  } catch (err) {
    await ctx.reply(`❌ /promo_delete недоступен\nОшибка: ${err.message}`)
  }
})

// ===== E18 — Transport Management =====
bot.command('trucks', async (ctx) => {
  try {
    const items = await trucks.list()
    if (!items.length) {
      await ctx.reply('🚛 Техника не добавлена. /truck_add <гос.номер> | <модель> | <статус>')
      return
    }
    await ctx.reply(
      '🚛 Техника\n\n' +
        items
          .map((t) => `${sid(t.id)} · ${t.plate}\n${t.model} · ${t.status || '—'}`)
          .join('\n\n'),
    )
  } catch (err) {
    await ctx.reply(`❌ /trucks недоступен\nОшибка: ${err.message}`)
  }
})

bot.command('truck_add', async (ctx) => {
  try {
    const parts = (ctx.match ?? '').split('|').map((s) => s.trim())
    const [plate, model, status] = parts
    if (!plate || !model) {
      await ctx.reply('Формат: /truck_add <гос.номер> | <модель> | <статус>')
      return
    }
    const t = await trucks.add({ plate, model, status: status || 'в строю' })
    await ctx.reply(`✅ Добавлено ${sid(t.id)} · ${t.plate} · ${t.model}`)
  } catch (err) {
    await ctx.reply(`❌ /truck_add недоступен\nОшибка: ${err.message}`)
  }
})

bot.command('truck_edit', async (ctx) => {
  try {
    const parts = (ctx.match ?? '').split('|').map((s) => s.trim())
    const id = parts.shift()
    const [plate, model, status] = parts
    if (!id || (!plate && !model && !status)) {
      await ctx.reply('Формат: /truck_edit <id> | <гос.номер> | <модель> | <статус>')
      return
    }
    const patch = {}
    if (plate) patch.plate = plate
    if (model) patch.model = model
    if (status) patch.status = status
    const t = await trucks.update(id, patch)
    await ctx.reply(t ? `✅ Обновлено ${sid(t.id)}` : 'Техника не найдена.')
  } catch (err) {
    await ctx.reply(`❌ /truck_edit недоступен\nОшибка: ${err.message}`)
  }
})

bot.command('truck_delete', async (ctx) => {
  try {
    const id = (ctx.match ?? '').trim()
    if (!id) {
      await ctx.reply('Формат: /truck_delete <id>')
      return
    }
    const ok = await trucks.remove(id)
    await ctx.reply(ok ? '✅ Удалено.' : 'Техника не найдена.')
  } catch (err) {
    await ctx.reply(`❌ /truck_delete недоступен\nОшибка: ${err.message}`)
  }
})

// ===== E19 — Maintenance =====
bot.command('maintenance', async (ctx) => {
  try {
    const items = await maintenance.list()
    if (!items.length) {
      await ctx.reply('🔧 ТО не запланировано. /maintenance_add <техника> | <работы> | <дата>')
      return
    }
    await ctx.reply(
      '🔧 Техобслуживание\n\n' +
        items
          .map(
            (m) =>
              `${sid(m.id)} · ${m.done ? '✅ выполнено' : '🔧 в плане'}\n${m.truck} — ${m.work}\nдата: ${m.date || '—'}`,
          )
          .join('\n\n'),
    )
  } catch (err) {
    await ctx.reply(`❌ /maintenance недоступен\nОшибка: ${err.message}`)
  }
})

bot.command('maintenance_add', async (ctx) => {
  try {
    const parts = (ctx.match ?? '').split('|').map((s) => s.trim())
    const [truck, work, date] = parts
    if (!truck || !work) {
      await ctx.reply('Формат: /maintenance_add <техника> | <работы> | <дата>')
      return
    }
    const m = await maintenance.add({ truck, work, date: date || '', done: false })
    await ctx.reply(`✅ ТО создано ${sid(m.id)} · ${m.truck}`)
  } catch (err) {
    await ctx.reply(`❌ /maintenance_add недоступен\nОшибка: ${err.message}`)
  }
})

bot.command('maintenance_done', async (ctx) => {
  try {
    const id = (ctx.match ?? '').trim()
    if (!id) {
      await ctx.reply('Формат: /maintenance_done <id>')
      return
    }
    const m = await maintenance.update(id, { done: true })
    await ctx.reply(m ? `✅ ТО ${sid(m.id)} закрыто.` : 'ТО не найдено.')
  } catch (err) {
    await ctx.reply(`❌ /maintenance_done недоступен\nОшибка: ${err.message}`)
  }
})

// ===== E14 — Content Manager (NL) =====
bot.command('content', async (ctx) => {
  flows.set(ctx.from.id, { type: 'content', step: 'await', data: {} })
  await ctx.reply(
    '✏️ Content Manager. Напишите, что изменить:\n' +
      '• измени телефон на +7 999 000-00-00\n' +
      '• измени email на mail@example.ru\n' +
      '• измени whatsapp на https://wa.me/79990000000',
  )
})

// ===== E15 — Analytics =====
bot.command('analytics', async (ctx) => {
  await ctx.reply(
    '📊 Аналитика\n\nВеб-аналитика пока не подключена.\n' +
      'Подключите Vercel Analytics или Яндекс.Метрику, затем добавим показатели ' +
      '(посетители, страницы, источники) сюда.',
  )
})

// ===== E17 — AI Business Analyst (rule-based) =====
bot.command('report', async (ctx) => {
  try {
    const [s, h, p] = await Promise.all([leadStats(), checkHealth(), readPrices().catch(() => ({}))])
    const problems = []
    if (!h.ok) problems.push('• сайт недоступен')
    if (s.byStatus.new > 0) problems.push(`• ${s.byStatus.new} необработанных заявок`)
    if (s.byStatus.callback > 0) problems.push(`• ${s.byStatus.callback} ждут перезвона`)
    const recs = []
    if (s.byStatus.new > 0) recs.push('• обработать новые заявки (/leads, /lead_work)')
    if (s.conversion < 30 && s.total >= 5) recs.push('• низкая конверсия — проработать отказы')
    if (!recs.length) recs.push('• всё под контролем')
    await ctx.reply(
      '🧠 Бизнес-отчёт\n\n' +
        `Заявки: всего ${s.total}, сегодня ${s.today}, за 7 дней ${s.week}\n` +
        `Конверсия: ${s.conversion}%\n` +
        `Воронка: new ${s.byStatus.new} / work ${s.byStatus.in_progress} / callback ${s.byStatus.callback} / closed ${s.byStatus.closed} / reject ${s.byStatus.rejected}\n` +
        `Сайт: ${h.ok ? '🟢 online' : '🔴 offline'}\n\n` +
        'Проблемы:\n' + (problems.length ? problems.join('\n') : '• не выявлено') +
        '\n\nРекомендации:\n' + recs.join('\n'),
    )
  } catch (err) {
    await ctx.reply(`❌ /report недоступен\nОшибка: ${err.message}`)
  }
})

// ===== E20 — Executive Dashboard =====
bot.command('dashboard', async (ctx) => {
  try {
    const [h, p, s] = await Promise.all([
      checkHealth(),
      readPrices().catch(() => ({})),
      leadStats(),
    ])
    const stLine = (id) => {
      const st = p.stations?.[id]
      return FUEL_KEYS.map((k) => `${LABELS[k]} ${st?.fuel?.[k] ?? '—'}`).join(' / ')
    }
    await ctx.reply(
      '🗂 Executive Dashboard\n\n' +
        `Сайт: ${h.ok ? '🟢 ONLINE' : '🔴 OFFLINE'}\n\n` +
        `${p.stations?.azs1?.name ?? 'АЗС №1'}:\n${stLine('azs1')}\n\n` +
        `${p.stations?.azs2?.name ?? 'АЗС №2'}:\n${stLine('azs2')}\n\n` +
        `Новые заявки: ${s.byStatus.new}\n` +
        `В работе: ${s.byStatus.in_progress}\n` +
        `Перезвонить: ${s.byStatus.callback}\n` +
        `Закрыто: ${s.byStatus.closed}\n\n` +
        `Цены обновлены: ${formatTs(p.updatedAt)}`,
    )
  } catch (err) {
    await ctx.reply(`❌ /dashboard недоступен\nОшибка: ${err.message}`)
  }
})

// ===== E21 — Obsidian Project Memory =====

// --- /docs (справка по проектной памяти) ---
bot.command('docs', async (ctx) => {
  try {
    await ctx.reply(await docsHelp())
  } catch (err) {
    await ctx.reply(`❌ /docs недоступен\nОшибка: ${err.message}`)
  }
})

// --- /roadmap (краткий план из ROADMAP.md) ---
bot.command('roadmap', async (ctx) => {
  try {
    const raw = await readRoadmap()
    if (!raw.trim()) {
      await ctx.reply('Roadmap пуст или не найден (docs/obsidian/FAVORIT_SITE_ROADMAP.md).')
      return
    }
    // Убираем YAML-фронтматтер для краткого вывода.
    const body = raw.replace(/^---\n[\s\S]*?\n---\n/, '').trim()
    await ctx.reply('🗺 Roadmap\n\n' + body.slice(0, 3500))
  } catch (err) {
    await ctx.reply(`❌ /roadmap недоступен\nОшибка: ${err.message}`)
  }
})

// --- /session_log <текст> (добавить запись в CHANGELOG) ---
bot.command('session_log', async (ctx) => {
  try {
    const text = (ctx.match ?? '').trim()
    if (!text) {
      await ctx.reply('Формат: /session_log <текст>')
      return
    }
    const r = await appendSessionLog(text)
    if (!r.ok) {
      await ctx.reply(`❌ ${r.error}`)
      return
    }
    await ctx.reply(`✅ Записано в ${r.file}\n## ${r.when}\n${text}`)
  } catch (err) {
    await ctx.reply(`❌ /session_log недоступен\nОшибка: ${err.message}`)
  }
})

// ===== E22 — Audit Log & Backups =====

const auditLine = (e) => `${formatRu(e.createdAt)} · ${e.action}\n${e.details || '—'}`

// --- E22.2 /audit (последние 20) ---
bot.command('audit', async (ctx) => {
  try {
    const events = await recentEvents(20)
    if (!events.length) {
      await ctx.reply('📋 Журнал аудита пуст.')
      return
    }
    await ctx.reply(
      '📋 Аудит — последние события\n\n' + events.map(auditLine).join('\n\n').slice(0, 3800),
    )
  } catch (err) {
    await ctx.reply(`❌ /audit недоступен\nОшибка: ${err.message}`)
  }
})

// --- E22.2 /audit_last (последнее событие полностью) ---
bot.command('audit_last', async (ctx) => {
  try {
    const e = await lastEvent()
    if (!e) {
      await ctx.reply('Журнал аудита пуст.')
      return
    }
    await ctx.reply(
      '📋 Последнее событие\n\n' +
        `ID: ${sid(e.id)}\n` +
        `Время: ${formatRu(e.createdAt)}\n` +
        `Пользователь: ${e.userId || '—'}\n` +
        `Действие: ${e.action}\n` +
        `Детали: ${e.details || '—'}`,
    )
  } catch (err) {
    await ctx.reply(`❌ /audit_last недоступен\nОшибка: ${err.message}`)
  }
})

// --- E22.2 /audit_search <слово> ---
bot.command('audit_search', async (ctx) => {
  try {
    const term = (ctx.match ?? '').trim()
    if (!term) {
      await ctx.reply('Формат: /audit_search <слово>')
      return
    }
    const events = await searchEvents(term, 20)
    if (!events.length) {
      await ctx.reply(`Ничего не найдено по «${term}».`)
      return
    }
    await ctx.reply(
      `🔎 Аудит — найдено по «${term}» (${events.length})\n\n` +
        events.map(auditLine).join('\n\n').slice(0, 3800),
    )
  } catch (err) {
    await ctx.reply(`❌ /audit_search недоступен\nОшибка: ${err.message}`)
  }
})

// --- E22.4 /backup_now ---
bot.command('backup_now', async (ctx) => {
  try {
    const r = await createBackup()
    if (!r.ok) {
      await ctx.reply(`❌ Backup failed\n${r.error}`)
      return
    }
    await logEvent({
      userId: ctx.from.id,
      action: 'backup',
      details: `${r.name} · ${r.count} файл(ов) · ${r.sizeText}`,
    })
    await ctx.reply(
      '✅ Backup created\n\n' + `Файлов:\n${r.count}\n\n` + `Размер:\n${r.sizeText}\n\nПапка: ${r.name}`,
    )
  } catch (err) {
    await ctx.reply(`❌ /backup_now недоступен\nОшибка: ${err.message}`)
  }
})

// --- E22.4 /backups (список) ---
bot.command('backups', async (ctx) => {
  try {
    const list = await listBackups()
    if (!list.length) {
      await ctx.reply('🗄 Бэкапов пока нет. Создать: /backup_now')
      return
    }
    await ctx.reply(
      '🗄 Бэкапы (новые сверху)\n\n' +
        list
          .slice(0, 15)
          .map((b) => `${b.name}\n${b.count} файл(ов) · ${b.sizeText}`)
          .join('\n\n'),
    )
  } catch (err) {
    await ctx.reply(`❌ /backups недоступен\nОшибка: ${err.message}`)
  }
})

// --- E22.4 /backup_restore <date> (с подтверждением) ---
bot.command('backup_restore', async (ctx) => {
  try {
    const date = (ctx.match ?? '').trim()
    if (!date) {
      await ctx.reply('Формат: /backup_restore <date>\nПример: /backup_restore 2026-06-13\nСписок: /backups')
      return
    }
    const match = (await listBackups()).find((b) => b.name === date)
    if (!match) {
      await ctx.reply(`Бэкап «${date}» не найден. /backups — список.`)
      return
    }
    pending.set(ctx.from.id, { type: 'restore', name: match.name })
    const kb = new InlineKeyboard()
      .text('✅ Restore', 'restore:confirm')
      .text('❌ Cancel', 'restore:cancel')
    await ctx.reply(
      `Восстановить данные из бэкапа «${match.name}»?\n\n` +
        `Файлов: ${match.count}\n\n` +
        '⚠️ Текущее состояние будет автоматически сохранено в emergency backup.',
      { reply_markup: kb },
    )
  } catch (err) {
    await ctx.reply(`❌ /backup_restore недоступен\nОшибка: ${err.message}`)
  }
})

// --- E22.5 restore callbacks ---
bot.callbackQuery('restore:cancel', async (ctx) => {
  pending.delete(ctx.from.id)
  await ctx.answerCallbackQuery()
  await ctx.editMessageText('Отменено.')
})

bot.callbackQuery('restore:confirm', async (ctx) => {
  const op = pending.get(ctx.from.id)
  if (!op || op.type !== 'restore') {
    await ctx.answerCallbackQuery({ text: 'Нечего подтверждать' })
    return
  }
  pending.delete(ctx.from.id)
  await ctx.answerCallbackQuery()
  await ctx.editMessageText(`Восстанавливаю из «${op.name}»…`)
  const r = await restoreBackup(op.name)
  if (!r.ok) {
    await ctx.reply(`❌ Restore failed\n${r.error}`)
    return
  }
  await logEvent({
    userId: ctx.from.id,
    action: 'restore',
    details: `from ${r.name} · файлов ${r.restored.length} · emergency ${r.emergency ?? '—'}`,
  })
  await ctx.reply(
    '✅ Restore complete\n\n' +
      `Из бэкапа: ${r.name}\n` +
      `Восстановлено файлов: ${r.restored.length}\n` +
      `Emergency backup: ${r.emergency ?? '—'}\n\n` +
      '⚠️ Изменились файлы в src/data/. Если затронуты новости/акции — перед /price проверьте /git_status.',
  )
})

// --- E22.7 /system_status ---
bot.command('system_status', async (ctx) => {
  try {
    const [aCount, backups, h, lastDep] = await Promise.all([
      auditCount(),
      listBackups(),
      checkHealth(),
      lastEventMatching(['deploy', 'publish', 'price_update']),
    ])
    const last = backups[0] ?? null
    await ctx.reply(
      '🛡 System Status\n\n' +
        `Audit events:\n${aCount}\n\n` +
        `Backups:\n${backups.length}\n\n` +
        `Last backup:\n${last ? last.name : '—'}\n\n` +
        `Site:\n${h.ok ? '🟢 ONLINE' : '🔴 OFFLINE'}\n\n` +
        `Deploy:\n${lastDep ? formatRu(lastDep.createdAt) : '—'}`,
    )
  } catch (err) {
    await ctx.reply(`❌ /system_status недоступен\nОшибка: ${err.message}`)
  }
})

// --- callbacks ---
bot.callbackQuery('price:cancel', async (ctx) => {
  pending.delete(ctx.from.id)
  await ctx.answerCallbackQuery()
  await ctx.editMessageText('Отменено.')
})

bot.callbackQuery('price:confirm', async (ctx) => {
  const op = pending.get(ctx.from.id)
  if (!op || op.type !== 'price') {
    await ctx.answerCallbackQuery({ text: 'Нечего подтверждать' })
    return
  }
  pending.delete(ctx.from.id)
  await ctx.answerCallbackQuery()
  await ctx.editMessageText(`Применяю цены (${op.station})…`)

  const upd = await runUpdate(op.station, op.cleaned, op.source)
  if (!upd.ok) {
    await ctx.reply('❌ Ошибка обновления цен:\n' + (upd.stderr || upd.stdout).slice(-1500))
    return
  }
  await logEvent({
    userId: ctx.from.id,
    action: 'price_update',
    details: `${op.station}: ${Object.entries(op.cleaned).map(([k, v]) => `${k}=${v}`).join(' ')}`,
  })
  await ctx.reply('✅ Цены записаны. Запускаю build…')

  const build = await runBuild()
  if (!build.ok) {
    // Защита: deploy НЕ запускается при упавшем build.
    await ctx.reply(
      '❌ Цены обновлены\nBuild: FAIL\nDeploy: SKIPPED (build упал)\n\n' +
        (build.stderr || build.stdout).slice(-1200),
    )
    return
  }

  // Build прошёл → git commit/push (только prices.json) → deploy.
  const git = await gitDeploy()

  // Защита: deploy не запускается, если git не дошёл до успешного push.
  if (git.status === 'aborted') {
    await ctx.reply(
      '⚠️ Цены обновлены\nBuild: PASS\nGit: ОСТАНОВЛЕНО\nDeploy: SKIPPED\n\n' +
        'В рабочем дереве есть изменения кроме prices.json:\n• ' +
        git.others.join('\n• ') +
        '\n\nКоммит не сделан. Разберите эти изменения вручную.',
    )
    return
  }
  if (git.status === 'nochange') {
    await ctx.reply('⚠️ Build PASS, но prices.json не изменился — коммитить нечего. Deploy пропущен.')
    return
  }
  if (git.status === 'fail') {
    await ctx.reply(
      `❌ Цены обновлены\nBuild: PASS\nGit: FAIL (${git.step})\nDeploy: SKIPPED (git упал)\n\n` +
        String(git.message).slice(-800),
    )
    return
  }

  // git push OK → деплой.
  const deploy = await runDeploy()
  let deployLine
  if (deploy.status === 'ok') deployLine = 'PASS'
  else if (deploy.status === 'skipped')
    deployLine = 'SKIPPED (VERCEL_DEPLOY_HOOK_URL не задан)'
  else deployLine = `FAIL (${deploy.message})`

  const p = await readPrices()
  const stName = p.stations?.[op.station]?.name ?? op.station
  await ctx.reply(
    `✅ Цены обновлены — ${stName} (${op.station})\n` +
      'Build: PASS\n' +
      'Git push: PASS\n' +
      `Deploy: ${deployLine}\n` +
      `Источник: ${p.source ?? '—'}\n` +
      `Обновлено: ${p.updatedAt ?? '—'}`,
  )
})

bot.callbackQuery('publish:cancel', async (ctx) => {
  pending.delete(ctx.from.id)
  await ctx.answerCallbackQuery()
  await ctx.editMessageText('Отменено.')
})

bot.callbackQuery('publish:confirm', async (ctx) => {
  const op = pending.get(ctx.from.id)
  if (!op || op.type !== 'publish') {
    await ctx.answerCallbackQuery({ text: 'Нечего подтверждать' })
    return
  }
  pending.delete(ctx.from.id)
  await ctx.answerCallbackQuery()

  await ctx.editMessageText('Запускаю деплой…')
  const deploy = await runDeploy()
  if (deploy.status === 'skipped') {
    await ctx.reply('❌ VERCEL_DEPLOY_HOOK_URL не задан. Добавьте его в .env, чтобы публиковать.')
    return
  }
  if (deploy.status === 'fail') {
    await ctx.reply(`❌ Deploy: FAIL (${deploy.message})`)
    return
  }
  await logEvent({ userId: ctx.from.id, action: 'publish', details: `deploy ${deploy.status}` })
  await ctx.reply('🚀 Деплой запущен (Vercel). Git push бот не делает.')
})

// --- lead_clear callbacks ---
bot.callbackQuery('lead_clear:cancel', async (ctx) => {
  pending.delete(ctx.from.id)
  await ctx.answerCallbackQuery()
  await ctx.editMessageText('Отменено.')
})

bot.callbackQuery('lead_clear:confirm', async (ctx) => {
  const op = pending.get(ctx.from.id)
  if (!op || op.type !== 'lead_clear') {
    await ctx.answerCallbackQuery({ text: 'Нечего подтверждать' })
    return
  }
  pending.delete(ctx.from.id)
  await ctx.answerCallbackQuery()
  try {
    await clearLeads()
    await logEvent({ userId: ctx.from.id, action: 'leads_clear', details: 'все заявки' })
    await ctx.editMessageText('🗑 Все заявки очищены.')
  } catch (err) {
    await ctx.editMessageText(`❌ Не удалось очистить: ${err.message}`)
  }
})

// --- content/news/promo confirm callbacks ---
bot.callbackQuery(['content:cancel', 'news:cancel', 'promo:cancel'], async (ctx) => {
  pending.delete(ctx.from.id)
  flows.delete(ctx.from.id)
  await ctx.answerCallbackQuery()
  await ctx.editMessageText('Отменено.')
})

bot.callbackQuery('content:confirm', async (ctx) => {
  const op = pending.get(ctx.from.id)
  if (!op || op.type !== 'content') {
    await ctx.answerCallbackQuery({ text: 'Нечего подтверждать' })
    return
  }
  pending.delete(ctx.from.id)
  await ctx.answerCallbackQuery()
  await ctx.editMessageText('Применяю и публикую…')
  try {
    await writeContacts(op.newContent)
    await logEvent({ userId: ctx.from.id, action: 'content_update', details: 'contacts' })
    await publishFiles(ctx, [CONTACTS_REL], 'chore: update site content')
  } catch (err) {
    await ctx.reply(`❌ Не удалось применить: ${err.message}`)
  }
})

bot.callbackQuery('news:confirm', async (ctx) => {
  const op = pending.get(ctx.from.id)
  if (!op || op.type !== 'news') {
    await ctx.answerCallbackQuery({ text: 'Нечего подтверждать' })
    return
  }
  pending.delete(ctx.from.id)
  await ctx.answerCallbackQuery()
  await ctx.editMessageText('Сохраняю и публикую новость…')
  try {
    await news.add(op.data)
    await logEvent({ userId: ctx.from.id, action: 'news_create', details: op.data?.title ?? '' })
    await publishFiles(ctx, ['src/data/news.json'], 'chore: add news')
  } catch (err) {
    await ctx.reply(`❌ Не удалось опубликовать: ${err.message}`)
  }
})

bot.callbackQuery('promo:confirm', async (ctx) => {
  const op = pending.get(ctx.from.id)
  if (!op || op.type !== 'promo') {
    await ctx.answerCallbackQuery({ text: 'Нечего подтверждать' })
    return
  }
  pending.delete(ctx.from.id)
  await ctx.answerCallbackQuery()
  await ctx.editMessageText('Сохраняю и публикую акцию…')
  try {
    await promos.add(op.data)
    await logEvent({ userId: ctx.from.id, action: 'promo_create', details: op.data?.title ?? '' })
    await publishFiles(ctx, ['src/data/promos.json'], 'chore: add promo')
  } catch (err) {
    await ctx.reply(`❌ Не удалось опубликовать: ${err.message}`)
  }
})

// --- пошаговые сценарии (news/promo/content) на обычных текстовых сообщениях ---
bot.on('message:text', async (ctx) => {
  const text = ctx.msg.text
  if (text.startsWith('/')) return // команды обрабатываются своими хендлерами
  const flow = flows.get(ctx.from.id)
  if (!flow) return
  try {
    if (flow.type === 'content') {
      flows.delete(ctx.from.id)
      const prep = await prepareContentEdit(text)
      if (!prep.ok) {
        await ctx.reply(`❌ ${prep.error}`)
        return
      }
      pending.set(ctx.from.id, { type: 'content', newContent: prep.newContent })
      const kb = new InlineKeyboard()
        .text('✅ Применить', 'content:confirm')
        .text('❌ Отмена', 'content:cancel')
      await ctx.reply(`Изменения:\n\n${prep.preview}\n\nПрименить и задеплоить?`, { reply_markup: kb })
      return
    }

    if (flow.type === 'news' || flow.type === 'promo') {
      if (flow.step === 'title') {
        flow.data.title = text.trim()
        flow.step = 'text'
        await ctx.reply('Введите текст:')
        return
      }
      if (flow.step === 'text') {
        flow.data.text = text.trim()
        flow.step = 'photo'
        await ctx.reply('Пришлите ссылку на фото или напишите «нет»:')
        return
      }
      if (flow.step === 'photo') {
        const ph = text.trim().toLowerCase()
        flow.data.photo = ph === 'нет' || ph === 'no' ? '' : text.trim()
        flows.delete(ctx.from.id)
        pending.set(ctx.from.id, { type: flow.type, data: flow.data })
        const kb = new InlineKeyboard()
          .text('✅ Опубликовать', `${flow.type}:confirm`)
          .text('❌ Отмена', `${flow.type}:cancel`)
        await ctx.reply(
          `${flow.type === 'news' ? '📰 Новость' : '🎟 Акция'}:\n\n` +
            `${flow.data.title}\n\n${flow.data.text}\n\n` +
            `Фото: ${flow.data.photo || '—'}\n\nОпубликовать (build + push + deploy)?`,
          { reply_markup: kb },
        )
        return
      }
    }
  } catch (err) {
    flows.delete(ctx.from.id)
    await ctx.reply(`❌ Ошибка сценария: ${err.message}`)
  }
})

bot.catch((err) => {
  // Не логируем токен/чувствительные данные — только сообщение.
  console.error('Bot error:', err.error?.message ?? err.message ?? 'unknown')
})

// ===== E11/E16 — планировщики (напоминания + ежедневный отчёт 08:00) =====
async function tickReminders() {
  try {
    const due = await popDueReminders()
    for (const r of due) {
      for (const id of config.adminIds) {
        try {
          await bot.api.sendMessage(id, `⏰ Напоминание\n${r.text}`)
        } catch {
          /* пропускаем недоставленные */
        }
      }
    }
  } catch {
    /* не валим планировщик */
  }
}

let lastDailyReportDay = -1
async function tickDailyReport() {
  try {
    const now = new Date()
    if (now.getHours() === 8 && now.getDate() !== lastDailyReportDay) {
      lastDailyReportDay = now.getDate()
      const [s, h, p, v] = await Promise.all([
        leadStats(),
        checkHealth(),
        readPrices().catch(() => ({})),
        gitVersion(),
      ])
      const text =
        '📅 Ежедневный отчёт\n\n' +
        `Заявки: всего ${s.total}, новых ${s.byStatus.new}, сегодня ${s.today}\n` +
        `Сайт: ${h.ok ? '🟢 online' : '🔴 offline'}\n` +
        `Последний коммит: ${v.commit ?? '—'}\n` +
        `Цены АЗС №1: ${FUEL_KEYS.map((k) => `${LABELS[k]} ${p.stations?.azs1?.fuel?.[k] ?? '—'}`).join(' / ')}\n` +
        `Цены АЗС №2: ${FUEL_KEYS.map((k) => `${LABELS[k]} ${p.stations?.azs2?.fuel?.[k] ?? '—'}`).join(' / ')}\n` +
        `Цены обновлены: ${formatTs(p.updatedAt)}`
      for (const id of config.adminIds) {
        try {
          await bot.api.sendMessage(id, text)
        } catch {
          /* пропускаем */
        }
      }
    }
  } catch {
    /* не валим планировщик */
  }
}

// E22.6 — ежедневный backup в 03:00 (если бот запущен).
let lastDailyBackupDay = -1
async function tickDailyBackup() {
  try {
    const now = new Date()
    if (now.getHours() === 3 && now.getDate() !== lastDailyBackupDay) {
      lastDailyBackupDay = now.getDate()
      const r = await createBackup()
      if (r.ok) {
        await logEvent({
          userId: 'system',
          action: 'backup',
          details: `daily ${r.name} · ${r.count} файл(ов) · ${r.sizeText}`,
        })
      }
    }
  } catch {
    /* не валим планировщик */
  }
}

setInterval(tickReminders, 60_000)
setInterval(tickDailyReport, 60_000)
setInterval(tickDailyBackup, 60_000)

// ===== E8 — приём заявок с сайта + мгновенное уведомление админов =====
async function notifyLead(lead) {
  const text =
    '🔔 Новая заявка\n\n' +
    `Имя:\n${lead.name}\n\n` +
    `Телефон:\n${lead.phone}\n\n` +
    `Комментарий:\n${lead.message || '—'}\n\n` +
    `Время:\n${formatRu(lead.createdAt)}\n\n` +
    `Источник:\n${lead.source}`
  for (const id of config.adminIds) {
    try {
      await bot.api.sendMessage(id, text)
    } catch {
      // не валим процесс из-за одного недоставленного уведомления
    }
  }
}

const LEAD_API_PORT = Number(process.env.LEAD_API_PORT || 8787)
startLeadApi({ port: LEAD_API_PORT, onLead: notifyLead })

bot.start({ onStart: () => console.log('✅ Price bot запущен (long polling).') })
