# SirilCMS

Headless CMS для лендинг-сайтов: **конструктор страниц из блоков + темы + формы**. Контент-менеджер (не разработчик) собирает сайт в админке из готовых блоков, переключает темы и создаёт формы — без деплоев; публичный сайт — SSR с кэшированием.

## Возможности

- **Блоки** — 14 типов (hero, текст+изображение, возможности, тарифы, галерея, FAQ, отзывы, команда, портфолио, CTA, контакты, список/сетка постов, форма), каждый с вариантами компоновки. Единый источник правды контрактов — пакет `@siril/blocks-definitions` (SSOT): по контракту **автоматически** генерируются поля формы в админке (Payload) и резолвится вёрстка на сайте.
- **Темы** — `default` (teal) и `mono` (ч/б, serif). Переключение темы в админке (`Sites → theme`) — **изменение данных, применяется мгновенно**, без деплоя. Неподдерживаемые темой блоки/варианты рендерятся по fallback (контент не теряется).
- **Формы** — конструктор полей (text → honeypot/consent), заявки в БД, публичный submit с rate-limit, CSV-экспорт.
- **Контент** — страницы (любой лендинг = набор блоков), блог (посты + категории), медиа-библиотека, SEO-поля на каждое сущность.
- **Роли** — `owner` (владелец) и `editor` (клиент, ограничен своим сайтом).
- **Кэш/производительность** — SSR + HTML-кэш (5 мин), авто-purge при публикации (admin → web).
- **i18n админки** — RU/EN, язык по браузеру (`Accept-Language`), переключается в профиле пользователя.

## Архитектура

| Путь | Роль | Порт |
|---|---|---|
| `apps/web` | Публичный сайт: **Nuxt 4** (SSR, Nitro), кэш, purge-API | 3000 |
| `apps/admin` | Конструктор: **Payload 3** на **Next.js 16**, PostgreSQL | 3001 |
| `packages/blocks-definitions` | SSOT: контракты блоков/тем/форм-полей (типы, реестр, маппер в Payload, resolve) | — |
| `infra` | `docker-compose` (dev/prod), Caddy, сценарии (dev-pg, make-цели) | 80/443 (prod) |
| `docs` | Гайды: developer, runbooks (dev/prod), specs/plans | — |

Поток данных:

```
Админка (Payload UI) → Postgres → Nuxt (server $fetch к Payload REST, БЕЗ auth; только published)
    → BlockRenderer (blockType+variant → Vue SFC) → HTML (кэш 5 мин)
Публикация → afterChange-хук → POST web/api/purge (Bearer) → кэш чистится
```

Правила: публичные чтения без токенов; `editor` видит только свой site; draft-save кэш **не** чистит (только publish).

## Структура

```
apps/web/app/            # layout (nav/footer + CSS темы), страницы (index/[...slug]/blog/404)
apps/web/app/blocks/     # вёрстка блоков: <type>/<Variant>.vue (регистрация — glob, без реестра)
apps/web/themes/<id>/    # tokens.css темы (raw, внедряется в <head> через useHead)
apps/web/server/api|middleware|utils   # /api/page, /api/site, кэш, rate-limit, media
apps/admin/src/collections   # pages, posts, media, forms, form-submissions, sites, site-content, users, categories
apps/admin/src/migrations    # миграции Payload
apps/admin/app/{design,form-builder}   # custom-страницы админки (/design, /form-builder)
```

## Быстрый старт (dev)

Требования: Node 22+, pnpm, Docker (или внешний Postgres 16 на `127.0.0.1:5433`), свободные порты 3000/3001/5432.

```bash
pnpm install
Copy-Item .env.example .env            # PS (Linux/macOS: cp)
pnpm dev:pg                            # Postgres (docker :5432 или внешний :5433)
pnpm --filter @siril/admin migrate     # миграции
pnpm seed                              # демо-контент (идемпотентно)
pnpm dev:all                           # web :3000 + admin :3001
pnpm test                              # 62 теста
pnpm lint                              # ESLint
pnpm typecheck                         # tsc/nuxt typecheck
```

Вход в админку (по сиду): **`owner@demo.ru` / `admin123`** (публичная панель — `http://localhost:3001/admin`).

Подробности, типовые проблемы, прод-деплой и бэкапы — в документации:

- [docs/developer.md](docs/developer.md) — **руководство разработчика**: архитектура, администрирование, создание блоков, темы/вёрстка, грабли.
- [docs/runbooks/dev.md](docs/runbooks/dev.md), [docs/runbooks/prod.md](docs/runbooks/prod.md) — операционные ранбуки.
- [docs/superpowers/specs](docs/superpowers/specs) — дизайн-спека проекта.

## Кастомные страницы (custom-страницы админки)

- Конструктор форм: `/form-builder?form=<id>`
- Предпросмотр дизайна тем: `/design` (свотчи, переключение, Save → PATCH site)
- Экспорт заявок формы в CSV (авторизованный, `Authorization: Bearer <token>`):
  `GET /api/submissions-csv?form=<id>` → `submissions-<id>.csv` (BOM + UTF-8, CRLF)

## Деплой (Docker)

Prereq: `docker` с compose; в корне в `.env` заполнены `POSTGRES_PASSWORD`, `PAYLOAD_SECRET` (32+ символов), `SITE_DOMAIN`.

```sh
make -C infra up       # тянет образы из GHCR (IMAGE_TAG в .env, default latest), поднимает postgres, admin, web, caddy
make -C infra ps       # статус
make -C infra logs     # логи
make -C infra new-site # инструкция: новый сайт = новый сервер (мультисайт на одном сервере — см. docs/roadmap.md)
```

Бэкап БД: `cd infra && POSTGRES_DB_URI=postgresql://... make backup` → `infra/backups/*.sql.gz` (авто-очистка > 30 дней).

Локальное демо без домена: в `.env` — `SITE_DOMAIN=localhost` и `NUXT_PUBLIC_MEDIA_BASE=http://localhost:3001` (без реального `admin.*`-домена по умолчанию туда не достучаться); админка доступна на `http://localhost:3001` (порт пробрасывается `3001:3001` в compose). `NUXT_PUBLIC_MEDIA_BASE` — runtime-переменная (не build-arg), пересобирать `web` не нужно — только `make -C infra up` заново. С реальным доменом Caddy сам выпустит Let's Encrypt (80/443).
