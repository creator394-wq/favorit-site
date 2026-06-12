// E3 — Telegram Price Bot (MVP, grammy, long polling).
// Обновляет цены сайта через scripts/update-prices.mjs с подтверждением.
// Деплой — вариант B: build + Vercel deploy hook. Git push бот НЕ делает.

import { Bot, InlineKeyboard, InputFile } from 'grammy'
import { config, isAdmin } from './config.mjs'
import { validateFuel, FUEL_KEYS, STATION_KEYS } from '../scripts/lib/validate.mjs'
import { readPrices, runUpdate, runBuild, runDeploy, gitDeploy } from './prices.mjs'
import {
  checkHealth,
  takeScreenshot,
  gitVersion,
  gitStatusInfo,
  readRecentLogs,
  formatTs,
  SITE_URL,
} from './monitor.mjs'
import { readLeads, clearLeads, leadStats } from './leads.mjs'
import { startLeadApi } from './leadApi.mjs'

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

const bot = new Bot(config.token)

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
  '/leads — последние 10 заявок\n' +
  '/lead_last — последняя заявка целиком\n' +
  '/lead_stats — статистика заявок\n' +
  '/lead_clear — очистить заявки (с подтверждением)'

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

// ===== E8 — Lead Manager (мини-CRM) =====

// --- /leads (последние 10) ---
bot.command('leads', async (ctx) => {
  try {
    const { leads } = await readLeads()
    if (!leads.length) {
      await ctx.reply('📋 Заявок пока нет.')
      return
    }
    const last10 = leads.slice(-10).reverse()
    const text = last10
      .map((l, i) => `#${leads.length - i}\n${l.name}\n${l.phone}\n${formatRuDate(l.createdAt)}`)
      .join('\n\n')
    await ctx.reply('📋 Последние заявки\n\n' + text)
  } catch (err) {
    await ctx.reply(`❌ /leads недоступен\nОшибка: ${err.message}`)
  }
})

// --- /lead_stats ---
bot.command('lead_stats', async (ctx) => {
  try {
    const s = await leadStats()
    await ctx.reply(
      '📈 Статистика заявок\n\n' +
        `Всего заявок: ${s.total}\n` +
        `Сегодня: ${s.today}\n` +
        `За 7 дней: ${s.week}\n` +
        `Последняя заявка: ${s.last ? formatRu(s.last.createdAt) : '—'}`,
    )
  } catch (err) {
    await ctx.reply(`❌ /lead_stats недоступен\nОшибка: ${err.message}`)
  }
})

// --- /lead_last (последняя заявка полностью) ---
bot.command('lead_last', async (ctx) => {
  try {
    const { leads } = await readLeads()
    const l = leads[leads.length - 1]
    if (!l) {
      await ctx.reply('Заявок пока нет.')
      return
    }
    await ctx.reply(
      `📋 Последняя заявка #${leads.length}\n\n` +
        `Имя:\n${l.name}\n\n` +
        `Телефон:\n${l.phone}\n\n` +
        `Комментарий:\n${l.message || '—'}\n\n` +
        `Время:\n${formatRu(l.createdAt)}\n\n` +
        `Источник:\n${l.source}`,
    )
  } catch (err) {
    await ctx.reply(`❌ /lead_last недоступен\nОшибка: ${err.message}`)
  }
})

// --- /lead_clear (только через подтверждение) ---
bot.command('lead_clear', async (ctx) => {
  pending.set(ctx.from.id, { type: 'lead_clear' })
  const kb = new InlineKeyboard()
    .text('✅ Очистить', 'lead_clear:confirm')
    .text('❌ Отмена', 'lead_clear:cancel')
  await ctx.reply('Очистить ВСЕ заявки? Действие необратимо.', { reply_markup: kb })
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
    await ctx.editMessageText('🗑 Все заявки очищены.')
  } catch (err) {
    await ctx.editMessageText(`❌ Не удалось очистить: ${err.message}`)
  }
})

bot.catch((err) => {
  // Не логируем токен/чувствительные данные — только сообщение.
  console.error('Bot error:', err.error?.message ?? err.message ?? 'unknown')
})

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
