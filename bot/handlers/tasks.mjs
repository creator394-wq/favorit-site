// E32/E35 — Task Center + Smart Alerts: /tasks /task_new /task_done /task_cancel
// /task_view /alerts. Стиль и обработка ошибок — как у остальных хендлеров.
import {
  createTask,
  findTask,
  completeTask,
  cancelTask,
  taskCard,
  formatTaskList,
} from '../tasks.mjs'
import { analyzeBusiness } from '../operations.mjs'
import { formatAlerts } from '../alerts.mjs'
import { logEvent } from '../audit.mjs'

export function registerTaskHandlers(bot, deps) {
  const { command } = deps

  // --- /tasks (открытые задачи + сводка) ---
  command('tasks', async (ctx) => {
    try {
      await logEvent({ userId: ctx.from.id, action: 'tasks_view', details: 'list' })
      await ctx.reply((await formatTaskList()).slice(0, 3800))
    } catch (err) {
      await ctx.reply(`❌ /tasks недоступен\nОшибка: ${err.message}`)
    }
  })

  // --- /task_new <текст> ---
  command('task_new', async (ctx) => {
    try {
      const title = (ctx.match ?? '').trim()
      if (!title) {
        await ctx.reply('Использование:\n/task_new <текст задачи>\n\nНапример:\n/task_new Перезвонить клиенту Иванову')
        return
      }
      const r = await createTask({ title, source: 'manual', priority: 'medium' })
      if (!r.ok) {
        await ctx.reply(`❌ Не удалось создать задачу: ${r.error}`)
        return
      }
      await logEvent({ userId: ctx.from.id, action: 'task_create', details: title })
      await ctx.reply('✅ Задача создана\n\n' + taskCard(r.task))
    } catch (err) {
      await ctx.reply(`❌ /task_new недоступен\nОшибка: ${err.message}`)
    }
  })

  // --- /task_done <id> ---
  command('task_done', async (ctx) => {
    try {
      const id = (ctx.match ?? '').trim()
      if (!id) {
        await ctx.reply('Использование: /task_done <id>\n(id — слева в /tasks)')
        return
      }
      const r = await completeTask(id)
      if (!r.ok) {
        await ctx.reply(`❌ ${r.error}`)
        return
      }
      await logEvent({ userId: ctx.from.id, action: 'task_done', details: id })
      await ctx.reply('✅ Задача выполнена\n\n' + taskCard(r.task))
    } catch (err) {
      await ctx.reply(`❌ /task_done недоступен\nОшибка: ${err.message}`)
    }
  })

  // --- /task_cancel <id> ---
  command('task_cancel', async (ctx) => {
    try {
      const id = (ctx.match ?? '').trim()
      if (!id) {
        await ctx.reply('Использование: /task_cancel <id>')
        return
      }
      const r = await cancelTask(id)
      if (!r.ok) {
        await ctx.reply(`❌ ${r.error}`)
        return
      }
      await logEvent({ userId: ctx.from.id, action: 'task_cancel', details: id })
      await ctx.reply('🚫 Задача отменена\n\n' + taskCard(r.task))
    } catch (err) {
      await ctx.reply(`❌ /task_cancel недоступен\nОшибка: ${err.message}`)
    }
  })

  // --- /task_view <id> ---
  command('task_view', async (ctx) => {
    try {
      const id = (ctx.match ?? '').trim()
      if (!id) {
        await ctx.reply('Использование: /task_view <id>')
        return
      }
      const t = await findTask(id)
      if (!t) {
        await ctx.reply('❌ Задача не найдена.')
        return
      }
      await ctx.reply(taskCard(t))
    } catch (err) {
      await ctx.reply(`❌ /task_view недоступен\nОшибка: ${err.message}`)
    }
  })

  // ===== E35 — Smart Alerts (/alerts) =====
  command('alerts', async (ctx) => {
    try {
      await logEvent({ userId: ctx.from.id, action: 'alerts_view', details: 'manual' })
      const analysis = await analyzeBusiness()
      await ctx.reply(formatAlerts(analysis).slice(0, 3800))
    } catch (err) {
      await ctx.reply(`❌ /alerts недоступен\nОшибка: ${err.message}`)
    }
  })
}
