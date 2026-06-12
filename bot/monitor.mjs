// E6 — Site Monitoring helpers (health / screenshot / version).
// Не трогает логику цен, gitDeploy и deploy hook.

import { execFile } from 'node:child_process'
import { mkdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { promisify } from 'node:util'
import { performance } from 'node:perf_hooks'

const execFileP = promisify(execFile)
const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = resolve(__dirname, '..')

export const SITE_URL = process.env.SITE_URL?.trim() || 'https://favorit-site.vercel.app'

/** ISO → "YYYY-MM-DD HH:MM" без зависимости от Date. */
export function formatTs(iso) {
  if (typeof iso !== 'string' || iso.length < 16) return iso ?? '—'
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)}`
}

/**
 * Проверка доступности сайта. Возвращает
 * { ok, status, ms, ssl } или { ok:false, error }.
 */
export async function checkHealth(url = SITE_URL) {
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), 15000)
  const start = performance.now()
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'follow', signal: ac.signal })
    const ms = Math.round(performance.now() - start)
    // Успешный ответ по https = TLS-рукопожатие прошло.
    return { ok: res.ok, status: res.status, ms, ssl: url.startsWith('https') ? 'OK' : 'NONE' }
  } catch (err) {
    return { ok: false, error: err.name === 'AbortError' ? 'timeout (15s)' : err.message }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Скриншот главной страницы через Playwright (chromium).
 * Возвращает { ok, path } или { ok:false, error }.
 */
export async function takeScreenshot(url = SITE_URL) {
  const dir = resolve(PROJECT_ROOT, '.monitor')
  const file = resolve(dir, 'home.png')
  let browser
  try {
    const { chromium } = await import('playwright')
    await mkdir(dir, { recursive: true })
    browser = await chromium.launch()
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
    await page.screenshot({ path: file, fullPage: false })
    return { ok: true, path: file }
  } catch (err) {
    return { ok: false, error: err.message }
  } finally {
    if (browser) await browser.close().catch(() => {})
  }
}

/** Текущая ветка и короткий хеш коммита. { commit, branch } | { error }. */
export async function gitVersion() {
  try {
    const opts = { cwd: PROJECT_ROOT }
    const { stdout: commit } = await execFileP('git', ['rev-parse', '--short', 'HEAD'], opts)
    const { stdout: branch } = await execFileP('git', ['rev-parse', '--abbrev-ref', 'HEAD'], opts)
    return { commit: commit.trim(), branch: branch.trim() }
  } catch (err) {
    return { error: err.message }
  }
}

/**
 * Состояние git: ветка, последний коммит, clean/dirty, список изменённых файлов.
 * git — git.exe, execFile без shell. { branch, lastCommit, clean, files } | { error }.
 */
export async function gitStatusInfo() {
  try {
    const opts = { cwd: PROJECT_ROOT }
    const { stdout: branch } = await execFileP('git', ['rev-parse', '--abbrev-ref', 'HEAD'], opts)
    const { stdout: last } = await execFileP('git', ['log', '-1', '--pretty=%h %s'], opts)
    const { stdout: status } = await execFileP('git', ['status', '--porcelain'], opts)
    const files = status
      .split('\n')
      .filter(Boolean)
      .map((l) => l.slice(3).replace(/^"|"$/g, ''))
    return { branch: branch.trim(), lastCommit: last.trim(), clean: files.length === 0, files }
  } catch (err) {
    return { error: err.message }
  }
}

/**
 * Последние строки локального лог-файла бота, если он есть.
 * Ищет в нескольких типовых путях. { ok:true, path, text } | { ok:false }.
 */
export async function readRecentLogs(maxLines = 30) {
  const candidates = [
    resolve(PROJECT_ROOT, 'bot', 'bot.log'),
    resolve(PROJECT_ROOT, '.monitor', 'bot.log'),
    resolve(PROJECT_ROOT, 'logs', 'bot.log'),
  ]
  for (const file of candidates) {
    try {
      const txt = await readFile(file, 'utf8')
      const lines = txt.split('\n').filter(Boolean)
      return { ok: true, path: file, text: lines.slice(-maxLines).join('\n') || '(пусто)' }
    } catch {
      // нет файла — пробуем следующий
    }
  }
  return { ok: false }
}
