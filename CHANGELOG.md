# Changelog

Формат — [Keep a Changelog](https://keepachangelog.com/ru/1.0.0/), версии — теги `vX.Y.Z` (публикуются в GHCR через `.github/workflows/ci.yml`, см. [docs/roadmap.md](docs/roadmap.md)).

**Как вести этот файл:** любое изменение, которое требует от оператора ручного действия при обновлении (новая обязательная переменная в `.env`, ручной SQL, переименование volume/сервиса в compose, несовместимое изменение API) — помечать блоком `⚠ Breaking / ручные шаги` в записи версии, с конкретной командой или шагом, который нужно выполнить. Обычные фичи и фиксы — под `Added`/`Changed`/`Fixed`/`Security`. Процедура обновления сервера — [docs/runbooks/prod.md §4.1](docs/runbooks/prod.md).

## [Unreleased]

### Security
- Prod-compose: `PAYLOAD_URL` админки = `https://admin.${SITE_DOMAIN}` (раньше брался dev-дефолт из `.env` → save/publish за прокси мог молча падать на CSRF-проверке). Заходить в админку нужно по этому домену.
- **users: любой залогиненный пользователь мог менять любые записи `users`** (в т.ч. поставить себе `role: owner`). Теперь `update` — owner для всех, остальные только себя; поля `role`/`site` меняет только owner.
- Блокировка логина после 5 неудачных попыток на 10 минут (встроенный lockout Payload).
- `/api/purge`: constant-time сравнение токена, лимит 10 неудачных попыток/мин на IP (429).
- Prod: анонимная самрегистрация первого пользователя отключена (`DISABLE_FIRST_USER_SIGNUP=true`), первый owner создаётся из `INITIAL_OWNER_EMAIL`/`INITIAL_OWNER_PASSWORD`.

### Fixed
- Rich-text: relationship-embed (вставка связанного документа в текст) рендерился на публичном сайте буквальным текстом «unknown node». Фича убрана из редактора (`sirilEditor()` в `@siril/admin`, reference-admin его использует). Проверено вживую: upload-картинки, ссылки (`javascript:` → `#`), списки/чек-листы, quote, hr, форматирование, выравнивание и экранирование HTML рендерятся корректно.

### Added
- `@siril/contracts`: `registerExtensions({ blocks, themes })` / `resetExtensions()` — подключение блоков и тем проекта к активному реестру (`BLOCKS`/`THEMES`/`getBlock`/`getTheme`); `CORE_BLOCKS`/`CORE_THEMES` — неизменяемые core-списки. Core-темы по умолчанию включают новые блоки проекта.
- Отложенная публикация страниц и постов: в админке рядом с «Опубликовать» — планирование на дату/время. Исполняется очередью Payload jobs (`autoRun` раз в минуту в процессе admin), публикация чистит кэш сайта как обычная. Точность — до минуты.
- Оптимизация изображений при загрузке: оригинал ужимается до 2560px, генерируются WebP-размеры `sm` 480w / `md` 960w / `lg` 1600w (`sharp`). Блоки/посты берут размер по роли картинки (`mediaUrl(media, 'sm'|'md'|'lg')`); OG-изображения остаются оригиналом. Старые загрузки без размеров отдаются как раньше (фолбэк).
- `infra/scripts/restore-check.sh` / `make -C infra restore-check` — проверка восстановления дампа в одноразовом postgres.
- `scripts/check-payload-versions.mjs` (в `pnpm lint`): все `payload`/`@payloadcms/*` — одна точная версия.

### Changed
- `mergeBlockRegistry` теперь работает с массивами `BlockDef[]` (override по `type`); раньше принимал `Record` и ломался на массиве `BLOCKS`. `SirilModuleOptions.blocks` — `BlockDef[]`.
- `@payloadcms/*` и `payload` запинены на `3.90.1` (убрана вторая копия `@payloadcms/translations@3.90.2`).

### ⚠ Breaking / ручные шаги
- Миграция `scheduled_publish` добавляет таблицы `payload_jobs*` (применяется сервисом `migrate`). Проекты на `@siril/admin` должны включить `jobs.autoRun` в своём `payload.config.ts` (см. reference-admin), иначе запланированные публикации не исполнятся.
- Миграция `media_image_sizes` (только добавляет колонки) применяется автоматически сервисом `migrate`. Уже загруженные картинки размеров не получат — перезагрузите нужные файлы, если хотите оптимизацию для них.
- Существующим prod-установкам: если owner уже создан — ничего делать не нужно. Для новых установок `init-env.sh` принимает второй аргумент `<owner-email>`; без него впишите `INITIAL_OWNER_EMAIL`/`INITIAL_OWNER_PASSWORD` в `.env` вручную.

### Added
- Процедура обновления (бэкап → `IMAGE_TAG` → `pull`/`up`, откат при упавшей миграции) — [docs/runbooks/prod.md §4.1](docs/runbooks/prod.md).
- Платформа «движок + кастомизация» (spec [2026-09-27](docs/superpowers/specs/2026-09-27-siril-engine-platform-design.md)): `@siril/blocks-definitions` → `@siril/contracts` (SSOT: контракты блоков/тем/форм-полей, +unbuild dist); новые пакеты `@siril/web` (Nuxt-модуль: runtime UI `src/runtime/app` + темы + server middleware/кэш/purge-API) и `@siril/admin` (Payload-экстензия: `sirilAdminConfig`, collections/endpoints/access/admin-ui + канонические миграции); `apps/*` — тонкие референс-приложения `@siril/reference-web` (:3000, `nuxt build`) и `@siril/reference-admin` (:3001, `next build`).
- Merge-примитивы: `mergeBlockRegistry`, `mergeThemeRegistry` (`@siril/contracts`) — project-overlay блоков/тем (проект сильнее модуля).

### Changed
- Lockstep-версия пакетов: 0.1.0.
- Миграции Payload канонизированы в `packages/admin/src/migrations` — явным `postgresAdapter({ migrationDir })` в `apps/reference-admin/payload.config.ts` (дефолтный каталог Payload — относительный CWD, а это не workspace-root).

### ⚠ Breaking / ручные шаги
- Оператору действий не требуется: docker-образы пересобраны, one-shot-сервис `migrate` по-прежнему выполняет `pnpm --filter @siril/reference-admin migrate` по тем же `packages/admin/src/migrations`, схема БД в этом релизе не изменилась.

## [0.2.0] — 2026-09-26

### Changed
- Prod-compose (`infra/docker-compose.prod.yml`) переведён с `build:` на `image:` — `admin`/`web`/`migrate` тянутся готовыми из GHCR (`ghcr.io/ildussiraev/sirilcms-{admin,web,admin-migrate}`), версия — переменная `IMAGE_TAG` в `.env` (default `latest`). `make -C infra up` больше не собирает образы, только `--pull always`.
- Добавлен отдельный образ `admin-migrate` (стадия `build` того же `admin.Dockerfile`) — рантайм-образ `admin` собран как Next.js standalone и не содержит Payload CLI/миграций, поэтому сервис `migrate` использует отдельный, более тяжёлый образ.

### ⚠ Breaking / ручные шаги
- Существующим прод-серверам на сборке из исходников: сервер должен иметь сетевой доступ к `ghcr.io` (публичный registry, авторизация не нужна). Первый `make -C infra up` после обновления скачает три образа (`admin`, `web`, `admin-migrate`) — заметно дольше обычного рестарта.
- В `.env` можно (не обязательно) задать `IMAGE_TAG` — без него используется `latest`.

## [0.1.0] — 2026-09-26

Первый релиз.

### Added
- Конструктор страниц: 14 типов блоков (hero, текст+изображение, возможности, тарифы, галерея, FAQ, отзывы, команда, портфолио, CTA, контакты, список/сетка постов, форма) с вариантами компоновки, единый источник правды контрактов — `@siril/blocks-definitions`.
- Темы `default`/`mono`, переключение в админке без деплоя, fallback для неподдерживаемых блоков/вариантов.
- Конструктор форм (поля text…honeypot/consent), приём заявок с rate-limit, email/Telegram-уведомления, CSV-экспорт.
- Контент: страницы, блог (посты + категории), медиа-библиотека, SEO-поля, sitemap.xml/robots.txt.
- Роли `owner`/`editor` (editor ограничен своим сайтом), self-register первого пользователя всегда как `owner`.
- SSR-кэш публичных страниц (5 мин) с авто-purge при публикации.
- i18n админки (RU/EN).
- CI: lint, typecheck, test, проверка миграций (apply + drift), сборка, публикация образов в GHCR по тегу.
- Docker-деплой: `docker-compose.prod.yml`, Caddy (TLS), Makefile, скрипт бэкапа БД.

### Security
- Первый user в пустой БД принудительно получает роль `owner`, что бы ни пришло в запросе — закрывает гонку «кто первый зарегистрировался, тот и admin, но не обязательно owner».
- `pages`/`posts` read-доступ у `editor` ограничен по сайту пользователя, а не по данным документа (было — уязвимость, позволявшая читать чужой сайт при подмене поля).
- `smtpPass` шифруется at rest.
