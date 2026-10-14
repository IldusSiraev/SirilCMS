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

| Пакет | Содержимое tgz | Зависимость на contracts |
|---|---|---|
| `@sirilcms/contracts` | `dist/` (собирается `unbuild` при `pnpm install` через `prepare`) | — |
| `@sirilcms/web` | `src/` как **TypeScript-исходник** (Nuxt-модуль + runtime) | `workspace:*` → точная версия при pack |
| `@sirilcms/admin` | `src/` как TS-исходник (+ `src/migrations`, `bin/siril-migrations-sync`) | то же |

Исходники без компиляции — осознанное решение: проекты уже транспилируют их сами (`build.transpile` в Nuxt, ts-loader у Payload CLI). Компиляция `web`/`admin` — фаза D (публичный registry).

## 4. Scope и registry

Организация GitHub — `sirilcms`, пакеты — `@sirilcms/*`, registry — GitHub Packages (`npm.pkg.github.com`). GitHub Packages принимает только пакеты со scope = владелец репозитория, поэтому scope обязан совпадать с организацией (имя `@siril` на GitHub и npmjs занято, отсюда `sirilcms`). Публикация идёт на `GITHUB_TOKEN` workflow — отдельных секретов не нужно.

Если когда-нибудь понадобится npmjs.com (фаза D, публичный registry): создать организацию на npm, в репозитории задать variable `NPM_REGISTRY=https://registry.npmjs.org` и secret `NPM_TOKEN` — workflow уже это поддерживает. Scope при этом должен совпадать с npm-организацией.

## 5. Подключение пакетов в проекте

В корне проекта `.npmrc` (токен — `read:packages` PAT или `NODE_AUTH_TOKEN` в CI; в репозиторий токен не коммитить):

```ini
@sirilcms:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

Затем `pnpm add @sirilcms/contracts @sirilcms/web @sirilcms/admin` (одной версии) и обновление — [extension-api.md §5](../extension-api.md).

## 6. Что проверено, а что нет

- Проверено: логика релиза (`scripts/release-lib.mjs`, 16 unit-тестов), `release.mjs --dry-run`, `pnpm pack` всех трёх пакетов (состав tgz, `workspace:*` → точная версия, тесты исключены).
- **Не проверено**: фактическая публикация в registry и установка опубликованных пакетов в проект вне монорепо; первый пробный прогон — `workflow_dispatch` с `dry_run`.
