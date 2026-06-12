// Обёртка над scripts/update-prices.mjs и чтением prices.json.
// Всё через execFile (массив аргументов, без shell) — защита от инъекций.

import { readFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { resolve } from 'node:path'
import { promisify } from 'node:util'
import { PROJECT_ROOT, config } from './config.mjs'
import { FUEL_KEYS } from '../scripts/lib/validate.mjs'

const execFileP = promisify(execFile)
const PRICES_PATH = resolve(PROJECT_ROOT, 'src', 'data', 'prices.json')

/** Текущее содержимое prices.json (для /status и preview). */
export async function readPrices() {
  const raw = await readFile(PRICES_PATH, 'utf8')
  return JSON.parse(raw)
}

/**
 * Запустить update-prices.mjs с провалидированными ценами для одной АЗС.
 * station — 'azs1' | 'azs2'; cleaned — { ai92:'59.90', ... }; source — строка.
 * Возвращает { ok, stdout, stderr }.
 */
export async function runUpdate(station, cleaned, source) {
  const args = [resolve(PROJECT_ROOT, 'scripts', 'update-prices.mjs'), '--station', station]
  for (const key of FUEL_KEYS) {
    if (key in cleaned) args.push(`--${key}`, cleaned[key])
  }
  if (source) args.push('--source', source)

  try {
    const { stdout, stderr } = await execFileP(process.execPath, args, {
      cwd: PROJECT_ROOT,
    })
    return { ok: true, stdout, stderr }
  } catch (err) {
    return { ok: false, stdout: err.stdout ?? '', stderr: err.stderr ?? String(err) }
  }
}

// На Windows npm — это npm.cmd; запуск .cmd через execFile требует shell:true
// (иначе Node бросает spawn EINVAL после фикса CVE-2024-27980).
const IS_WINDOWS = process.platform === 'win32'
const NPM_COMMAND = IS_WINDOWS ? 'npm.cmd' : 'npm'

/** Запустить npm run build. Возвращает { ok, stdout, stderr }. */
export async function runBuild() {
  try {
    // Windows: команда-строкой через shell (без массива args → нет DEP0190),
    // .cmd корректно резолвится. Прочие ОС: execFile без shell.
    // Команда фиксирована — shell-инъекция невозможна.
    const { stdout, stderr } = IS_WINDOWS
      ? await execFileP(`${NPM_COMMAND} run build`, { cwd: PROJECT_ROOT, shell: true })
      : await execFileP(NPM_COMMAND, ['run', 'build'], { cwd: PROJECT_ROOT })
    return { ok: true, stdout, stderr }
  } catch (err) {
    return { ok: false, stdout: err.stdout ?? '', stderr: err.stderr ?? String(err) }
  }
}

const PRICES_REL = 'src/data/prices.json'

/**
 * Универсальный коммит+пуш указанных файлов (E12+: новости/акции/контент).
 * НЕ трогает gitDeploy (ценовой поток). Коммитит ровно переданные пути.
 * { status:'ok' } | { status:'nochange' } | { status:'fail', step, message }.
 */
export async function gitCommitPush(files, message) {
  const opts = { cwd: PROJECT_ROOT }
  const list = (Array.isArray(files) ? files : [files]).filter(Boolean)
  if (!list.length) return { status: 'nochange' }
  try {
    const { stdout } = await execFileP('git', ['status', '--porcelain', '--', ...list], opts)
    if (!stdout.trim()) return { status: 'nochange' }
  } catch (err) {
    return { status: 'fail', step: 'status', message: err.message }
  }
  try {
    await execFileP('git', ['add', '--', ...list], opts)
    await execFileP('git', ['commit', '-m', message], opts)
  } catch (err) {
    return { status: 'fail', step: 'commit', message: err.message }
  }
  try {
    await execFileP('git', ['push', 'origin', 'main'], opts)
  } catch (err) {
    return { status: 'fail', step: 'push', message: err.message }
  }
  return { status: 'ok' }
}

/**
 * Закоммитить ТОЛЬКО prices.json и запушить в origin/main.
 * git — это git.exe (не .cmd), execFile работает без shell.
 * Возвращает { status, ... }:
 *   'aborted' — в рабочем дереве есть изменения кроме prices.json (others[])
 *   'nochange' — prices.json не изменён, коммитить нечего
 *   'fail'    — упал шаг git (step, message)
 *   'ok'      — закоммичено и запушено
 */
export async function gitDeploy() {
  const opts = { cwd: PROJECT_ROOT }

  // 1. Безопасность: в дереве должен меняться только prices.json.
  let statusOut
  try {
    const { stdout } = await execFileP('git', ['status', '--porcelain'], opts)
    statusOut = stdout
  } catch (err) {
    return { status: 'fail', step: 'status', message: err.message }
  }

  const entries = statusOut
    .split('\n')
    .filter(Boolean)
    .map((line) => ({ code: line.slice(0, 2), path: line.slice(3).replace(/^"|"$/g, '') }))

  const others = entries.filter((e) => e.path !== PRICES_REL).map((e) => e.path)
  if (others.length) return { status: 'aborted', others }

  const priceChanged = entries.some((e) => e.path === PRICES_REL)
  if (!priceChanged) return { status: 'nochange' }

  // 2. add → commit → push (только prices.json)
  try {
    await execFileP('git', ['add', '--', PRICES_REL], opts)
    await execFileP('git', ['commit', '-m', 'chore: update fuel prices'], opts)
  } catch (err) {
    return { status: 'fail', step: 'commit', message: err.message }
  }
  try {
    await execFileP('git', ['push', 'origin', 'main'], opts)
  } catch (err) {
    return { status: 'fail', step: 'push', message: err.message }
  }
  return { status: 'ok' }
}

/**
 * Вызвать Vercel Deploy Hook (POST). URL не возвращается и не логируется.
 * Возвращает { status: 'ok' | 'skipped' | 'fail', message? }:
 *   skipped — VERCEL_DEPLOY_HOOK_URL не задан.
 */
export async function runDeploy() {
  if (!config.deployHookUrl) return { status: 'skipped' }
  try {
    const res = await fetch(config.deployHookUrl, { method: 'POST' })
    if (!res.ok) return { status: 'fail', message: `${res.status} ${res.statusText}` }
    return { status: 'ok' }
  } catch (err) {
    // err.message не содержит сам URL — безопасно для чата.
    return { status: 'fail', message: err.message }
  }
}
