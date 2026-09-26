# Changelog

Формат — [Keep a Changelog](https://keepachangelog.com/ru/1.0.0/), версии — теги `vX.Y.Z` (публикуются в GHCR через `.github/workflows/ci.yml`, см. [docs/roadmap.md](docs/roadmap.md)).

**Как вести этот файл:** любое изменение, которое требует от оператора ручного действия при обновлении (новая обязательная переменная в `.env`, ручной SQL, переименование volume/сервиса в compose, несовместимое изменение API) — помечать блоком `⚠ Breaking / ручные шаги` в записи версии, с конкретной командой или шагом, который нужно выполнить. Обычные фичи и фиксы — под `Added`/`Changed`/`Fixed`/`Security`. Процедура обновления сервера — [docs/runbooks/prod.md §4.1](docs/runbooks/prod.md).

## [Unreleased]

### Added
- Процедура обновления (бэкап → `IMAGE_TAG` → `pull`/`up`, откат при упавшей миграции) — [docs/runbooks/prod.md §4.1](docs/runbooks/prod.md).

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
