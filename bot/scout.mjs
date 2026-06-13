// E26 — Scout Fleet Intelligence. READ-ONLY интеграция со СКАУТ Онлайн (GPS).
// Только GET-запросы: /onlinedata/getOnlineData и /getUnitOnlineData/{id}.
// Никаких изменений в СКАУТ. Токен — ТОЛЬКО из env SCOUT_API_TOKEN, он
// НИКОГДА не логируется, не выводится в Telegram и не попадает в URL.

const DEFAULT_BASE = 'https://api.scout-gps.ru/api'
const TIMEOUT_MS = 15000

/** Конфиг из окружения. Сам токен наружу не отдаём — только факт наличия. */
export function getScoutConfig() {
  return {
    base: process.env.SCOUT_API_BASE?.trim() || DEFAULT_BASE,
    hasToken: !!process.env.SCOUT_API_TOKEN?.trim(),
    offlineMinutes: Number(process.env.SCOUT_OFFLINE_MINUTES) || 120,
  }
}

export function isScoutConfigured() {
  return getScoutConfig().hasToken
}

/** Ссылка на Google Maps по координатам (или null). */
export function googleMapsLink(lat, lon) {
  if (lat == null || lon == null) return null
  return `https://maps.google.com/?q=${lat},${lon}`
}

// ---- форматирование дат СКАУТа ("2026-06-13T09:21:10", локальное время) ----
function fmtDateTime(s) {
  if (typeof s !== 'string' || s.length < 16) return s || '—'
  return `${s.slice(0, 10)} ${s.slice(11, 16)}`
}
function fmtTime(s) {
  if (typeof s !== 'string' || s.length < 16) return '—'
  return s.slice(11, 16)
}
function ageMinutes(s) {
  if (!s) return null
  const t = new Date(s).getTime()
  if (Number.isNaN(t)) return null
  return Math.floor((Date.now() - t) / 60000)
}

/**
 * Низкоуровневый запрос к Scout API. По умолчанию GET; для endpoint'ов,
 * требующих POST (getOnlineData → 405 на GET), передаётся { method:'POST', body }.
 * Возвращает распарсенный JSON. При ошибке бросает Error с диагностикой
 * (статус, метод, endpoint, короткий фрагмент ответа) — БЕЗ токена. Таймаут 15с.
 */
export async function fetchScoutJson(path, { method = 'GET', body } = {}) {
  const token = process.env.SCOUT_API_TOKEN?.trim()
  if (!token) throw new Error('SCOUT_API_TOKEN не задан')
  const base = process.env.SCOUT_API_BASE?.trim() || DEFAULT_BASE
  const url = base.replace(/\/+$/, '') + path
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS)
  try {
    // Accept-Language обязателен: без него СКАУТ берёт культуру "*" → 500.
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
    }
    const init = { method, headers, signal: ac.signal }
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json'
      init.body = typeof body === 'string' ? body : JSON.stringify(body)
    }
    const res = await fetch(url, init)
    if (!res.ok) {
      let snippet = ''
      try {
        snippet = (await res.text()).replace(/\s+/g, ' ').trim().slice(0, 200)
      } catch {
        /* тело ответа недоступно */
      }
      // Диагностика без токена: статус, метод, endpoint, фрагмент ответа.
      throw new Error(`Scout API ${res.status} [${method} ${path}]${snippet ? ` — ${snippet}` : ''}`)
    }
    return await res.json()
  } catch (err) {
    // err.message не содержит токен (он только в заголовке Authorization).
    throw new Error(err.name === 'AbortError' ? 'timeout (15s)' : err.message)
  } finally {
    clearTimeout(timer)
  }
}

/** Плоская нормализация записи {unit, onlineData}. */
function normalizeUnit(entry) {
  const u = entry?.unit ?? {}
  const o = entry?.onlineData ?? {}
  return {
    id: u.id ?? o.unitId ?? null,
    name: u.name ?? u.stateNumber ?? String(u.id ?? ''),
    stateNumber: u.stateNumber ?? u.name ?? '',
    description: u.description ?? '',
    brand: u.brand ?? '',
    terminalNumber: u.terminalNumber ?? '',
    terminalType: u.terminalType ?? '',
    status: o.status ?? null,
    parkingStatus: o.parkingStatus ?? null,
    date: o.date ?? null,
    satellites: o.satellitesNumber ?? null,
    speed: o.speed ?? null,
    fuelLevel: o.fuelLevel ?? null,
    isEngineWorking: o.isEngineWorking ?? null,
    driverName: o.driverName ?? '',
    latitude: o.latitude ?? null,
    longitude: o.longitude ?? null,
    angle: o.angle ?? null,
  }
}

/**
 * Тело POST-запроса getOnlineData. Настраивается через SCOUT_ONLINE_BODY_MODE:
 *   culture (по умолчанию) → { culture: <SCOUT_LOCALE> }
 *   locale                 → { locale:  <SCOUT_LOCALE> }
 *   empty                  → {}
 * SCOUT_LOCALE по умолчанию ru-RU (без него СКАУТ кидает CultureNotFoundException).
 */
function onlineBody() {
  const mode = (process.env.SCOUT_ONLINE_BODY_MODE?.trim() || 'culture').toLowerCase()
  const locale = process.env.SCOUT_LOCALE?.trim() || 'ru-RU'
  if (mode === 'empty') return {}
  if (mode === 'locale') return { locale }
  return { culture: locale }
}

/**
 * Весь парк. { total, units:[normalized] }.
 * getOnlineData требует POST (GET → 405) с локалью в теле (иначе 500). Метод
 * настраивается через SCOUT_ONLINE_METHOD (по умолчанию POST), тело — onlineBody().
 */
export async function getScoutFleet() {
  const method = (process.env.SCOUT_ONLINE_METHOD?.trim() || 'POST').toUpperCase()
  const init = method === 'POST' ? { method: 'POST', body: onlineBody() } : { method }
  const json = await fetchScoutJson('/onlinedata/getOnlineData', init)
  const data = Array.isArray(json?.data) ? json.data : []
  return { total: json?.totalQuantity ?? data.length, units: data.map(normalizeUnit) }
}

/** Одна машина по id (прямой endpoint). normalized | null. */
export async function getScoutUnit(unitId) {
  const json = await fetchScoutJson(`/onlinedata/getUnitOnlineData/${encodeURIComponent(unitId)}`)
  const entry = json?.data ?? json
  if (!entry || (!entry.unit && !entry.onlineData)) return null
  return normalizeUnit(entry)
}

/** Поиск по id / гос.номеру / части номера (по всему парку). normalized | null. */
export async function findScoutUnit(query) {
  const q = String(query ?? '').trim().toLowerCase()
  if (!q) return null
  const { units } = await getScoutFleet()
  return (
    units.find((u) => String(u.id) === q) ??
    units.find((u) => u.stateNumber.toLowerCase() === q || u.name.toLowerCase() === q) ??
    units.find(
      (u) => u.stateNumber.toLowerCase().includes(q) || u.name.toLowerCase().includes(q),
    ) ??
    null
  )
}

const engineLabel = (v) => (v === true ? 'работает' : v === false ? 'заглушен' : '—')
const engineShort = (v) => (v === true ? 'ON' : v === false ? 'OFF' : '—')
const fuelLabel = (v) => (typeof v === 'number' ? `${v} л` : '—')

/** /scout_status — сводка подключения. */
export async function formatFleetSummary() {
  const { total, units } = await getScoutFleet()
  const latest = units
    .map((u) => u.date)
    .filter(Boolean)
    .sort()
    .pop()
  return (
    '🟢 СКАУТ подключён\n\n' + `Машин: ${total}\n` + 'API: OK\n' + `Последнее обновление:\n${fmtDateTime(latest)}`
  )
}

/** Строка одной машины для /scout_fleet. */
function fleetLine(u) {
  return (
    `🚚 ${u.name}\n` +
    `Бренд: ${u.brand || '—'}\n` +
    `Двигатель: ${engineShort(u.isEngineWorking)}\n` +
    `Скорость: ${u.speed ?? '—'} км/ч\n` +
    `Топливо: ${fuelLabel(u.fuelLevel)}\n` +
    `Водитель: ${u.driverName || '—'}\n` +
    `Обновлено: ${fmtTime(u.date)}`
  )
}

/** /scout_fleet — весь парк. */
export async function formatFleet() {
  const { units } = await getScoutFleet()
  if (!units.length) return '🚚 Парк пуст или нет данных.'
  return units.map(fleetLine).join('\n\n')
}

/** Карточка одной машины (принимает normalized unit). */
export function formatTruckCard(u) {
  const coords = u.latitude != null && u.longitude != null ? `${u.latitude}, ${u.longitude}` : '—'
  return (
    `🚚 ${u.name}\n\n` +
    `ID: ${u.id}\n` +
    `Тип: ${u.description || '—'}\n` +
    `Бренд: ${u.brand || '—'}\n` +
    `Терминал: ${u.terminalType || '—'} / ${u.terminalNumber || '—'}\n\n` +
    'Статус:\n' +
    `Двигатель: ${engineLabel(u.isEngineWorking)}\n` +
    `Скорость: ${u.speed ?? '—'} км/ч\n` +
    `Спутники: ${u.satellites ?? '—'}\n` +
    `Водитель: ${u.driverName || '—'}\n\n` +
    `Топливо:\n${fuelLabel(u.fuelLevel)}\n\n` +
    `Координаты:\n${coords}\n\n` +
    `Карта:\n${googleMapsLink(u.latitude, u.longitude) ?? '—'}\n\n` +
    `Обновлено:\n${fmtDateTime(u.date)}`
  )
}

/** /scout_fuel — топливо по машинам + сумма по известным датчикам. */
export async function formatFuelReport() {
  const { units } = await getScoutFleet()
  const lines = units.map((u) => `${u.name}: ${fuelLabel(u.fuelLevel)}`)
  const known = units.filter((u) => typeof u.fuelLevel === 'number')
  const total = known.reduce((s, u) => s + u.fuelLevel, 0)
  let out = '⛽ Топливо\n\n' + lines.join('\n') + `\n\nИтого по известным датчикам:\n${total.toFixed(1)} л`
  if (known.length < units.length) out += `\n(датчиков с данными: ${known.length}/${units.length})`
  return out
}

/** /scout_offline — машины, давно не обновлявшиеся. */
export async function formatOfflineReport() {
  const { offlineMinutes } = getScoutConfig()
  const { units } = await getScoutFleet()
  const offline = units
    .map((u) => ({ u, age: ageMinutes(u.date) }))
    .filter((x) => x.age == null || x.age >= offlineMinutes)
    .sort((a, b) => (b.age ?? Infinity) - (a.age ?? Infinity))
  if (!offline.length) return `🟢 Все машины онлайн (порог ${offlineMinutes} мин).`
  return (
    `🔴 Offline (порог ${offlineMinutes} мин)\n\n` +
    offline
      .map(
        ({ u, age }) =>
          `🚚 ${u.name}\nОбновлено: ${fmtDateTime(u.date)}` +
          (age != null ? ` (${age} мин назад)` : ' (нет данных)'),
      )
      .join('\n\n')
  )
}

/**
 * Агрегаты парка для /dashboard и /report.
 * null — СКАУТ не настроен (без сети). Бросает при ошибке API (caller ловит).
 */
export async function getFleetStats() {
  if (!isScoutConfigured()) return null
  const { offlineMinutes } = getScoutConfig()
  const { total, units } = await getScoutFleet()
  let engineOn = 0
  let offline = 0
  let fuelKnown = 0
  const noFuel = []
  for (const u of units) {
    if (u.isEngineWorking === true) engineOn++
    const age = ageMinutes(u.date)
    if (age == null || age >= offlineMinutes) offline++
    if (typeof u.fuelLevel === 'number') fuelKnown++
    else noFuel.push(u.name)
  }
  return { total, count: units.length, engineOn, offline, fuelKnown, noFuel, offlineMinutes }
}
