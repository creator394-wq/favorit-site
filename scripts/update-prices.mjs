#!/usr/bin/env node
// E2 — Local Price Update Script.
// Безопасно обновляет src/data/prices.json из командной строки,
// без правки React/UI-кода. Валидирует ввод и при любой ошибке
// НЕ трогает файл.
//
// Пример (E5 — per-station):
//   node scripts/update-prices.mjs --station azs1 --ai92 60.10 --ai95 65.10 --dt 69.10 --gas 32.10 --source manual

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { FUEL_KEYS as FUEL_FLAGS, PRICE_RE, STATION_KEYS } from './lib/validate.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PRICES_PATH = resolve(__dirname, '..', 'src', 'data', 'prices.json')

function fail(message) {
  console.error(`\n❌ Ошибка: ${message}`)
  console.error(
    '\nИспользование:\n' +
      '  node scripts/update-prices.mjs --station azs1 --ai92 60.10 --ai95 65.10 --dt 69.10 --gas 32.10 --source manual\n' +
      `\n--station обязателен (${STATION_KEYS.join(' | ')}). Цены — число (формат 59.90). Файл не изменён.`,
  )
  process.exit(1)
}

// --- разбор аргументов: --key value ---
function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i]
    if (!token.startsWith('--')) fail(`неожиданный аргумент «${token}»`)
    const key = token.slice(2)
    if (!key) fail('пустое имя флага «--»')
    const value = argv[i + 1]
    if (value === undefined || value.startsWith('--')) {
      fail(`у флага «--${key}» отсутствует значение`)
    }
    out[key] = value
    i++ // значение поглощено
  }
  return out
}

const args = parseArgs(process.argv.slice(2))

// --- проверка на неизвестные флаги ---
const allowed = new Set([...FUEL_FLAGS, 'source', 'station'])
for (const key of Object.keys(args)) {
  if (!allowed.has(key)) fail(`неизвестный флаг «--${key}»`)
}

// --- станция обязательна (старый формат без --station падает здесь) ---
if (!('station' in args)) {
  fail('не указан --station. Формат изменился (E5): требуется --station azs1|azs2')
}
const station = String(args.station).trim()
if (!STATION_KEYS.includes(station)) {
  fail(`неизвестная АЗС «--station ${args.station}» (допустимо: ${STATION_KEYS.join(' | ')})`)
}

// --- собираем и валидируем обновления цен ---
const providedFuel = FUEL_FLAGS.filter((f) => f in args)
if (providedFuel.length === 0) {
  fail('не передано ни одной цены (--ai92 / --ai95 / --dt / --gas)')
}

const fuelUpdates = {}
for (const f of providedFuel) {
  const raw = String(args[f]).trim()
  if (raw === '') fail(`пустое значение для «--${f}»`)
  if (!PRICE_RE.test(raw)) {
    fail(`цена «--${f} ${args[f]}» не является числом (ожидается формат 59.90)`)
  }
  fuelUpdates[f] = raw
}

// --- source (опционально) ---
let source
if ('source' in args) {
  source = String(args.source).trim()
  if (source === '') fail('пустое значение для «--source»')
}

// --- ISO 8601 с локальным смещением (текущее время) ---
function localIso(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  const offMin = -d.getTimezoneOffset()
  const sign = offMin >= 0 ? '+' : '-'
  const oh = pad(Math.floor(Math.abs(offMin) / 60))
  const om = pad(Math.abs(offMin) % 60)
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${sign}${oh}:${om}`
  )
}

// --- читаем текущий JSON ---
let data
try {
  data = JSON.parse(readFileSync(PRICES_PATH, 'utf8'))
} catch (err) {
  fail(`не удалось прочитать/разобрать ${PRICES_PATH}: ${err.message}`)
}
const stationBlock = data?.stations?.[station]
if (typeof stationBlock !== 'object' || stationBlock === null || typeof stationBlock.fuel !== 'object') {
  fail(`структура prices.json повреждена (нет stations.${station}.fuel)`)
}

// --- применяем изменения только к выбранной АЗС (в памяти) ---
for (const [f, value] of Object.entries(fuelUpdates)) {
  stationBlock.fuel[f] = value
}
// source и updatedAt — глобальные.
if (source !== undefined) data.source = source
data.updatedAt = localIso()

// --- сохраняем красиво ---
try {
  writeFileSync(PRICES_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8')
} catch (err) {
  fail(`не удалось записать ${PRICES_PATH}: ${err.message}`)
}

console.log(`✅ prices.json обновлён (${station}):`)
for (const f of providedFuel) console.log(`   ${f}: ${stationBlock.fuel[f]}`)
if (source !== undefined) console.log(`   source: ${data.source}`)
console.log(`   updatedAt: ${data.updatedAt}`)
