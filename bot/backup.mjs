// E22.3/E22.5 — Backup & Restore: снимки данных в data/backups/<имя>/.
// Источник — src/data/. Папка data/ в .gitignore → не влияет на gitDeploy.
// Backup только КОПИРУЕТ из src/data (tracked-файлы не трогает). Restore пишет
// обратно в src/data и ПЕРЕД этим создаёт emergency backup. Без shell.

import { mkdir, readdir, stat, copyFile, access } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = resolve(__dirname, '..')
const SRC_DATA_DIR = resolve(PROJECT_ROOT, 'src', 'data')
export const BACKUP_DIR = resolve(PROJECT_ROOT, 'data', 'backups')

// Файлы, которые бэкапим/восстанавливаем (если существуют на диске).
export const BACKUP_FILES = [
  'prices.json',
  'news.json',
  'promos.json',
  'leads.json',
  'trucks.json',
  'maintenance.json',
]

const p2 = (n) => String(n).padStart(2, '0')
function dateStr(d = new Date()) {
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`
}
function timeStr(d = new Date()) {
  return `${p2(d.getHours())}${p2(d.getMinutes())}${p2(d.getSeconds())}`
}

async function exists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

function humanSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/**
 * Создать бэкап. По умолчанию имя папки = YYYY-MM-DD (снимок дня).
 * Возвращает { ok, name, count, bytes, sizeText, files } | { ok:false, error }.
 */
export async function createBackup(name) {
  try {
    const folder = name || dateStr()
    const dir = resolve(BACKUP_DIR, folder)
    await mkdir(dir, { recursive: true })
    let count = 0
    let bytes = 0
    const files = []
    for (const f of BACKUP_FILES) {
      const src = resolve(SRC_DATA_DIR, f)
      if (!(await exists(src))) continue
      const dest = resolve(dir, f)
      await copyFile(src, dest)
      bytes += (await stat(dest)).size
      count++
      files.push(f)
    }
    return { ok: true, name: folder, count, bytes, sizeText: humanSize(bytes), files }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

/** Emergency backup текущего состояния (уникальное имя со временем). */
export async function createEmergencyBackup() {
  return createBackup(`${dateStr()}_${timeStr()}-emergency`)
}

/** Список бэкапов (папок) с метаданными, новые сверху. */
export async function listBackups() {
  try {
    const entries = await readdir(BACKUP_DIR, { withFileTypes: true })
    const out = []
    for (const e of entries) {
      if (!e.isDirectory()) continue
      const dir = resolve(BACKUP_DIR, e.name)
      let count = 0
      let bytes = 0
      try {
        for (const f of (await readdir(dir)).filter((x) => x.endsWith('.json'))) {
          bytes += (await stat(resolve(dir, f))).size
          count++
        }
      } catch {
        /* битую папку просто пропускаем в подсчёте */
      }
      out.push({ name: e.name, count, bytes, sizeText: humanSize(bytes) })
    }
    // Имена начинаются с YYYY-MM-DD → лексикографическая сортировка = по дате.
    out.sort((a, b) => (a.name < b.name ? 1 : a.name > b.name ? -1 : 0))
    return out
  } catch {
    return []
  }
}

export async function backupCount() {
  return (await listBackups()).length
}

export async function lastBackup() {
  return (await listBackups())[0] ?? null
}

/**
 * E22.5 — Safe restore. Перед восстановлением создаётся emergency backup,
 * затем файлы копируются из бэкапа обратно в src/data/.
 * Имя сверяется со списком реальных бэкапов → защита от path traversal.
 * Возвращает { ok, name, restored, emergency } | { ok:false, error }.
 */
export async function restoreBackup(name) {
  try {
    const clean = String(name ?? '').trim()
    if (!clean) return { ok: false, error: 'Не указан бэкап.' }
    const match = (await listBackups()).find((b) => b.name === clean)
    if (!match) return { ok: false, error: `Бэкап «${clean}» не найден. Список: /backups` }

    const dir = resolve(BACKUP_DIR, match.name)
    // 1) сначала сохраняем текущее состояние
    const emergency = await createEmergencyBackup()
    // 2) затем восстанавливаем
    const restored = []
    await mkdir(SRC_DATA_DIR, { recursive: true })
    for (const f of BACKUP_FILES) {
      const src = resolve(dir, f)
      if (!(await exists(src))) continue
      await copyFile(src, resolve(SRC_DATA_DIR, f))
      restored.push(f)
    }
    return { ok: true, name: match.name, restored, emergency: emergency.ok ? emergency.name : null }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}
