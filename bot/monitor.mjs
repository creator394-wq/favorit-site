// E6 — Site Monitoring helpers (health / screenshot / version).
// Не трогает логику цен, gitDeploy и deploy hook.

import { execFile } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
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
