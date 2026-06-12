// E3 — Telegram Price Bot (MVP, grammy, long polling).
// Обновляет цены сайта через scripts/update-prices.mjs с подтверждением.
// Деплой — вариант B: build + Vercel deploy hook. Git push бот НЕ делает.

import { Bot, InlineKeyboard } from 'grammy'
import { config, isAdmin } from './config.mjs'
import { validateFuel, FUEL_KEYS, STATION_KEYS } from '../scripts/lib/validate.mjs'
import { readPrices, runUpdate, runBuild, runDeploy, gitDeploy } from './prices.mjs'

const LABELS = { ai92: 'АИ-92', ai95: 'АИ-95', dt: 'ДТ', gas: 'СУГ' }

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
      'Любое изменение требует подтверждения кнопкой.',
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

bot.catch((err) => {
  // Не логируем токен/чувствительные данные — только сообщение.
  console.error('Bot error:', err.error?.message ?? err.message ?? 'unknown')
})

bot.start({ onStart: () => console.log('✅ Price bot запущен (long polling).') })
