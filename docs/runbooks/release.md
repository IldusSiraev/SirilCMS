# Runbook: релиз движка (`@sirilcms/*`)

Релиз = одна версия для `@sirilcms/contracts`, `@sirilcms/web`, `@sirilcms/admin` (lockstep) + git-тег `vX.Y.Z`. Тег запускает два независимых потока CI:
- `ci.yml` → образы GHCR (`sirilcms-{admin,web,admin-migrate}`) — для деплоя референса/продукта;
- `publish-packages.yml` → npm-пакеты `@sirilcms/*` — для проектов на движке ([extension-api.md](../extension-api.md)).

Пространство версий **общее**: тег `v0.3.0` — это и образы, и пакеты. Поэтому `release.mjs` не даст выпустить версию, не большую уже записанной в CHANGELOG (на момент написания последний релиз `0.2.0`, пакеты в репо — `0.1.0`: первый пакетный релиз делайте точной версией, например `0.3.0`).

## 1. Подготовка

1. В `CHANGELOG.md` секция `## [Unreleased]` описывает всё, что войдёт в релиз; ломающее и ручные шаги — в `### ⚠ Breaking / ручные шаги` (проекты читают это при обновлении).
2. `main` зелёный (CI), рабочее дерево чистое.
3. Обновите [compat.md](../compat.md), если изменились версии Payload/Next/Nuxt/Node.

## 2. Выпуск

```bash
node scripts/release.mjs 0.3.0 --dry-run   # показать, что изменится (ничего не пишет)
node scripts/release.mjs 0.3.0             # бамп версий, [Unreleased] → [0.3.0] — дата, коммит "release: v0.3.0", тег
git push origin main v0.3.0                # push тега запускает публикацию
```

Скрипт отказывается работать: не с `main`; при грязном дереве; если версия пакетов расходится (нарушен lockstep); если секция `[Unreleased]` пуста; если версия ≤ последней выпущенной; если тег уже есть. Он **не пушит** — push делаете вы.

Проверка публикации: вкладка Actions → «Publish packages» (шаг «Verify package contents» печатает состав каждого tgz); пакеты — Packages в репозитории.

Пробный прогон без публикации: Actions → «Publish packages» → Run workflow → `dry_run` (по умолчанию включён): собирает tgz и проверяет lockstep, не публикует.

## 3. Что публикуется

| Пакет | Содержимое tgz | Сборка |
|---|---|---|
| `@sirilcms/contracts` | `dist/` | `unbuild` |
| `@sirilcms/web` | `dist/` (Nuxt-модуль + runtime: `.vue`, `.js`, CSS тем) | `nuxt-module-build build` (`@nuxt/module-builder`) |
| `@sirilcms/admin` | `dist/` (JS + `.d.ts`, admin-ui, core-миграции `.js`/`.json`) + `bin/siril-migrations-sync` | `unbuild` (mkdist) |
| `@sirilcms/create-siril` | `bin/`, `src/`, `template/` (копия `templates/project`, кладётся `prepack`) | — (чистый JS) |

Все три пакета **компилируются** (`pnpm build:packages`; он же запускается в `prepare`/`postinstall` монорепо). Версия 0.5.0 вышла с исходниками TypeScript и для проекта вне монорепо **непригодна**: Payload CLI не загружает TS из `node_modules` (`ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`), Nitro не транспилирует серверные роуты модуля, а `@sirilcms/admin` импортировал типы по пути `apps/reference-admin/…`. Исправлено в 0.6.0.

`workspace:*` при `pnpm pack/publish` заменяется на точную версию `@sirilcms/contracts`.

## 4. Scope и registry

Организация GitHub — `sirilcms`, пакеты — `@sirilcms/*`, registry — GitHub Packages (`npm.pkg.github.com`). GitHub Packages принимает только пакеты со scope = владелец репозитория, поэтому scope обязан совпадать с организацией (имя `@siril` на GitHub и npmjs занято, отсюда `sirilcms`). Публикация идёт на `GITHUB_TOKEN` workflow — отдельных секретов не нужно.

Если когда-нибудь понадобится npmjs.com (фаза D, публичный registry): создать организацию на npm, в репозитории задать variable `NPM_REGISTRY=https://registry.npmjs.org` и secret `NPM_TOKEN` — workflow уже это поддерживает. Scope при этом должен совпадать с npm-организацией.

## 5. Подключение пакетов в проекте

Проще всего — создать проект генератором: `npx @sirilcms/create-siril <name>` (шаблон уже содержит нужные `.npmrc` и `pnpm-workspace.yaml`).

Вручную, в существующем проекте:

1. `.npmrc` в корне (**без токена**) — только registry для scope:
   ```ini
   @sirilcms:registry=https://npm.pkg.github.com
   ```
2. Токен (PAT с `read:packages`) — в **пользовательский** конфиг: `pnpm config set "//npm.pkg.github.com/:_authToken" <PAT>`. pnpm 11 игнорирует `${NODE_AUTH_TOKEN}` в project-level `.npmrc` (защита от утечки токена) — этот способ не работает. В CI токен даёт `actions/setup-node` (`registry-url` + `scope` + `NODE_AUTH_TOKEN`).
3. В `pnpm-workspace.yaml` проекта: `minimumReleaseAgeExclude: ["@sirilcms/*"]` (pnpm 11 не ставит пакеты младше minimumReleaseAge) и `allowBuilds: { esbuild: true, sharp: true }`.
4. `pnpm add @sirilcms/contracts @sirilcms/web @sirilcms/admin` (одной версии); обновление — [extension-api.md §5](../extension-api.md).

## 6. Что проверено, а что нет

- Проверено: логика релиза (`scripts/release-lib.mjs`, 16 unit-тестов), `release.mjs --dry-run`, `pnpm pack` всех трёх пакетов (состав tgz, `workspace:*` → точная версия, тесты исключены).
- **Не проверено**: фактическая публикация в registry и установка опубликованных пакетов в проект вне монорепо; первый пробный прогон — `workflow_dispatch` с `dry_run`.
