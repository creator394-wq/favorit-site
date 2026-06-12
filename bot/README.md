# FAVORIT — Telegram Price Bot (E3 MVP)

Бот обновляет цены топлива на сайте через `scripts/update-prices.mjs`
с подтверждением. Деплой — вариант B: `npm run build` + Vercel Deploy Hook.
Бот **не** делает `git commit` и `git push`.

## Настройка

1. Получите токен у [@BotFather](https://t.me/BotFather).
2. Узнайте свой Telegram user id (напишите [@userinfobot](https://t.me/userinfobot)).
   `TELEGRAM_ADMIN_IDS` — список разрешённых id через запятую (allowlist).
   Все, кого нет в списке, игнорируются.
3. (Опц.) Создайте Vercel Deploy Hook: Project → Settings → Git → Deploy Hooks,
   скопируйте URL в `VERCEL_DEPLOY_HOOK_URL`.
4. Скопируйте `.env.example` → `.env` и заполните значения. `.env` не коммитится.

```
TELEGRAM_BOT_TOKEN=123456:ABC...
TELEGRAM_ADMIN_IDS=111111111,222222222
VERCEL_DEPLOY_HOOK_URL=https://api.vercel.com/v1/integrations/deploy/...
```

## Запуск

```bash
npm run bot
```

Бот стартует в режиме long polling. Без `TELEGRAM_BOT_TOKEN` или
`TELEGRAM_ADMIN_IDS` — завершается с понятной ошибкой.

## Команды

| Команда | Действие |
|---|---|
| `/start` | справка |
| `/status` | показать текущие цены (`prices.json`) |
| `/price ai92=59.90 ai95=64.90 dt=68.50 gas=31.50` | предпросмотр «было → станет» + кнопка подтверждения |
| `/publish` | подтверждение → вызов Vercel Deploy Hook |

После подтверждения `/price`: запускается `update-prices.mjs`, затем `npm run build`,
результат возвращается в чат. Публикация — отдельной командой `/publish`.

## Безопасность

- Токен берётся из `.env`, в логи/чат не выводится.
- Доступ только для `TELEGRAM_ADMIN_IDS`; остальные молча игнорируются.
- `update-prices.mjs` запускается через `execFile` (массив аргументов, без shell).
- Любая запись/деплой — только после inline-подтверждения.
- Цены валидируются общим модулем `scripts/lib/validate.mjs`.
