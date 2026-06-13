// E28 — система/надёжность: /deploy, /publish, /audit*, /backup*, /system_status
// + publish/restore callbacks. Поведение идентично прежнему.
import { InlineKeyboard } from 'grammy'
import {
  logEvent,
  recentEvents,
  lastEvent,
  searchEvents,
  auditCount,
  lastEventMatching,
} from '../audit.mjs'
import { createBackup, listBackups, restoreBackup } from '../backup.mjs'
import { runDeploy } from '../prices.mjs'
import { checkHealth } from '../monitor.mjs'
import { sid, formatRu } from './shared.mjs'

const auditLine = (e) => `${formatRu(e.createdAt)} · ${e.action}\n${e.details || '—'}`

export function registerSystemHandlers(bot, deps) {
  const { command, pending } = deps

  // --- /deploy (ручной, прямой вызов runDeploy) ---
  command('deploy', async (ctx) => {
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

  // --- /publish ---
  command('publish', async (ctx) => {
    pending.set(ctx.from.id, { type: 'publish' })
    const kb = new InlineKeyboard()
      .text('🚀 Деплой', 'publish:confirm')
      .text('✖ Отмена', 'publish:cancel')
    await ctx.reply('Запустить деплой сайта через Vercel deploy hook?', { reply_markup: kb })
  })

  // ===== E22 — Audit Log =====
  // --- /audit (последние 20) ---
  command('audit', async (ctx) => {
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

  // --- /audit_last (последнее событие полностью) ---
  command('audit_last', async (ctx) => {
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

  // --- /audit_search <слово> ---
  command('audit_search', async (ctx) => {
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

  // ===== E22.4 — Backups =====
  command('backup_now', async (ctx) => {
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

  command('backups', async (ctx) => {
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

  command('backup_restore', async (ctx) => {
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

  // --- /system_status ---
  command('system_status', async (ctx) => {
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

  // --- publish callbacks ---
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

  // --- restore callbacks (E22.5) ---
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
}
