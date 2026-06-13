// E41-A — Topaz handlers. Делятся на две части:
//  1) registerTopazIntake(bot) — приём photo-сообщений из группы операторов.
//     Регистрируется В index.mjs ДО глобального allowlist-middleware, потому что
//     операторы НЕ входят в TELEGRAM_ADMIN_IDS. В группу бот не отвечает.
//  2) registerTopazHandlers(bot, deps) — команды и callback-кнопки. Регистрируются
//     как обычные обработчики (ПОСЛЕ allowlist) → доступны только админам.
import {
  isTopazConfigured,
  isTopazGroup,
  getTopazAdminChatId,
  getTopazConfig,
  createOrUpdateTopazSession,
  listTopazSessions,
  getTopazSession,
  cancelTopazSession,
  processTopazSession,
  topazSessionCounts,
  topazSessionKeyboard,
  formatTopazSessionNotice,
  formatTopazSessionCard,
  topazShortId,
  setTopazOcr,
} from '../topaz.mjs'
import { ocrTopazSession } from '../topazOcr.mjs'
import { parseTopazReport, formatTopazStructured } from '../topazParser.mjs'
import { addShift, reportToday, reportYesterday, reportLast } from '../reports.mjs'
import { logEvent } from '../audit.mjs'

// ===== 1) Приём фото из группы (до allowlist) =====
export function registerTopazIntake(bot) {
  bot.on('message:photo', async (ctx, next) => {
    // Не наша группа / Топаз не настроен → пропускаем дальше по цепочке.
    if (!isTopazConfigured() || !isTopazGroup(ctx)) return next()
    try {
      const sizes = ctx.message.photo
      const photo = sizes[sizes.length - 1] // самая большая версия фото
      const { session } = await createOrUpdateTopazSession(ctx, photo)
      const adminChatId = getTopazAdminChatId()
      if (adminChatId) {
        // В личку админу — короткое уведомление. В группу НЕ пишем.
        await ctx.api.sendMessage(adminChatId, formatTopazSessionNotice(session)).catch(() => {})
      }
    } catch {
      /* приём фото не должен падать и не должен писать в группу */
    }
    // next() НЕ вызываем — фото обработано, дальше не идёт.
  })
}

// ===== 2) Команды и callbacks (после allowlist → только админы) =====
export function registerTopazHandlers(bot, deps) {
  const { command } = deps

  // --- /topaz_status ---
  command('topaz_status', async (ctx) => {
    try {
      const cfg = getTopazConfig()
      const c = await topazSessionCounts()
      await ctx.reply(
        '🧾 Топаз — статус\n\n' +
          `Группа: ${isTopazConfigured() ? `✅ ${cfg.groupId}` : '❌ TOPAZ_GROUP_ID не задан'}\n` +
          `Название: ${cfg.groupTitle || '—'}\n` +
          `Admin chat: ${cfg.adminChatId || '—'}\n` +
          `Idle-таймаут: ${cfg.idleMinutes} мин\n\n` +
          'Сессии:\n' +
          `🟡 collecting ${c.collecting} · ✅ ready ${c.ready}\n` +
          `📦 processed ${c.processed} · 🚫 cancelled ${c.cancelled}\n` +
          `Всего: ${c.total}`,
      )
    } catch (err) {
      await ctx.reply(`❌ /topaz_status недоступен\nОшибка: ${err.message}`)
    }
  })

  // --- /topaz_sessions (последние 10) ---
  command('topaz_sessions', async (ctx) => {
    try {
      const list = await listTopazSessions(10)
      if (!list.length) {
        await ctx.reply('🧾 Сессий Топаз пока нет.')
        return
      }
      const body = list
        .map((s) => `${topazShortId(s.id)} · ${s.status} · ${s.operatorName} · ${s.photoCount}📷`)
        .join('\n')
      await ctx.reply('🧾 Последние сессии Топаз\n(id — слева)\n\n' + body)
    } catch (err) {
      await ctx.reply(`❌ /topaz_sessions недоступен\nОшибка: ${err.message}`)
    }
  })

  // --- /topaz_view <id> ---
  command('topaz_view', async (ctx) => {
    try {
      const id = (ctx.match ?? '').trim()
      if (!id) {
        await ctx.reply('Использование: /topaz_view <id>')
        return
      }
      const s = await getTopazSession(id)
      if (!s) {
        await ctx.reply('❌ Сессия не найдена.')
        return
      }
      await ctx.reply(formatTopazSessionCard(s), { reply_markup: topazSessionKeyboard(s.id) })
    } catch (err) {
      await ctx.reply(`❌ /topaz_view недоступен\nОшибка: ${err.message}`)
    }
  })

  // --- /topaz_cancel <id> ---
  command('topaz_cancel', async (ctx) => {
    try {
      const id = (ctx.match ?? '').trim()
      if (!id) {
        await ctx.reply('Использование: /topaz_cancel <id>')
        return
      }
      const r = await cancelTopazSession(id)
      if (!r.ok) {
        await ctx.reply(`❌ ${r.error}`)
        return
      }
      await ctx.reply('🚫 Сессия отменена\n\n' + formatTopazSessionCard(r.session))
    } catch (err) {
      await ctx.reply(`❌ /topaz_cancel недоступен\nОшибка: ${err.message}`)
    }
  })

  // --- /topaz_process <id> (без OCR — ready/collecting → processed) ---
  command('topaz_process', async (ctx) => {
    try {
      const id = (ctx.match ?? '').trim()
      if (!id) {
        await ctx.reply('Использование: /topaz_process <id>')
        return
      }
      const r = await processTopazSession(id)
      if (!r.ok) {
        await ctx.reply(`❌ ${r.error}`)
        return
      }
      // E42 — если есть распознанный отчёт, сохраняем смену в ledger (без дублей).
      let ledgerNote = ''
      const structured = r.session.ocr?.structured
      if (structured) {
        const add = await addShift({ structured, sourceSessionId: r.session.id }).catch(() => ({ created: false }))
        if (add.created) {
          ledgerNote = `\n\n🧾 Смена № ${structured.shiftNumber ?? '—'} сохранена в ledger.`
          await logEvent({
            userId: ctx.from.id,
            action: 'topaz_shift_saved',
            details: `shift ${structured.shiftNumber ?? '—'} · ${structured.station ?? '—'} · session ${topazShortId(r.session.id)}`,
          })
        } else {
          ledgerNote = '\n\nℹ️ Смена уже была в ledger (дубль не создан).'
        }
      } else {
        ledgerNote = '\n\nℹ️ Нет распознанных данных (сначала /topaz_ocr) — в ledger не записано.'
      }
      await ctx.reply('📦 Сессия переведена в processed\n\n' + formatTopazSessionCard(r.session) + ledgerNote)
    } catch (err) {
      await ctx.reply(`❌ /topaz_process недоступен\nОшибка: ${err.message}`)
    }
  })

  // --- /topaz_ocr <id> (ручной запуск OCR; авто-OCR на этом этапе НЕ делаем) ---
  command('topaz_ocr', async (ctx) => {
    const id = (ctx.match ?? '').trim()
    if (!id) {
      await ctx.reply('Использование: /topaz_ocr <id>\n(id — слева в /topaz_sessions)')
      return
    }
    const session = await getTopazSession(id)
    if (!session) {
      await ctx.reply('❌ Сессия не найдена.')
      return
    }
    if (!session.photoCount) {
      await ctx.reply('❌ В сессии нет фото для распознавания.')
      return
    }
    await logEvent({
      userId: ctx.from.id,
      action: 'topaz_ocr_started',
      details: `session ${topazShortId(session.id)} · ${session.photoCount} photo`,
    })
    await ctx.reply(
      `🔍 Запускаю OCR по сессии ${topazShortId(session.id)} (${session.photoCount} фото)…\n` +
        'Скачиваю и распознаю — это может занять до минуты.',
    )
    try {
      const ocr = await ocrTopazSession(bot, session)
      // E41-B3 — структурный парсинг поверх OCR-текста (отдельный модуль).
      const structured = parseTopazReport(ocr.rawText)
      ocr.structured = structured
      await setTopazOcr(session.id, ocr)
      // Аудит без полного текста отчёта: только метрики (OCR + парсер).
      await logEvent({
        userId: ctx.from.id,
        action: 'topaz_ocr_completed',
        details: `session ${topazShortId(session.id)} · ocr ${ocr.confidence}% · parser ${structured.confidence}% · chars ${ocr.rawText.length}`,
      })
      const preview = (ocr.rawText || '')
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 6)
        .join('\n')
      const msg =
        '🧾 OCR Отчёт Топаз\n\n' +
        `Сессия: ${topazShortId(session.id)}\n` +
        `Фото: ${session.photoCount}\n` +
        `Уверенность OCR: ${ocr.confidence}%\n\n` +
        formatTopazStructured(structured) +
        '\n\nПредпросмотр:\n' +
        (preview || '—')
      await ctx.reply(msg.slice(0, 3800))
    } catch (err) {
      await logEvent({
        userId: ctx.from.id,
        action: 'topaz_ocr_failed',
        details: `session ${topazShortId(session.id)} · ${err.message}`,
      })
      await ctx.reply(`❌ OCR не удался\nОшибка: ${err.message}`)
    }
  })

  // ===== E42 — Morning CEO Report (только админы) =====
  const reportCmd = (name, fn, audit) =>
    command(name, async (ctx) => {
      try {
        await logEvent({ userId: ctx.from.id, action: audit, details: name })
        await ctx.reply((await fn()).slice(0, 3900))
      } catch (err) {
        await ctx.reply(`❌ /${name} недоступен\nОшибка: ${err.message}`)
      }
    })
  reportCmd('report_today', reportToday, 'report_today_view')
  reportCmd('report_yesterday', reportYesterday, 'report_yesterday_view')
  reportCmd('report_last', reportLast, 'report_last_view')

  // ===== Callbacks (только админы — за allowlist) =====
  // --- topaz:view:<id> ---
  bot.callbackQuery(/^topaz:view:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery()
    const s = await getTopazSession(ctx.match[1])
    if (!s) {
      await ctx.reply('❌ Сессия не найдена.')
      return
    }
    await ctx.reply(formatTopazSessionCard(s), { reply_markup: topazSessionKeyboard(s.id) })
  })

  // --- topaz:process:<id> ---
  bot.callbackQuery(/^topaz:process:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery()
    const r = await processTopazSession(ctx.match[1])
    await ctx.reply(r.ok ? '📦 Подтверждено: сессия processed\n\n' + formatTopazSessionCard(r.session) : `❌ ${r.error}`)
  })

  // --- topaz:cancel:<id> ---
  bot.callbackQuery(/^topaz:cancel:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery()
    const r = await cancelTopazSession(ctx.match[1])
    await ctx.reply(r.ok ? '🚫 Сессия отменена\n\n' + formatTopazSessionCard(r.session) : `❌ ${r.error}`)
  })
}
