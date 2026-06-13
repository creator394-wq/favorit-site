// E41-B3 — Topaz Template Parser. Специализированное извлечение полей из УЖЕ
// полученного OCR-текста (rawText). НЕ делает OCR, НЕ трогает intake/lifecycle.
//
//   OCR (topazOcr.mjs) → rawText → ЭТОТ парсер → structuredReport
//
// Поля привязаны к меткам реального бланка Топаз («Итоговый отчёт за смену № …»,
// «Оператор смены: …», «Начало/Окончание смены: …», «Составлено: …»). Не найдено
// → null. Ничего не выдумываем, числа не интерпретируем (только собираем).

// Дата+время: «12.06.2026 8:02:04» (секунды опциональны).
const DT = String.raw`\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4}\s+\d{1,2}:\d{2}(?::\d{2})?`
// Только дата: «13.06.2026».
const D = String.raw`\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4}`

const pick = (text, re) => {
  const m = text.match(re)
  return m ? m[1].replace(/\s+/g, ' ').trim() : null
}

// Топливо: обнаружение наличия (без \b — он не работает с кириллицей).
const FUEL_PATTERNS = [
  ['ГАЗ', /(?:ГАЗ|СУГ|ПРОПАН)/i],
  ['АИ-92', /АИ[\s\-]?92|А[\s\-]?92/i],
  ['АИ-95', /АИ[\s\-]?95|А[\s\-]?95/i],
  ['ДТ', /(?:^|[^А-ЯЁа-яё])ДТ(?:[^А-ЯЁа-яё]|$)|ДИЗ\w*/i],
]

/**
 * Разобрать rawText отчёта Топаз в structuredReport. Любое не найденное поле → null.
 */
export function parseTopazReport(rawText) {
  const text = rawText || ''

  // Номер смены — строго из «… за смену № 1348» (НЕ из даты).
  const shiftNumber =
    pick(text, /за\s+смену\s*№?\s*(\d{2,6})/i) || pick(text, /смен[ауыеи]?\s*№\s*(\d{2,6})/i)

  // Оператор — «Оператор смены: Подшивалова М.В.» (слово «смены» — часть метки).
  const operator = pick(
    text,
    /[Оо]ператор(?:\s+смены)?\s*:?\s*([А-ЯЁ][а-яё]+(?:\s+[А-ЯЁ]\.?\s*[А-ЯЁ]?\.?)?)/,
  )

  // Между меткой и датой допускаем любой нецифровой мусор на той же строке
  // (двоеточие, тире «: —», лишние пробелы из OCR) — но НЕ переносы строк.
  const shiftStart = pick(text, new RegExp(String.raw`[Нн]ачал[оа]\s+смены[^\d\n]*(${DT})`))
  const shiftEnd = pick(text, new RegExp(String.raw`[Оо]кончани[ея]\s+смены[^\d\n]*(${DT})`))

  // Дата отчёта — из «Составлено: …», иначе дата начала смены.
  const composed = pick(text, new RegExp(String.raw`[Сс]оставлено[^\d\n]*(${D})`))
  const reportDate = composed || (shiftStart ? shiftStart.split(/\s+/)[0] : null)

  // АЗС — слово после «ФАВОРИТ».
  const station = pick(text, /ФАВОРИТ["»'`\s]*([А-ЯЁ][а-яё]+)/i)

  const detected = FUEL_PATTERNS.filter(([, re]) => re.test(text)).map(([name]) => name)

  // Числовые показатели — собираем без интерпретации (длина ≥3 или с запятой/точкой).
  const numbers = [
    ...new Set((text.match(/\d+(?:[.,]\d+)?/g) || []).filter((n) => n.length >= 3 || /[.,]/.test(n))),
  ].slice(0, 40)

  // Уверенность ПАРСЕРА — доля найденных ключевых полей (≠ OCR confidence).
  const core = [station, shiftNumber, operator, shiftStart, shiftEnd]
  const confidence = Math.round((core.filter(Boolean).length / core.length) * 100)

  return {
    station,
    shiftNumber,
    operator,
    shiftStart,
    shiftEnd,
    reportDate,
    fuel: { detected },
    sales: null, // расчётов на этом этапе нет
    totals: { numbers },
    confidence,
  }
}

const v = (x) => (x == null || x === '' ? '—' : x)

/** Блок «Структурированные данные» для Telegram. */
export function formatTopazStructured(s) {
  const fuel = s.fuel.detected.length ? s.fuel.detected.join(', ') : '—'
  const nums = s.totals.numbers.length ? s.totals.numbers.slice(0, 15).join(', ') : '—'
  return (
    'Структурированные данные\n\n' +
    `АЗС: ${v(s.station)}\n` +
    `Смена: ${v(s.shiftNumber)}\n` +
    `Оператор: ${v(s.operator)}\n` +
    `Начало: ${v(s.shiftStart)}\n` +
    `Окончание: ${v(s.shiftEnd)}\n\n` +
    `Топливо: ${fuel}\n\n` +
    `Найденные показатели:\n${nums}\n\n` +
    `Уверенность парсера: ${s.confidence}%`
  )
}
