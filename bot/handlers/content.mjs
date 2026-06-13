// E28 — контент и операционные коллекции: новости, акции, контакты (NL),
// техника (E18), ТО (E19), проектная память Obsidian (E21), мастер message:text.
// Поведение идентично прежнему (вынесено из index.mjs без изменений).
import { InlineKeyboard } from 'grammy'
import { news, promos, trucks, maintenance } from '../collections.mjs'
import { prepareContentEdit, writeContacts, CONTACTS_REL } from '../content.mjs'
import { docsHelp, readRoadmap, appendSessionLog } from '../docs.mjs'
import { gitCommitPush, runBuild, runDeploy } from '../prices.mjs'
import { logEvent } from '../audit.mjs'
import { sid, formatRuDate } from './shared.mjs'

/**
 * Общий пайплайн публикации контента: коммит указанных файлов → build → deploy.
 * НЕ трогает ценовой gitDeploy. Прогресс/итог пишется в чат.
 */
export async function publishFiles(ctx, files, message) {
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

export function registerContentHandlers(bot, deps) {
  const { command, pending, flows } = deps

  // ===== E12 — News Manager =====
  command('news_create', async (ctx) => {
    flows.set(ctx.from.id, { type: 'news', step: 'title', data: {} })
    await ctx.reply('📰 Новая новость. Введите заголовок:')
  })

  command('news_list', async (ctx) => {
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

  command('news_delete', async (ctx) => {
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
  command('promo_create', async (ctx) => {
    flows.set(ctx.from.id, { type: 'promo', step: 'title', data: {} })
    await ctx.reply('🎟 Новая акция. Введите заголовок:')
  })

  command('promo_list', async (ctx) => {
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

  command('promo_delete', async (ctx) => {
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

  // ===== E18 — Transport Management (ручной) =====
  command('trucks', async (ctx) => {
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

  command('truck_add', async (ctx) => {
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

  command('truck_edit', async (ctx) => {
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

  command('truck_delete', async (ctx) => {
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
  command('maintenance', async (ctx) => {
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

  command('maintenance_add', async (ctx) => {
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

  command('maintenance_done', async (ctx) => {
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
  command('content', async (ctx) => {
    flows.set(ctx.from.id, { type: 'content', step: 'await', data: {} })
    await ctx.reply(
      '✏️ Content Manager. Напишите, что изменить:\n' +
        '• измени телефон на +7 999 000-00-00\n' +
        '• измени email на mail@example.ru\n' +
        '• измени whatsapp на https://wa.me/79990000000',
    )
  })

  // ===== E21 — Obsidian Project Memory =====
  command('docs', async (ctx) => {
    try {
      await ctx.reply(await docsHelp())
    } catch (err) {
      await ctx.reply(`❌ /docs недоступен\nОшибка: ${err.message}`)
    }
  })

  command('roadmap', async (ctx) => {
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

  command('session_log', async (ctx) => {
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
}
