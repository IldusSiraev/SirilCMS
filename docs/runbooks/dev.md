# Ранбук — запуск в разработке (dev)

Локальный dev: веб (Nuxt, :3000) + админка (Payload/Next, :3001) + PostgreSQL.

## Требования

- Node.js 22+
- pnpm (`npm i -g pnpm` или corepack)
- Docker Desktop **или** любой Postgres 16+, доступный на `127.0.0.1:5433`
- Свободные порты: 3000, 3001 (и 5432 — если поднимать pg через Docker)

## 1. Установка

```bash
pnpm install
cp .env.example .env   # Windows (PS): Copy-Item .env.example .env
```

`.env` (dev-блок — строки 1–7):

| Ключ | По умолчанию | Комментарий |
|---|---|---|
| `PAYLOAD_SECRET` | change-me-32-chars-min | в dev можно дефолт; **мин. 32 символа** |
| `PAYLOAD_DB_URI` | postgresql://payload:dev@localhost:5432/payload | **совпадает с вашим pg** (см. ниже) |
| `PAYLOAD_URL` | http://localhost:3001 | адрес админки для веб |
| `NUXT_PUBLIC_SITE_DOMAIN` | localhost:3000 | base для canonical/sitemap (dev) |
| `PURGE_TOKEN` | dev-purge-token | для `/api/purge` |

Windows-особенность: `pnpm` может не быть в PATH — `& "$env:APPDATA\npm\pnpm.cmd" dev:all`.

## 2. БД

```bash
pnpm dev:pg
```

Два режима (скрипт `infra/scripts/dev-pg.mjs`):
- **docker в PATH** → поднимает `infra/compose.dev.yml`: postgres:16 на `:5432`, логин/пароль `payload`/`dev` → `PAYLOAD_DB_URI` из `.env` подходит.
- **docker не доступен** → ждёт уже запущенный Postgres на `127.0.0.1:5433`. Если pg другой — поправьте `PAYLOAD_DB_URI` (хост/порт/креды).

Проверка:

```bash
docker compose -f infra/compose.dev.yml ps    # режим with-docker
# или
Test-NetConnection 127.0.0.1 -Port 5433 -InformationLevel Quiet   # режим без docker
```

Остановка pg: `docker compose -f infra/compose.dev.yml down`.

## 3. Миграции + сид (первый раз)

```bash
pnpm --filter @siril/admin migrate   # применить все migration-файлы к БД
pnpm seed                            # демонстрационный контент (идемпотентно: skip, если sites > 0)
```

> Повторно `migrate`/`seed` не нужны — seed сам пропускается, a migrate — no-op, если схема свежая.

## 4. Запуск

```bash
pnpm dev:all
```

Вывод: pg (если нужно) + два процесс-окна: **web** `http://localhost:3000`, **admin** `http://localhost:3001`.

## 5. Проверка (smoke)

```bash
curl http://localhost:3000/api/health      # → 200
curl http://localhost:3000/                # → демо-страница (HTML)
curl http://localhost:3000/sitemap.xml     # → URLs страниц/постов
curl http://localhost:3001                 # → Payload admin
```

Вход в админку (по сиду): **owner@demo.ru / admin123** (есть и editor@demo.ru).

## 6. Тесты

```bash
pnpm test          # 61 тест: blocks 16 / admin 24 / web 21
pnpm lint          # ESLint на весь монорепо
```

## 7. Типовые проблемы

| Симптом | Причина / решение |
|---|---|
| `EADDRINUSE :5432` при `dev:pg` | Порт занят другим проектом → используйте внешний pg на 5433 (режим без docker) и поправьте `PAYLOAD_DB_URI` |
| Admin: `Cannot find payload config` / connect-refused | `PAYLOAD_DB_URI` не совпадает с фактическим pg; проверить `PAYLOAD_SECRET` (32+ chars) |
| `pnpm` не найден (Windows) | `& "$env:APPDATA\npm\pnpm.cmd" …` |
| Web: `PAYLOAD_URL` не отвечает | Admin не запущен/не на 3001; `ps`/`netstat` по портам |
| Сайт открывает пустой (no pages) | БД чистая — выполните `migrate` + `seed` |
| Drafts не видны на публичном | В dev публичный API показывает drafted-страницы (agreed access model); в проде — только published (server-side filter) |
