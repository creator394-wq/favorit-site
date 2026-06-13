// E28 — точки входа и кнопочное меню (E27): /start, /help, /menu + навигация.
// Кнопки вызывают ту же функцию, что и команды, через реестр deps.cmdHandlers.
import { InlineKeyboard } from 'grammy'
import { STATION_KEYS } from '../../scripts/lib/validate.mjs'
import { logEvent } from '../audit.mjs'
import { isScoutConfigured, getFleetStats } from '../scout.mjs'
import { SCOUT_NOT_CONFIGURED } from './shared.mjs'

const HELP_TEXT =
  'Команды Site Manager «Фаворит Сервис»:\n\n' +
  '📋 Основное управление — через кнопочное меню: /menu\n\n' +
  '/start — приветствие\n' +
  '/menu — кнопочное меню управления\n' +
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
  'Аналитика и бизнес:\n' +
  '/analytics · /top_pages · /sources · /conversion\n' +
  '/dashboard — Control Center · /report — отчёт директора\n\n' +
  'Автопарк (СКАУТ):\n' +
  '/scout_status · /scout_fleet (/fleet) · /scout_truck <id|номер>\n' +
  '/scout_fuel · /scout_map <id|номер> · /scout_offline\n\n' +
  'Проектная память: /docs · /roadmap · /session_log <текст>\n\n' +
  'Аудит и бэкапы:\n' +
  '/audit · /audit_last · /audit_search <слово>\n' +
  '/backup_now · /backups · /backup_restore <date>\n' +
  '/system_status'

const homeKb = () => new InlineKeyboard().text('🏠 Главное меню', 'menu:main')
const withBack = (kb) => kb.row().text('🔙 Назад', 'menu:main')

function mainMenuKb() {
  return new InlineKeyboard()
    .text('🏢 Дашборд', 'menu:act:dashboard')
    .row()
    .text('⛽ Цены АЗС', 'menu:sec:prices')
    .text('📞 Заявки / CRM', 'menu:sec:crm')
    .row()
    .text('🚚 Транспорт', 'menu:sec:transport')
    .text('📰 Контент', 'menu:sec:content')
    .row()
    .text('📊 Аналитика', 'menu:sec:analytics')
    .text('🛡 Надёжность', 'menu:sec:reliability')
    .row()
    .text('⚙️ Система', 'menu:sec:system')
}

// Подменю: каждое заканчивается кнопкой 🔙 Назад.
const SECTIONS = {
  prices: () =>
    withBack(
      new InlineKeyboard()
        .text('📊 Текущие цены', 'menu:act:status')
        .row()
        .text('✏️ Изменить АЗС №1', 'menu:act:price1')
        .row()
        .text('✏️ Изменить АЗС №2', 'menu:act:price2'),
    ),
  crm: () =>
    withBack(
      new InlineKeyboard()
        .text('📋 Последние заявки', 'menu:act:leads')
        .row()
        .text('🧾 Последняя заявка', 'menu:act:lead_last')
        .row()
        .text('📈 Воронка', 'menu:act:lead_stats')
        .row()
        .text('⏰ Напоминания', 'menu:act:reminders'),
    ),
  transport: () =>
    withBack(
      new InlineKeyboard()
        .text('🚚 Парк', 'menu:act:scout_fleet')
        .row()
        .text('⛽ Топливо', 'menu:act:scout_fuel')
        .row()
        .text('⚠️ Offline', 'menu:act:scout_offline')
        .row()
        .text('📊 Отчёт транспорта', 'menu:act:transport_report'),
    ),
  content: () =>
    withBack(
      new InlineKeyboard()
        .text('📰 Новости', 'menu:act:news_list')
        .row()
        .text('🎯 Акции', 'menu:act:promo_list')
        .row()
        .text('✏️ Изменить контент', 'menu:act:content')
        .row()
        .text('🧠 Obsidian docs', 'menu:act:docs'),
    ),
  analytics: () =>
    withBack(
      new InlineKeyboard()
        .text('📊 Аналитика', 'menu:act:analytics')
        .row()
        .text('📄 Топ страниц', 'menu:act:top_pages')
        .row()
        .text('🌐 Источники', 'menu:act:sources')
        .row()
        .text('📈 Конверсия', 'menu:act:conversion')
        .row()
        .text('🧠 AI отчёт', 'menu:act:report')
        .row()
        .text('🏢 Operations Director', 'menu:act:operations')
        .row()
        .text('👔 CEO Report', 'menu:act:ceo_report')
        .row()
        .text('🚚 Scout Alerts', 'menu:act:scout_alerts')
        .row()
        .text('🚚 Drivers', 'menu:act:scout_drivers')
        .row()
        .text('🚚 Engines', 'menu:act:scout_engine'),
    ),
  reliability: () =>
    withBack(
      new InlineKeyboard()
        .text('🧾 Audit', 'menu:act:audit')
        .row()
        .text('💾 Backup now', 'menu:act:backup_now')
        .row()
        .text('📦 Backups', 'menu:act:backups')
        .row()
        .text('🧯 System status', 'menu:act:system_status'),
    ),
  system: () =>
    withBack(
      new InlineKeyboard()
        .text('❤️ Health', 'menu:act:health')
        .row()
        .text('📸 Screenshot', 'menu:act:screenshot')
        .row()
        .text('🧬 Version', 'menu:act:version')
        .row()
        .text('🚀 Deploy', 'menu:act:deploy'),
    ),
}

const SECTION_TITLES = {
  prices: '⛽ Цены АЗС',
  crm: '📞 Заявки / CRM',
  transport: '🚚 Транспорт',
  content: '📰 Контент',
  analytics: '📊 Аналитика',
  reliability: '🛡 Надёжность',
  system: '⚙️ Система',
}

const MAIN_MENU_TEXT = '🏢 FAVORIT — Центр управления\n\nВыберите раздел:'

const PRICE1_HINT =
  'Чтобы изменить цены АЗС №1, отправьте:\n\n/price azs1 ai92=60.10 ai95=65.10 dt=69.10 gas=32.10'
const PRICE2_HINT =
  'Чтобы изменить цены АЗС №2, отправьте:\n\n/price azs2 ai92=61.10 ai95=66.10 dt=70.10 gas=33.10'

// Краткий отчёт транспорта для кнопки (использует ту же getFleetStats).
async function transportReport(ctx) {
  if (!isScoutConfigured()) {
    await ctx.reply(SCOUT_NOT_CONFIGURED)
    return
  }
  const s = await getFleetStats()
  if (!s) {
    await ctx.reply('🚚 Отчёт транспорта\n\nДанные недоступны.')
    return
  }
  await ctx.reply(
    '🚚 Отчёт транспорта\n\n' +
      `Машин: ${s.total}\n` +
      `Двигатель ON: ${s.engineOn}\n` +
      `Offline (>${s.offlineMinutes}м): ${s.offline}\n` +
      `Топливо известно: ${s.fuelKnown}\n` +
      (s.noFuel.length ? `Без датчика топлива: ${s.noFuel.join(', ')}` : 'Все датчики топлива на связи'),
  )
}

async function showMainMenu(ctx, edit) {
  const opts = { reply_markup: mainMenuKb() }
  if (edit) {
    try {
      await ctx.editMessageText(MAIN_MENU_TEXT, opts)
      return
    } catch {
      /* сообщение нельзя отредактировать — отправим новое */
    }
  }
  await ctx.reply(MAIN_MENU_TEXT, opts)
}

export function registerMenuHandlers(bot, deps) {
  const { command, cmdHandlers } = deps

  // --- /start ---
  command('start', async (ctx) => {
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
        'Любое изменение цен требует подтверждения кнопкой.\n\n' +
        'Удобнее управлять через кнопочное меню — /menu.',
      { reply_markup: new InlineKeyboard().text('📋 Открыть меню', 'menu:main') },
    )
  })

  // --- /help ---
  command('help', async (ctx) => {
    await ctx.reply(HELP_TEXT)
  })

  // --- /menu ---
  command('menu', async (ctx) => {
    await logEvent({ userId: ctx.from.id, action: 'menu_open', details: '/menu' })
    await showMainMenu(ctx, false)
  })

  // Навигация: главное меню
  bot.callbackQuery('menu:main', async (ctx) => {
    await ctx.answerCallbackQuery()
    await logEvent({ userId: ctx.from.id, action: 'menu_open', details: 'main' })
    await showMainMenu(ctx, true)
  })

  // Навигация: разделы
  bot.callbackQuery(/^menu:sec:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery()
    const sec = ctx.match[1]
    const build = SECTIONS[sec]
    if (!build) {
      await ctx.reply('Раздел не найден.', { reply_markup: homeKb() })
      return
    }
    await logEvent({ userId: ctx.from.id, action: 'menu_section_open', details: sec })
    const text = `${SECTION_TITLES[sec]}\n\nВыберите действие:`
    try {
      await ctx.editMessageText(text, { reply_markup: build() })
    } catch {
      await ctx.reply(text, { reply_markup: build() })
    }
  })

  // Действия: вызывают существующую логику команд (cmdHandlers) — без дублирования.
  bot.callbackQuery(/^menu:act:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery()
    const action = ctx.match[1]
    await logEvent({ userId: ctx.from.id, action: 'menu_action', details: action })
    try {
      if (action === 'price1') await ctx.reply(PRICE1_HINT)
      else if (action === 'price2') await ctx.reply(PRICE2_HINT)
      else if (action === 'transport_report') await transportReport(ctx)
      else {
        const fn = cmdHandlers[action]
        if (!fn) {
          await ctx.reply('Действие не найдено.', { reply_markup: homeKb() })
          return
        }
        await fn(ctx) // та же функция, что и у команды
      }
    } catch (err) {
      await ctx.reply(`❌ Ошибка: ${err.message}`, { reply_markup: homeKb() })
      return
    }
    await ctx.reply('⬆️ Готово.', { reply_markup: homeKb() })
  })
}
