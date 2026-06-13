// E28 — СКАУТ (read-only GPS): /scout_status, /scout_fleet (/fleet),
// /scout_truck, /scout_fuel, /scout_map, /scout_offline. Поведение идентично.
import {
  isScoutConfigured,
  findScoutUnit,
  formatFleetSummary,
  formatFleet,
  formatTruckCard,
  formatFuelReport,
  formatOfflineReport,
  googleMapsLink,
} from '../scout.mjs'
import { logEvent } from '../audit.mjs'
import { SCOUT_NOT_CONFIGURED } from './shared.mjs'

export function registerScoutHandlers(bot, deps) {
  const { command } = deps

  // --- /scout_status ---
  command('scout_status', async (ctx) => {
    try {
      await logEvent({ userId: ctx.from.id, action: 'scout_status_view', details: 'scout' })
      if (!isScoutConfigured()) {
        await ctx.reply(SCOUT_NOT_CONFIGURED)
        return
      }
      await ctx.reply(await formatFleetSummary())
    } catch (err) {
      await ctx.reply(`🔴 СКАУТ недоступен\nAPI: ${err.message}`)
    }
  })

  // --- /scout_fleet + /fleet (alias) ---
  async function scoutFleetHandler(ctx) {
    try {
      await logEvent({ userId: ctx.from.id, action: 'scout_fleet_view', details: 'fleet' })
      if (!isScoutConfigured()) {
        await ctx.reply(SCOUT_NOT_CONFIGURED)
        return
      }
      await ctx.reply('🚚 Автопарк (СКАУТ)\n\n' + (await formatFleet()).slice(0, 3800))
    } catch (err) {
      await ctx.reply(`❌ /scout_fleet недоступен\nОшибка: ${err.message}`)
    }
  }
  command('scout_fleet', scoutFleetHandler)
  command('fleet', scoutFleetHandler)

  // --- /scout_truck <id|номер|часть> ---
  command('scout_truck', async (ctx) => {
    try {
      const q = (ctx.match ?? '').trim()
      if (!q) {
        await ctx.reply('Формат: /scout_truck <id|номер|часть номера>')
        return
      }
      await logEvent({ userId: ctx.from.id, action: 'scout_truck_view', details: q })
      if (!isScoutConfigured()) {
        await ctx.reply(SCOUT_NOT_CONFIGURED)
        return
      }
      const u = await findScoutUnit(q)
      if (!u) {
        await ctx.reply(`Машина «${q}» не найдена.`)
        return
      }
      await ctx.reply(formatTruckCard(u))
    } catch (err) {
      await ctx.reply(`❌ /scout_truck недоступен\nОшибка: ${err.message}`)
    }
  })

  // --- /scout_fuel ---
  command('scout_fuel', async (ctx) => {
    try {
      await logEvent({ userId: ctx.from.id, action: 'scout_fuel_view', details: 'fuel' })
      if (!isScoutConfigured()) {
        await ctx.reply(SCOUT_NOT_CONFIGURED)
        return
      }
      await ctx.reply((await formatFuelReport()).slice(0, 3800))
    } catch (err) {
      await ctx.reply(`❌ /scout_fuel недоступен\nОшибка: ${err.message}`)
    }
  })

  // --- /scout_map <id|номер> ---
  command('scout_map', async (ctx) => {
    try {
      const q = (ctx.match ?? '').trim()
      if (!q) {
        await ctx.reply('Формат: /scout_map <id|номер>')
        return
      }
      if (!isScoutConfigured()) {
        await ctx.reply(SCOUT_NOT_CONFIGURED)
        return
      }
      const u = await findScoutUnit(q)
      if (!u) {
        await ctx.reply(`Машина «${q}» не найдена.`)
        return
      }
      const link = googleMapsLink(u.latitude, u.longitude)
      if (!link) {
        await ctx.reply(`📍 ${u.name}\nНет координат.`)
        return
      }
      await ctx.reply(`📍 ${u.name}\n${link}`)
    } catch (err) {
      await ctx.reply(`❌ /scout_map недоступен\nОшибка: ${err.message}`)
    }
  })

  // --- /scout_offline ---
  command('scout_offline', async (ctx) => {
    try {
      if (!isScoutConfigured()) {
        await ctx.reply(SCOUT_NOT_CONFIGURED)
        return
      }
      await ctx.reply((await formatOfflineReport()).slice(0, 3800))
    } catch (err) {
      await ctx.reply(`❌ /scout_offline недоступен\nОшибка: ${err.message}`)
    }
  })
}
