# {{name}}

Сайт на движке [SirilCMS](https://github.com/sirilcms/SirilCMS): админка (Payload + Next, `admin/`) и публичный сайт (Nuxt, `web/`). Движок подключён пакетами `@sirilcms/*` версии `{{engineVersion}}` — его код в этот репозиторий не копируется.

## Первый запуск

1. **Доступ к пакетам** (GitHub Packages, нужен PAT с `read:packages`):
   ```bash
   pnpm config set "//npm.pkg.github.com/:_authToken" <PAT>
   ```
   (`.npmrc` в репозитории указывает только registry для scope `@sirilcms`; pnpm 11 не читает токен из project-level `.npmrc`.)
2. `pnpm install`
3. `cp .env.example .env`, при необходимости поправить значения (для разработки подходят как есть).
4. `pnpm dev:pg` — Postgres 16 в Docker (порт 5433).
5. `pnpm setup` — копирует миграции ядра, генерирует `importMap` и типы Payload.
6. `pnpm migrate` — применяет миграции.
7. `pnpm dev` — сайт `http://localhost:3000`, админка `http://localhost:3001/admin` (первый пользователь регистрируется сам и становится `owner`; в проде регистрация отключена — см. `.env.example`).

## Как расширять

Всё — в `siril.extensions.ts` (контракты блоков и тем), `web/app/blocks/**` (компоненты), `web/themes/**` (CSS тем), `admin/src/collections/**` (свои коллекции). Пошаговое руководство, правила и что стабильно — [docs/extension-api.md](https://github.com/sirilcms/SirilCMS/blob/main/docs/extension-api.md) движка.

Главные правила:
- Ядро не редактируется: файл `web/app/**` с тем же путём, что в модуле, **перекрывает** модульный, но копировать core-файл «ради правки» нельзя.
- Любое изменение блоков, тем или коллекций → `pnpm migrate:generate` → закоммитить миграцию (CI проверяет drift).
- `payload.config.ts`, `next.config.mjs`, `app/(payload)/**`, `scripts/ts-loader/**` — шаблонная обвязка, меняйте минимально.

## Обновление движка

```bash
pnpm up "@sirilcms/*" --latest      # одна версия для всех трёх пакетов
# прочитать CHANGELOG движка: раздел «⚠ Breaking / ручные шаги»
pnpm migrations:sync                # подтянуть новые core-миграции
pnpm migrate:generate               # только если ядро потребовало проектных правок схемы
pnpm typecheck && pnpm build
```

Деплой — по runbook движка (`docs/runbooks/prod.md`: бэкап → deploy → проверка → откат).

## Docker

`docker/admin.Dockerfile`, `docker/web.Dockerfile` (сборка с BuildKit-секретом `npm_token`, команды сборки — в шапке файлов). Образы **не прогонялись автоматически** — проверьте сборку при первом использовании.

Собранный web на рантайме читает `runtimeConfig` только из `NUXT_`-переменных: в окружении web-контейнера задайте `NUXT_PURGE_TOKEN` (= `PURGE_TOKEN` админки) и, если админка не на `http://admin:3001`, `NUXT_PAYLOAD_URL`. Голый `PURGE_TOKEN` web не видит — останется build-time `dev-purge-token`, purge при публикации получит 401 и обновления появятся только через 5 мин TTL кэша (подробнее — `docs/runbooks/prod.md` §2.3 движка).
