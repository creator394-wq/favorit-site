// E14 — Content Manager. Безопасное редактирование РЕАЛЬНОГО источника,
// который рендерит сайт: src/data/contacts.ts. Поддержаны точечные поля
// (телефон, email, whatsapp, telegram) с diff + подтверждением.
// Произвольные структурные правки («добавь раздел») намеренно не поддержаны.

import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CONTACTS_PATH = resolve(__dirname, '..', 'src', 'data', 'contacts.ts')
export const CONTACTS_REL = 'src/data/contacts.ts'

const FIELD_LABEL = {
  phoneDisplay: 'Телефон',
  phoneHref: 'Ссылка tel:',
  email: 'Email',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
}

function escapeForSingleQuoted(v) {
  return v.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

/** Разобрать NL-команду → массив изменений { field, value }. */
function parseIntent(text) {
  const t = text.trim()
  let m = t.match(/измени(?:те)?\s+телефон\s+на\s+(.+)/i)
  if (m) {
    const phone = m[1].trim()
    const digits = phone.replace(/[^\d]/g, '')
    return {
      ok: true,
      changes: [
        { field: 'phoneDisplay', value: phone },
        { field: 'phoneHref', value: 'tel:+' + digits.replace(/^\+?/, '') },
      ],
    }
  }
  m = t.match(/измени(?:те)?\s+(?:email|почту|емейл)\s+на\s+(\S+)/i)
  if (m) return { ok: true, changes: [{ field: 'email', value: m[1].trim() }] }
  m = t.match(/измени(?:те)?\s+(?:whatsapp|вотсап|ватсап)\s+на\s+(\S+)/i)
  if (m) return { ok: true, changes: [{ field: 'whatsapp', value: m[1].trim() }] }
  m = t.match(/измени(?:те)?\s+telegram\s+на\s+(\S+)/i)
  if (m) return { ok: true, changes: [{ field: 'telegram', value: m[1].trim() }] }
  if (/добав/i.test(t) && /раздел|секци|блок/i.test(t)) {
    return {
      ok: false,
      error:
        'Добавление новых разделов через /content не поддерживается (требует правки кода).',
    }
  }
  return {
    ok: false,
    error:
      'Не понял. Примеры:\n• измени телефон на +7 999 000-00-00\n• измени email на mail@example.ru\n• измени whatsapp на https://wa.me/79990000000',
  }
}

/**
 * Подготовить правку: parse → прочитать contacts.ts → собрать diff и новый
 * контент. { ok, preview, newContent } | { ok:false, error }.
 */
export async function prepareContentEdit(text) {
  const intent = parseIntent(text)
  if (!intent.ok) return intent

  let content
  try {
    content = await readFile(CONTACTS_PATH, 'utf8')
  } catch (err) {
    return { ok: false, error: `не удалось прочитать contacts.ts: ${err.message}` }
  }

  const previewLines = []
  let next = content
  for (const { field, value } of intent.changes) {
    const re = new RegExp(`(${field}:\\s*')([^']*)(')`)
    const cur = next.match(re)
    if (!cur) return { ok: false, error: `поле ${field} не найдено в contacts.ts` }
    const oldVal = cur[2]
    const safe = escapeForSingleQuoted(value)
    next = next.replace(re, `$1${safe}$3`)
    previewLines.push(`${FIELD_LABEL[field] ?? field}:\n${oldVal} → ${value}`)
  }

  if (next === content) return { ok: false, error: 'нет изменений' }
  return { ok: true, preview: previewLines.join('\n\n'), newContent: next }
}

export async function writeContacts(newContent) {
  await writeFile(CONTACTS_PATH, newContent, 'utf8')
}
