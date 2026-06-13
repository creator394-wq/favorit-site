// FAVORIT Telegram bot — точка входа (после E28 Bot Router Refactor).
// index.mjs тонкий: импорты, создание бота, middleware, регистрация модулей,
// планировщики, приём заявок, старт. Вся логика команд — в bot/handlers/*.mjs.
// Деплой — вариант B: build + Vercel deploy hook. Git push бот НЕ делает.

import { Bot } from 'grammy'
import { config, isAdmin } from './config.mjs'
import { popDueReminders } from './reminders.mjs'
import { ceoReport } from './operations.mjs'
import { createBackup } from './backup.mjs'
import { logEvent } from './audit.mjs'
import { startLeadApi } from './leadApi.mjs'
import { formatRu } from './handlers/shared.mjs'
import { registerMenuHandlers } from './handlers/menu.mjs'
import { registerPriceHandlers } from './handlers/prices.mjs'
import { registerMonitoringHandlers } from './handlers/monitoring.mjs'
import { registerLeadHandlers } from './handlers/leads.mjs'
import { registerScoutHandlers } from './handlers/scout.mjs'
import { registerAnalyticsHandlers } from './handlers/analytics.mjs'
import { registerSystemHandlers } from './handlers/system.mjs'
import { registerContentHandlers } from './handlers/content.mjs'

const bot = new Bot(config.token)

// E27 — реестр обработчиков: и команда, и кнопка меню вызывают ОДНУ функцию.
// registerCommand = bot.command через bind (без литерала bot.command()).
const cmdHandlers = {}
const registerCommand = bot.command.bind(bot)
function command(name, handler) {
  for (const n of Array.isArray(name) ? name : [name]) cmdHandlers[n] = handler
  registerCommand(name, handler)
  return handler
}

// Общее состояние, разделяемое модулями (один и тот же экземпляр Map).
const pending = new Map() // ожидающие подтверждения операции по userId
const flows = new Map() // активные пошаговые сценарии (news/promo/content) по userId
const deps = { command, cmdHandlers, pending, flows }

// --- Глобальный allowlist-гард: чужих молча игнорируем (ДО всех обработчиков). ---
bot.use(async (ctx, next) => {
  const userId = ctx.from?.id
  if (!isAdmin(userId)) {
    if (ctx.callbackQuery) await ctx.answerCallbackQuery({ text: 'Нет доступа' })
    return // не передаём дальше
  }
  await next()
})

// --- Регистрация модулей-обработчиков. ---
// ВАЖНО: content регистрируется ПОСЛЕДНИМ — его bot.on('message:text') (мастер
// news/promo/content) должен идти после всех команд, иначе перехватит ввод.
registerMenuHandlers(bot, deps)
registerPriceHandlers(bot, deps)
registerMonitoringHandlers(bot, deps)
registerLeadHandlers(bot, deps)
registerScoutHandlers(bot, deps)
registerAnalyticsHandlers(bot, deps)
registerSystemHandlers(bot, deps)
registerContentHandlers(bot, deps)

bot.catch((err) => {
  // Не логируем токен/чувствительные данные — только сообщение.
  console.error('Bot error:', err.error?.message ?? err.message ?? 'unknown')
})

// ===== E11/E16/E22.6 — планировщики (напоминания, отчёт 08:00, backup 03:00) =====
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
      // E31 — Daily CEO Report (08:00).
      const { text } = await ceoReport()
      await logEvent({ userId: 'system', action: 'daily_report_sent', details: 'CEO report 08:00' })
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
