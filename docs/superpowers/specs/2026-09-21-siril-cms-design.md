# SirilCMS — дизайн «фабрики сайтов» v1

Дата: 2026-09-21
Статус: согласован с владельцем (итеративно)

## 1. Цель

Построить мини-CMS — «фабрику сайтов» — по которой владелец (разработчик/агентство) быстро делает сайты для клиентов по их HTML-шаблону, а клиент потом сам управляет контентом через веб-админку.

Поддерживаемые типы сайтов: лендинги, блоги, новостные, личные страницы, портфолио.

Ключевой критерий: **быстрая реализация сайта по HTML-шаблону клиента + переключение между шаблонами + управление контентом из админки**.

### Не цели (out of scope)

- e-commerce / каталоги товаров
- no-code drag-and-drop конструктор для клиентов
- мультисайт (N сайтов на одной платформе) — спланирован как v2, см. §11
- биллинг, self-service-регистрация клиентов

## 2. Зафиксированные решения

| # | Решение |
|---|---|
| 1 | Фронт: Nuxt 4 (SSR, Vue 3.x). Фолбэк: Nuxt 3.x — архитектура не меняется |
| 2 | Бэкенд/админка: Payload 3, self-hosted |
| 3 | БД: PostgreSQL; медиа: локальный volume, имена с префиксом `site/` |
| 4 | Деплой: свой VPS, Docker Compose; on-demand TLS (Caddy) |
| 5 | v1 = «фабрика»: 1 инстанс на клиента (Nuxt + Payload + PG), свой домен |
| 6 | Шаблоны: блоки + варианты; тема = код (компоненты + CSS-токены) + конфиг |
| 7 | Клиент правит контент сам, в веб-админке; drafts/publish — из коробки Payload |
| 8 | Site-aware модель данных с первого дня → дешёвая миграция в v2 |
| 9 | Пакетный менеджер: **pnpm** (workspaces: `nuxt`, `payload`, `blocks-definitions`, `infra`); strict hoisting, shared store |

## 3. Архитектура (v1)

```
client.com ─────► Caddy (on-demand TLS) ─► Nuxt 4 (SSR) ──REST──► Payload 3 ──► PostgreSQL
admin.client.com ─► Caddy ─────────────────────────────────────► Payload 3 (админка)
client.com/media ─► Caddy (static volume)
```

- **Один репозиторий-фабрика**: Nuxt-приложение (темы, блоки, API), Payload-приложение (коллекции, access control), общий TS-пакет `blocks-definitions`, инфраструктура (docker-compose + Caddyfile).
- **Клиент = инстанс**: копирование compose + `.env` (домен, админ-домен, SMTP, Telegram, secrets) → `docker compose up -d`.
- **Контент-кэш**: Nuxt кэширует страницы (ISR, swr). Webhook Payload (publish) → endpoint purge в Nuxt (авторизация токеном) → инвалидация кэша.
- **Точки расширения для v2** (спроектированы сейчас, реплицируются потом):
  - `useSite()` — composable в Nuxt: v1 читает env, v2 читает DB. Одна точка смены.
  - Все коллекции — с полем `site` (в v1 всегда одно значение `default`).
  - Имена медиа: `<site>/<path>` — из первого дня.

## 4. Модель данных (Payload)

| Коллекция | Контент |
|---|---|
| `site` (global, 1 запись) | name, slug, domain, locale, **theme** (id), contacts, socials, settings: smtp, telegram, analytics |
| `pages` | title, slug, locale, `sections` (Blocks, см. §5), seo: {title, description, ogImage, canonical, noindex} |
| `posts` | title, slug, locale, excerpt, body (rich-text), cover (media), categories, seo |
| `categories` | name, slug |
| `site-content` (global) | navigation (array: label, page (rel → `pages`), externalUrl, order — в админке: дропдаун по списку страниц, drag-реордер), footer (text, socials, contacts) |
| `forms` | name, slug, `fields` (Blocks — см. ниже), settings: successMessage, useHoneypot, useTurnstile |
| `form-submissions` | form (rel), data (JSON: поле→значение), ip, userAgent, createdAt. Read-only |
| `media` | встроенная Payload-коллекция, путь с префиксом `<site>/` |

Определения полей форм (в `forms.fields`, тип Blocks):
`{type: select(text|email|tel|textarea|checkbox|checkbox-group|select|date|file|consent), label, required, placeholder, options, rows}`.

## 5. Блоки и темы

**Блок** = Nuxt-компонент + вариант (variant) + данные (поля, специфичные для типа блока).

Стандартный набор (v1, 14 штук):
`hero` (3 варианта), `text-image` (2), `features`, `pricing`, `gallery`, `faq`, `testimonials`, `team`, `portfolio-grid`, `cta` (2), `contact`, `form-block`, `post-list`, `post-grid`.

**Тема (шаблон)** = `themes/<theme-id>/` в Nuxt-репозитории:
- `tokens.css` — CSS-переменные, вырезанные из CSS клиента (цвета, шрифты, отступы, радиусы)
- переопределения стандартных блоков, если дизайн отличается от дефолта
- запись в `blocks-definitions`: `{id, name, preview, blocks: {hero: {enabled, defaultVariant}, …}}`

**Переключение темы** = изменение `site.theme`. Чисто данные → мгновенно, без деплоя. Блоки/варианты, не поддержанные новой темой → авто-fallback на дефолтный вариант + предупреждение в админке.

**blocks-definitions** — общий TS-пакет: id блока, имя, schema полей (используется Payload для генерации UI редактора в админке) + список вариантов (Nuxt использует для выбора компонента). Единый источник правды.

### Конвейер «сайт клиента за 1–3 дня»

1. Получить HTML/CSS клиента.
2. Разрезать на секции → замаппить на стандартные блоки; уникальные секции → новые компоненты (1–2 ч/шт).
3. Вырезать CSS-токены → `tokens.css`.
4. Добавить тему в репозиторий → деплой Nuxt (один раз на тему).
5. Загрузить контент в Payload → сайт на домене.

## 6. Формы

- **Определение**: коллекция `forms` + кастомная React-панель «форм-билдер» в Payload (тип поля, label, required, options, порядок).
- **Рендер**: блок `form-block` {form: relationship} → Nuxt генерирует HTML по определениям; нативная валидация.
- **Приём**: `POST /api/forms/{slug}/submit` (Nuxt server route): honeypot → rate-limit (per-IP, in-memory) → optional Turnstile → валидация по definition → запись в `form-submissions`.
- **Уведомления**: email (SMTP из настроек сайта) + Telegram (телефон из настроек сайта).
- **Заявки**: список `form-submissions` в админке (фильтр по форме, экспорт CSV).

## 7. Админка и роли

- Payload-админка на отдельном домене (`admin.client.com`) или subpath — Caddy vhost.
- Роли:
  - `owner` (владелец, ты): всё, включая site-технические настройки (домен, SMTP, ключи), управление пользователями.
  - `editor` (клиент): страницы, посты, медиа, `site-content`, формы (включая билдер), **переключение темы**, заявки. Без site-технарядок.
- **Drafts**: клиент правит в draft → кнопка «Опубликовать» (Payload). История версий → restore.
- **Клиент создаёт страницы**: «Add» в списке pages → выбор блоков из палитры темы (фильтр по allowed-набору, §5) → контент → draft → publish. Slug — автогенерация из заголовка. Новые страницы автоматически попадают в sitemap (§8).
- **Редактор меню**: site-content → navigation — добавить/удалить/переместить; ссылка = выбор из списка существующих страниц (relationship, поиск) либо externalUrl.
- Кастомные панели: (1) form-builder, (2) страница «Дизайн» — переключатель тем с превью. (v2: реестр сайтов.)

## 8. SEO, кэш, i18n

- SEO-поля на страницу/пост; `sitemap.xml` (генерация: страницы + посты); `robots.txt` per site.
- ISR: кэш на странице, purge по webhook при publish.
- v1 i18n: один `locale` на сайт (`site.locale`). Мультиязычность = v2 (locale на страницу, тот же slug).

## 9. Инфраструктура и ops

Docker Compose (на инстанс):

| Сервис | Назначение |
|---|---|
| `caddy` | reverse proxy, on-demand TLS, static `/media` |
| `nuxt` | SSR |
| `payload` | админка + REST API |
| `postgres` | данные |

Volume'ы: `pgdata`, `media`.

- Новый клиент: compose + `.env` → up → контент. Целевое время — 15–30 мин.
- **Онбординг-чеклист для клиента** (до деплоя): A-запись домена на VPS → on-demand TLS подхватит сертификат автоматически.
- Бэкапы: cron, ежедневно `pg_dump` + tar медиа → S3/Borg. Процедура восстановления — задокументирована.
- Мониторинг: healthcheck-эндпоинты + uptime-чек; activity log Payload — для аудита правок.

## 10. Локальная разработка

Цель: `git clone → pnpm i → pnpm dev:all` — и разработчик работает; без локальных установок БД/сервисов.

**Основной цикл (watch):**
- **Docker — только Postgres** (`compose.dev.yml`). Nuxt и Payload — нативно на машине девелопера в watch-режиме: без контейнерного overhead, мгновенный HMR.
  - Nuxt: `localhost:3000` (SSR + API). Payload: `localhost:3001` (админка + REST `/api`). Nuxt SSR дёргает `http://localhost:3001/api`.
  - `pnpm dev:all` — одна команда: pg (docker) + nuxt + payload (concurrently).
- **blocks-definitions** — Nuxt и Payload импортируют **TS-исходник напрямую** (pnpm workspaces, симлинк-зависимость): нулевых build-шагов в цикле, изменение schema блока видна в обоих сразу.
- **Демо-сид**: `pnpm seed` — создаёт демо-сайты (3–4, с разными theme IDs), демо-страницы/посты/формы/заявки → блоки разрабатывают и переключение тем тестируют в готовой среде.
- **Уведомления в dev**: без SMTP/telegram → лог в консоль.

**Production-симуляция:** `docker compose up` (полный стек: Caddy + Nuxt + Payload + PG, localhost) — проверить on-demand TLS, purge-webhook, выдачу media до деплоя на нового клиента.

**Новый клиент (production)** — `make new-site DOMAIN=... THEME=...`: копирование compose + `.env`, up, сид. Целевое время 15–30 мин (§9 без изменений).

## 11. Граница v1/v2 (мульти)

v1 — фабрика: инстанс на клиента, всё вышеперечисленное.
v2 (по требованию, спроектировано заранее):
1. Реестр `sites` в БД + host→site resolution (меняем `useSite()`).
2. Объединение инстансов: миграция БД, backfill полей `site` (скрипт).
3. Access control: site-scoping по `user.site`.
4. Медиа: объединение в общее хранилище по префиксам.

Одноразовая операция ~1 неделя, контент не теряется.

## 12. Оценка MVP (1 разработчик)

| # | Блок | Оценка |
|---|---|---|
| 1 | Инфрафабрика: compose (prod+dev), Caddy, Payload+PG, Nuxt-каркас, env, demo-seed, `dev:all` | 4 дня |
| 2 | Модель данных + медиа + роли | 3–4 дня |
| 3 | blocks-definitions + 14 блоков + варианты | 2–3 недели |
| 4 | 2 реальные клиентские темы end-to-end | 3–5 дней |
| 5 | Формы: билдер + приём + заявки | ~1 неделя |
| 6 | Кастомные админ-панели: «Дизайн» (переключатель тем), form-builder | 4–6 дней |
| 7 | SEO, sitemap, ISR, purge | 3–4 дня |

**Итого: ~6–8 недель** (1 dev); с 2 dev — ~3.5–5 недель.

## 13. Риски и меры

| Риск | Мера |
|---|---|
| Нехватка времени на form-builder (React в Payload) | Старт сразу после ядра; fallback — простой CRUD без drag |
| Зрелость Nuxt 4 | Фолбэк на Nuxt 3.x, архитектура та же |
| On-demand TLS требует A-записи клиента заранее | Чеклист онбординга; старт с wildcard-демо-домена |
| Клиент «ломает» сайт | drafts + versioning (restore) + fallback вариантов |
| Риск расширения scope («давай ещё корзину») | Out of scope зафиксирован в §1 |
