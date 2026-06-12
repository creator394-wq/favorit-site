// Общий валидатор цен топлива. Единый источник истины для
// scripts/update-prices.mjs и bot/* — логику не дублировать.

export const FUEL_KEYS = ['ai92', 'ai95', 'dt', 'gas']

// Целое или с 1–2 знаками после точки, напр. 59.90 / 68.5 / 31
export const PRICE_RE = /^\d+(\.\d{1,2})?$/

/** true, если значение — допустимая цена в формате 59.90. */
export function isValidPrice(value) {
  if (value === undefined || value === null) return false
  return PRICE_RE.test(String(value).trim())
}

/**
 * Проверяет набор цен { ai92, ai95, dt, gas } (любые подмножества).
 * Возвращает { ok, cleaned, errors }:
 *   cleaned — нормализованные (trim) значения по валидным ключам
 *   errors  — массив понятных сообщений об ошибках
 */
export function validateFuel(input) {
  const cleaned = {}
  const errors = []
  const provided = FUEL_KEYS.filter((k) => k in input)

  if (provided.length === 0) {
    errors.push('не передано ни одной цены (ai92 / ai95 / dt / gas)')
    return { ok: false, cleaned, errors }
  }

  for (const key of provided) {
    const raw = String(input[key]).trim()
    if (raw === '') {
      errors.push(`пустое значение для «${key}»`)
      continue
    }
    if (!PRICE_RE.test(raw)) {
      errors.push(`цена «${key}=${input[key]}» не является числом (ожидается формат 59.90)`)
      continue
    }
    cleaned[key] = raw
  }

  return { ok: errors.length === 0, cleaned, errors }
}
