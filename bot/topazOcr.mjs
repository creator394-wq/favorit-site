// E41-B — Topaz OCR & Report Extraction. Вся OCR-логика изолирована здесь.
// Движок: tesseract.js (Tesseract WASM, rus+eng) — локально/офлайн, без системного
// бинаря и без отправки фискальных отчётов третьей стороне. Скачивание фото —
// через Telegram Bot API во временную папку data/topaz_tmp/ (чистится после).
// Кэш языковых данных — data/.tesscache/ (оба под /data/ → gitignored).
//
// Извлечение полей — консервативное (regex по русским отчётам Топаз). Поле, которое
// не найдено → null. Ничего не выдумываем.

import { mkdir, writeFile, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, extname } from 'node:path'
import { createWorker } from 'tesseract.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = resolve(__dirname, '..', 'data')
const TMP_DIR = resolve(DATA_DIR, 'topaz_tmp')
const CACHE_DIR = resolve(DATA_DIR, '.tesscache')

// ===== Скачивание фото из Telegram =====
/** Скачать файл по file_id во временную папку, вернуть локальный путь. */
async function downloadTelegramFile(bot, fileId, index) {
  const f = await bot.api.getFile(fileId) // { file_path }
  const url = `https://api.telegram.org/file/bot${bot.token}/${f.file_path}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Telegram file download ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  const ext = extname(f.file_path) || '.jpg'
  const dest = resolve(TMP_DIR, `p${index}${ext}`)
  await writeFile(dest, buf)
  return dest
}

// ===== OCR (tesseract.js) =====
/** Распознать список изображений одним воркером. { rawText, confidence }. */
async function recognizeImages(paths) {
  // oem=1 (LSTM). cachePath — куда класть rus/eng .traineddata (скачиваются 1 раз).
  const worker = await createWorker('rus+eng', 1, { cachePath: CACHE_DIR })
  try {
    const texts = []
    const confs = []
    for (const p of paths) {
      const { data } = await worker.recognize(p)
      texts.push(data.text ?? '')
      if (typeof data.confidence === 'number') confs.push(data.confidence)
    }
    const rawText = texts.join('\n----- стр. -----\n').trim()
    const confidence = confs.length ? Math.round(confs.reduce((a, b) => a + b, 0) / confs.length) : 0
    return { rawText, confidence }
  } finally {
    await worker.terminate()
  }
}

// ===== Извлечение полей =====
const clean = (s) =>
  String(s ?? '')
    .replace(/\s+/g, ' ')
    .replace(/[•·|]+$/g, '')
    .trim()

const firstMatch = (text, re) => {
  const m = text.match(re)
  return m ? clean(m[1] ?? m[0]) : null
}

/** Нормализовать денежную/числовую строку («1 234,56» → «1234.56»). */
function normNumber(s) {
  if (s == null) return null
  const t = String(s).replace(/[^\d.,]/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.')
  return t || null
}

/**
 * Разобрать сырой OCR-текст в структуру. Любое не найденное поле → null.
 * fuel → массив найденных видов топлива (или null), numbers → числовые показатели.
 */
export function extractFields(rawText) {
  const text = rawText || ''
  const date = firstMatch(text, /\b(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4})\b/)
  const time = firstMatch(text, /\b(\d{1,2}:\d{2}(?::\d{2})?)\b/)
  // ВАЖНО: \w НЕ матчит кириллицу — после русских основ используем [а-яё]*.
  const shift = firstMatch(text, /смен[а-яё]*\s*[№#:\-]?\s*(\d{1,4})/i)
  const operator = firstMatch(text, /оператор[а-яё]*\s*[:\-№]?\s*([A-Za-zА-ЯЁа-яё][A-Za-zА-ЯЁа-яё.\- ]{1,40})/i)
  const cashbox = firstMatch(text, /касс[а-яё]*\s*[№#:\-]?\s*([^\n]{1,30})/i)

  const fuelSet = new Set(
    (text.match(/(АИ[\s\-]?9[0-9]|АИ[\s\-]?10[0-9]|ДТ|ДИЗ\w*|СУГ|ГАЗ|ПРОПАН|БЕНЗИН)/gi) || []).map((s) =>
      clean(s).toUpperCase().replace(/\s+/g, ''),
    ),
  )
  const fuel = fuelSet.size ? [...fuelSet] : null

  const totalRaw = firstMatch(text, /(?:итого|сумма|всего|выручк[а-яё]*)\D{0,20}(\d[\d  .,]*\d)/i)
  const total = normNumber(totalRaw)

  const numbers = [
    ...new Set(
      (text.match(/\d+(?:[.,]\d+)?/g) || []).filter((n) => n.length >= 3 || /[.,]/.test(n)),
    ),
  ].slice(0, 30)

  return { date, time, shift, operator, cashbox, fuel, total, numbers }
}

// ===== Оркестрация =====
/**
 * Полный OCR-проход по сессии: скачать фото → распознать → извлечь поля → удалить
 * временные файлы. Возвращает объект ocr { rawText, extracted, confidence, processedAt }.
 * НЕ пишет в хранилище — сохранение делает вызывающий (handlers/topaz).
 */
export async function ocrTopazSession(bot, session) {
  await mkdir(TMP_DIR, { recursive: true })
  const photos = session.photos ?? []
  const downloaded = []
  try {
    let i = 0
    for (const ph of photos) {
      if (!ph.fileId) continue
      downloaded.push(await downloadTelegramFile(bot, ph.fileId, i++))
    }
    if (!downloaded.length) throw new Error('в сессии нет фото для распознавания')
    const { rawText, confidence } = await recognizeImages(downloaded)
    const extracted = extractFields(rawText)
    return { rawText, extracted, confidence, processedAt: new Date().toISOString() }
  } finally {
    // Чистим временные файлы в любом случае.
    for (const p of downloaded) await rm(p, { force: true }).catch(() => {})
  }
}

// ===== Форматирование результата для Telegram =====
const val = (v) => (v == null || v === '' ? '—' : v)

/** 🧾 OCR Отчёт — сводка по сессии с ocr. */
export function formatOcrResult(session) {
  const ocr = session.ocr
  if (!ocr) return '🧾 OCR ещё не выполнялся для этой сессии.'
  const e = ocr.extracted ?? {}
  const fuelStr = e.fuel?.length ? e.fuel.join(', ') : '—'
  const preview = (ocr.rawText || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 8)
    .join('\n')
  return (
    '🧾 OCR Отчёт\n\n' +
    `Сессия: ${String(session.id).slice(0, 8)}\n` +
    `Фото: ${session.photoCount}\n\n` +
    `Дата: ${val(e.date)}\n` +
    `Время: ${val(e.time)}\n` +
    `Смена: ${val(e.shift)}\n` +
    `Оператор: ${val(e.operator)}\n` +
    `Касса: ${val(e.cashbox)}\n\n` +
    `Топливо: ${fuelStr}\n` +
    `Сумма: ${val(e.total)}\n` +
    `Числа: ${e.numbers?.length ? e.numbers.slice(0, 12).join(', ') : '—'}\n\n` +
    `Уверенность: ${ocr.confidence}%\n\n` +
    'Предпросмотр:\n' +
    (preview || '—')
  ).slice(0, 3800)
}
