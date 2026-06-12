// Общий слой хранения JSON-данных в src/data/. Используется CRM, новостями,
// акциями, техникой, ТО, напоминаниями. Бот — обычный Node, Date/randomUUID ок.

import { readFile, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = resolve(__dirname, '..', 'src', 'data')

export function dataPath(file) {
  return resolve(DATA_DIR, file)
}
export function nowIso() {
  return new Date().toISOString()
}
export function shortId(id) {
  return String(id).slice(0, 8)
}

export async function readStore(file, fallback) {
  try {
    return JSON.parse(await readFile(dataPath(file), 'utf8'))
  } catch {
    return fallback
  }
}

export async function writeStore(file, data) {
  await writeFile(dataPath(file), JSON.stringify(data, null, 2) + '\n', 'utf8')
}

/**
 * Универсальная CRUD-коллекция поверх { updatedAt, [key]: [] }.
 * Каждый элемент получает id (uuid) и createdAt. Поиск — по точному id
 * или по префиксу (удобно вводить первые символы в Telegram).
 */
export function makeCollection(file, key = 'items') {
  const matches = (item, idOrPrefix) => item.id === idOrPrefix || item.id.startsWith(idOrPrefix)
  return {
    file,
    async all() {
      const d = await readStore(file, { updatedAt: '', [key]: [] })
      if (!Array.isArray(d[key])) d[key] = []
      return d
    },
    async list() {
      return (await this.all())[key]
    },
    async add(fields) {
      const d = await this.all()
      const rec = { id: randomUUID(), createdAt: nowIso(), ...fields }
      d[key].push(rec)
      d.updatedAt = nowIso()
      await writeStore(file, d)
      return rec
    },
    async find(idOrPrefix) {
      if (!idOrPrefix) return null
      return (await this.list()).find((i) => matches(i, idOrPrefix)) ?? null
    },
    async update(idOrPrefix, patch) {
      const d = await this.all()
      const it = d[key].find((i) => matches(i, idOrPrefix))
      if (!it) return null
      Object.assign(it, patch, { updatedAt: nowIso() })
      d.updatedAt = nowIso()
      await writeStore(file, d)
      return it
    },
    async remove(idOrPrefix) {
      const d = await this.all()
      const before = d[key].length
      d[key] = d[key].filter((i) => !matches(i, idOrPrefix))
      d.updatedAt = nowIso()
      await writeStore(file, d)
      return d[key].length < before
    },
  }
}
