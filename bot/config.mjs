// Конфигурация бота из переменных окружения (.env, через --env-file).
// Токен НИКОГДА не логируется и не выводится.

import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const PROJECT_ROOT = resolve(__dirname, '..')

const token = process.env.TELEGRAM_BOT_TOKEN?.trim()
if (!token) {
  console.error(
    '\n❌ Не задан TELEGRAM_BOT_TOKEN.\n' +
      '   Создайте .env (см. .env.example) и запустите: npm run bot\n',
  )
  process.exit(1)
}

// Allowlist админов: CSV из числовых Telegram user id.
const adminIds = (process.env.TELEGRAM_ADMIN_IDS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

if (adminIds.length === 0) {
  console.error(
    '\n❌ Не задан TELEGRAM_ADMIN_IDS (список разрешённых id через запятую).\n' +
      '   Без allowlist бот не запускается из соображений безопасности.\n',
  )
  process.exit(1)
}

export const config = {
  token, // не логировать
  adminIds: new Set(adminIds),
  deployHookUrl: process.env.VERCEL_DEPLOY_HOOK_URL?.trim() || '',
}

/** Проверка доступа: разрешён только пользователь из allowlist. */
export function isAdmin(userId) {
  return userId !== undefined && config.adminIds.has(String(userId))
}
