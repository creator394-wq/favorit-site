// E21 — Obsidian project memory: чтение/список docs и запись /session_log.
// Безопасно: пишет ТОЛЬКО внутрь docs/obsidian/, без shell. Папка в .gitignore,
// поэтому запись в CHANGELOG не влияет на ценовой gitDeploy. Токены не логируются.

import { readFile, readdir, mkdir, appendFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, basename } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = resolve(__dirname, '..')
export const OBSIDIAN_DIR = resolve(PROJECT_ROOT, 'docs', 'obsidian')

const CHANGELOG_FILE = 'FAVORIT_SITE_CHANGELOG.md'
const ROADMAP_FILE = 'FAVORIT_SITE_ROADMAP.md'

// Краткое описание известных документов (для /docs).
const DOC_DESCRIPTIONS = {
  'FAVORIT_SITE_MASTER.md': 'обзор проекта, стек, GitHub, Vercel, структура, архитектура бота',
  'FAVORIT_SITE_STATUS.md': 'что уже работает (цены, CRM, Lead API, мониторинг, деплой)',
  'FAVORIT_SITE_CHANGELOG.md': 'этапы E1–E21 + журнал сессий (/session_log)',
  'FAVORIT_SITE_OPERATIONS.md': 'как запустить сайт/бота, обновить цены, проверить, задеплоить',
  'FAVORIT_SITE_BOT_COMMANDS.md': 'полный справочник Telegram-команд',
  'FAVORIT_SITE_ROADMAP.md': 'планы E22–E25',
}

// "YYYY-MM-DD HH:mm" в локальном времени (бот — обычный Node, Date доступен).
function stamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

/** Список .md-файлов в docs/obsidian/ (имена). [] если папки нет. */
export async function listDocs() {
  try {
    const files = await readdir(OBSIDIAN_DIR)
    return files.filter((f) => f.toLowerCase().endsWith('.md')).sort()
  } catch {
    return []
  }
}

/** Текст справки /docs: где лежат доки, какие есть, что в них. */
export async function docsHelp() {
  const files = await listDocs()
  if (!files.length) {
    return 'Obsidian-доки не найдены (docs/obsidian/ пуст). Создайте файлы памяти проекта.'
  }
  const lines = files.map((f) => {
    const desc = DOC_DESCRIPTIONS[f]
    return desc ? `• ${f}\n  ${desc}` : `• ${f}`
  })
  return (
    '📚 Obsidian — проектная память FAVORIT SITE\n\n' +
    'Путь: docs/obsidian/\n\n' +
    'Файлы:\n' +
    lines.join('\n') +
    '\n\nКоманды: /roadmap · /session_log <текст>'
  )
}

/** Содержимое roadmap (markdown) или '' если файла нет. */
export async function readRoadmap() {
  try {
    return await readFile(resolve(OBSIDIAN_DIR, ROADMAP_FILE), 'utf8')
  } catch {
    return ''
  }
}

/**
 * Добавить запись в CHANGELOG в формате:
 *   ## YYYY-MM-DD HH:mm
 *   <текст>
 * Возвращает { ok, when } | { ok:false, error }.
 */
export async function appendSessionLog(text) {
  const clean = String(text ?? '').trim()
  if (!clean) return { ok: false, error: 'Пустой текст. Формат: /session_log <текст>' }
  const when = stamp()
  const entry = `\n## ${when}\n${clean}\n`
  try {
    await mkdir(OBSIDIAN_DIR, { recursive: true })
    await appendFile(resolve(OBSIDIAN_DIR, CHANGELOG_FILE), entry, 'utf8')
    return { ok: true, when, file: basename(CHANGELOG_FILE) }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}
