// E28 — CRM: заявки, статусы, заметки, экспорт, воронка, напоминания.
// Поведение идентично прежнему (вынесено из index.mjs без изменений).
import { InlineKeyboard, InputFile } from 'grammy'
import {
  readLeads,
  clearLeads,
  leadStats,
  findLead,
  setLeadStatus,
  addLeadNote,
  exportLeadsCsv,
  STATUS_LABEL,
} from '../leads.mjs'
import { parseWhen, addReminder, listReminders, cancelReminder } from '../reminders.mjs'
import { logEvent } from '../audit.mjs'
import { sid, formatRu, formatRuDate, leadCard } from './shared.mjs'

export function registerLeadHandlers(bot, deps) {
  const { command, pending } = deps

  // --- /leads (последние 10) ---
  command('leads', async (ctx) => {
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
  command('lead_last', async (ctx) => {
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
  command('lead_view', async (ctx) => {
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
  function statusCommand(cmd, status) {
    command(cmd, async (ctx) => {
      try {
        const id = (ctx.match ?? '').trim()
        if (!id) {
          await ctx.reply(`Формат: /${cmd} <id>`)
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
        await ctx.reply(`❌ /${cmd} недоступен\nОшибка: ${err.message}`)
      }
    })
  }
  statusCommand('lead_done', 'closed')
  statusCommand('lead_reject', 'rejected')
  statusCommand('lead_callback', 'callback')
  statusCommand('lead_work', 'in_progress')

  // --- /lead_note <id> текст ---
  command('lead_note', async (ctx) => {
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
  command('lead_export', async (ctx) => {
    try {
      const csv = await exportLeadsCsv()
      await ctx.replyWithDocument(new InputFile(Buffer.from(csv, 'utf8'), 'leads.csv'))
    } catch (err) {
      await ctx.reply(`❌ /lead_export недоступен\nОшибка: ${err.message}`)
    }
  })

  // --- /lead_clear (подтверждение) ---
  command('lead_clear', async (ctx) => {
    pending.set(ctx.from.id, { type: 'lead_clear' })
    const kb = new InlineKeyboard()
      .text('✅ Очистить', 'lead_clear:confirm')
      .text('❌ Отмена', 'lead_clear:cancel')
    await ctx.reply('Очистить ВСЕ заявки? Действие необратимо.', { reply_markup: kb })
  })

  // ===== E10 — Sales Funnel =====
  command('lead_stats', async (ctx) => {
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
  command('lead_remind', async (ctx) => {
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

  command('reminders', async (ctx) => {
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

  command('remind_cancel', async (ctx) => {
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
}
