# Engine Platform S0→A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Превратить SirilCMS в движок-библиотеку: спайки (S0), затем выворот ядерного кода в npm-пакеты `@siril/contracts`, `@siril/web`, `@siril/admin`, а текущие `apps/*` — в тонкие референс-приложения на пакетах.

**Architecture:** Подход A из спеки — ядро = пакетные `@siril/*` (workspace-ссылки в dev), проект = тонкое приложение. Core закрыт, расширение аддитивное. `@siril/web` — Nuxt-модуль (runtime слои/шаблоны), `@siril/admin` — Payload-экстензия (`sirilAdminConfig`), `@siril/contracts` — чистая логика (SSOT-контракты + merge-примитивы) с `unbuild`-dist. Неопределённости Nuxt-layer/механизма миграций/admin-components снимаются спайками S0; спайки пишут decision-доки, фазы A следуют им.

**Tech Stack:** pnpm 11 workspaces, Node 22, Nuxt 4 (Nitro), Payload 3.90 (`@payloadcms/next` 3.90.1, `@payloadcms/db-postgres`, Postgres 16), Next.js 16, TypeScript, unbuild, Vitest, Playwright, ESLint 9 flat.

**Spec:** `docs/superpowers/specs/2026-09-27-siril-engine-platform-design.md` (фазы S0/A — §9; решения — §2; API — §4; миграции — §5; overlay — §6). Фазы B/C/D — отдельные планы.

## Global Constraints

- **Ядро закрыто, расширение аддитивное** (spec §2.2): проект не редактирует core; core может менять свои коллекции/блоки только с миграциями и deprecate-процессом (developer.md §4 шаг 6).
- **Lockstep-версионирование** (spec §2.4): все пакеты `@siril/{contracts,web,admin}` после фазы A — `0.1.0`; breaking в minor'ах, CHANGELOG явный (Keep-a-Changelog).
- **Не копировать core-файлы в проект** (spec §6): только override (полная замена файла) или новый путь.
- **Демо-контент — не в ядре** (spec §2.7, §3): `seed.ts`, демо-темы/контент живут в референсе (`apps/*`), пакеты — только движок.
- **DX не меняется** (spec §3, §11): `pnpm dev:all` работает как сейчас; пакеты — workspace-ссылки; TS-исходник в dev + `build.transpile` (как сейчас); пакеты `@siril/admin` и `@siril/web` ship как TS-исходник + consumer-transpile (см. заметку-отклонение в Task 9), `@siril/contracts` — dist via unbuild.
- **Out of scope** (spec §1): автоимпорт HTML→токены, S3, live-preview, multitenancy, публичный semver-контракт (фаза D).
- **Acceptance фазы A** (spec §9): все юнит-тесты + Playwright e2e зелёные на том же потоке; `pnpm dev:all` без изменений; drift-check CI зелёный.
- **Коммиты:** маленький коммит после каждого завершённого шага-цикла; дерево не остаётся в сломанном состоянии на коммите (lint+test зелёные).
- Windows-окружение: pnpm через `& "$env:APPDATA\npm\pnpm.cmd"` если нет в PATH.

## File Structure (до → после)

```
packages/
  blocks-definitions/            → contracts/            @siril/contracts (rename + unbuild + merge.ts)
  web/                            (NOVYI)                @siril/web — Nuxt-модуль
    src/module.ts                                  — defineNuxtModule (механизм из С0.1)
    src/runtime/app/{components,blocks,layouts,pages,composables,utils}/…  — из apps/web/app
    src/runtime/server/**                                        — из apps/web/server
    src/runtime/themes/{default,mono}/tokens.css          — из apps/web/themes
  admin/                           (NOVYI)                @siril/admin — Payload-экстензия
    src/{collections,access,utils,endpoints,admin-ui,migrations}/… — из apps/admin/src
    src/index.ts                                   — sirilAdminConfig + экспорт helpers
apps/web                           → референс: app.vue, error.vue, nuxt.config, themes? НЕТ (v пакете), .env
                                     name: @siril/reference-web
apps/admin                         → референс: payload.config.ts (тонкий), app/ (Next), src/scripts/seed.ts,
                                     src/migrations/ (пустый каталог проекта)
                                     name: @siril/reference-admin
e2e, .github/workflows/ci.yml      → те же файлы, фильтры pnpm --filter — обновить на новые имена
```

**Заметка-отклонение от спеки (§3, осознанное):** `@siril/admin` и `@siril/web` в фазе A ship как TS-исходник с consumer-transpile (workspace), а не как скомпилированный dist. Обоснование: Payload CLI у референса/шаблонов уже работает через `ts-loader` (`--disable-transpile`), это текущий DX; компиляция admin-пакета (tsx, миграции, manifest) — в фазу B (там же lockstep-релиз-скрипт). `@siril/contracts` — dist (чистая логика, unbuild тривиален).

---

## Фаза S0 — Spikes

Все три спайка выполняются в отдельном git-worktree (skill: superpowers:using-git-worktrees), чтобы main не видела промежуточного состояния. Deliverable каждого спайка — **decision-док** в репозитории + (где уместно) зафиксированный код-образец, который фазы A копирует.

### Task 1: Spike S0.1 — Nuxt 4 overlay (app > module): слой модуля + шаблоны

**Files:**
- Create (scratch, вне репо): `C:\Users\iisiraev\AppData\Local\Temp\opencode\siril-s01\` — scratch-модуль + scratch-приложение
- Create: `docs/superpowers/spikes/2026-09-27-s0-1-nuxt-overlay.md` (commit-ится в worktree)
- Test: само scratch-приложение (curl-проверки)

**Interfaces:**
- Produces: (1) точный способ регистрации app-директории Нuxt-модулем (candidate: `nuxt.options._layers.push(...)`; fallback из спеки §11: alias/отдельные страницы), (2) подтверждённый приём dual-glob тем (абсолютные пути во generated-шаблоне), (3) код-образец `module.ts`, который Task 9 копирует.

- [ ] **Step 1: Создать worktree**

```bash
git worktree add .worktrees/s0 -b spike/s0
```

(Все команды спайков — в каталоге worktree `C:\Projects\SANDBOX\SirilCMS\.worktrees\s0` или в scratch-каталоге; коммиты доков — в worktree.)

- [ ] **Step 2: Скрач-модуль**

`C:\Users\iisiraev\AppData\Local\Temp\opencode\siril-s01\mod\package.json`:

```json
{ "name": "mod", "version": "0.0.0", "type": "module", "main": "src/module.ts" }
```

Создать пустую `src/` (module.ts — След 3).

- [ ] **Step 3: Кандидатный `module.ts`** (основной кандидат — push слоя; если не сработает — зафиксировать fallback)

`C:\Users\iisiraev\AppData\Local\Temp\opencode\siril-s01\mod\src\module.ts`:

```ts
import { fileURLToPath } from 'node:url'
import { addTemplate, defineNuxtModule } from '@nuxt/kit'

export default defineNuxtModule({
  meta: { name: 'mod', configKey: 'mod' },
  setup(options, nuxt) {
    const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))
    nuxt.options._layers.push({ srcDir: runtimeDir, package: 'mod' })
    addTemplate({
      filename: 'mod-probe.gen.mjs',
      getContents: () =>
        "export const probe = import.meta.glob('PROBE_THEMES_DIR/*/tokens.css', { query: '?raw', import: 'default' })\n",
    })
  },
})
```

(`PROBE_THEMES_DIR` подставим абсолютным путём в run-time-версии; в скраче просто проверяем, что шаблон генерируется.)

- [ ] **Step 4: Кандидатный runtime-контент модуля** (чтобы проверять overlay)

```
mod/src/runtime/
  app/pages/mod-test.vue      <template><div>module-page</div></template>
  app/components/ModBadge.vue <template><span>module-badge</span></template>
  app/layouts/mod.vue         <template><div class="mod-layout"><slot /></div></template>
  server/api/mod.get.ts       export default eventHandler(() => ({ src: 'module' }))
  themes/default/tokens.css   :root{--probe:module}
```

- [ ] **Step 5: Скрач-приложение**

`C:\Users\iisiraev\AppData\Local\Temp\opencode\siril-s01\app\` со своим `package.json`:

```json
{ "name": "probe-app", "private": true, "type": "module",
  "dependencies": { "mod": "file:../mod", "nuxt": "^4.5.2", "vue": "^3.5.43" },
  "scripts": { "dev": "nuxt dev --port 3456", "build": "nuxt build" } }
```

`nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: ['mod'],
  mod: {},
})
```

Оверлей-файлы приложения:

```
app/app.vue                    <template><NuxtLayout><NuxtPage /></NuxtLayout></template>
app/pages/mod-test.vue         <template><div>app-page</div></template>
app/components/AppBadge.vue    <template><span>app-badge</span></template>
app/server/api/mod.get.ts      export default eventHandler(() => ({ src: 'app' }))
app/themes/default/tokens.css  :root{--probe:app}
```

- [ ] **Step 6: Запуск и проверки**

```bash
cd C:\Users\iisiraev\AppData\Local\Temp\opencode\siril-s01\app
& "$env:APPDATA\npm\pnpm.cmd" install
& "$env:APPDATA\npm\pnpm.cmd" dev
```

Отдельной сессией (curl'ом) проверить:

1. `curl -s http://localhost:3456/mod-test` → содержит **`app-page`** (oверлей app>module по страницам).
2. `curl -s http://localhost:3456/api/mod` → `{"src":"app"}` (oверлей по server-роутам).
3. В шаблоне-пробе модуля (или во временной странице модуля) `ModBadge` автоимпортирован (компоненты слоя видны).
4. Оверлей layouts: `app/layouts/mod.vue` с `.app-layout` переопределяет модульный.

Если push слоя не работает: попробовать варианты (a) `nuxt.options.alias['#mod-app']` + явная регистрация, (b) генерация страниц через templates (fallback спеки §11), и зафиксировать выбор.

- [ ] **Step 7: Decision-док**

`docs/superpowers/spikes/2026-09-27-s0-1-nuxt-overlay.md`:

```markdown
# S0.1: Nuxt 4 overlap-механизм
- Выбранный механизм: <наименование> (код из module.ts ниже, 1:1)
- Подтверждено: [pages-overlay, server-overlay, components, layouts] (curl-выводы)
- Dual-glob тем: <abs-path glob via addTemplate — работает/не работает; если нет — путь замены>
- Fallback (при негативе): <что делаем вместо layer>
```

- [ ] **Step 8: Commit (в worktree)**

```bash
git add docs/superpowers/spikes/2026-09-27-s0-1-nuxt-overlay.md
git commit -m "docs(spikes): S0.1 nuxt overlay mechanism verified"
```

### Task 2: Spike S0.1b — каталог миграций Payload 3.90 (core + проект)

**Files:**
- Create (scratch): `C:\Users\iisiraev\AppData\Local\Temp\opencode\siril-s02\` — скрач-Payload
- Create: `docs/superpowers/spikes/2026-09-27-s0-1b-payload-migrations-dir.md`

**Interfaces:**
- Produces: подтверждённый механизм «core-миграции в пакете + проектные в проекте, одна БД»: (a) `config.migrations.dir` (и поддерживает ли Payload 3.90 несколько катологов — вероятнее нет), (b) copy-синхронизация (fallback). Task 8 использует победителя.

- [ ] **Step 1: Определить фактический конфиг-срочек Payload 3.90**

Из `node_modules` референса (репо, не scratch):

```bash
rg -n "migrations" node_modules/payload/dist/config.d.ts | Select-Object -First 20
rg -n -A5 "interface MigrationsOptions|dir\??:" node_modules/payload/dist/types.d.ts | Select-Object -First 40
```

Зафиксировать: есть ли `migrations.dir`, принимает ли `Array<string>`.

- [ ] **Step 2: Scratch-приложение Payload**

```
C:\Users\iisiraev\AppData\Local\Temp\opencode\siril-s02\
  package.json  { name: "s02", type: "module", dependencies: { payload: "3.90.x", "@payloadcms/db-postgres": "3.90.x", "typescript" }, devDep: @types/node, scripts: { migrate: "payload migrate" } }
  payload.config.ts  — минимум: secret, db postgres (pg 5434), typescript outputFile, migrations: { dir: <путь> } (если Step 1 подтвердил опцию)
  src/migrations/proj_1_add_table.ts (простая миграция, создающая таблицу proj_t)
  core-каталог: core-migrations/core_1_add_table.ts (таблица core_t)
```

`payload.config.ts` (вариант с опцией dir):

```ts
import path from 'node:path'
import fileURLToPath from 'node:url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'

const here = path.dirname(fileURLToPath(import.meta.url))

export default buildConfig({
  secret: 'spike-secret-at-least-32-characters-long-value',
  db: postgresAdapter({ pool: { connectionString: 'postgresql://payload:dev@localhost:5434/payload' } }),
  typescript: { outputFile: path.join(here, 'payload-types.ts') },
  migrations: { dir: path.join(here, 'core-migrations') }, // если опции нет — удалить и идти по copy-путьу
  collections: [],
})
```

(Если `migrations.dir` не принимает/не существует: записать это и сразу переходить к copy-варианту — скопировать `core_1_add_table.ts` в `src/migrations/` и прогнать вместе с `proj_1_add_table.ts`.)

- [ ] **Step 3: Чистый Postgres + запуск**

```bash
docker run -d --rm --name s02pg -p 5434:5432 -e POSTGRES_USER=payload -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=payload postgres:16
cd C:\Users\iisiraev\AppData\Local\Temp\opencode\siril-s02
& "$env:APPDATA\npm\pnpm.cmd" install
& "$env:APPDATA\npm\pnpm.cmd" migrate
```

- [ ] **Step 4: Проверки**

```bash
docker exec s02pg psql -U payload -d payload -c "\dt"   # таблицы: _migrations + proj_t (+ core_t, если dir-путь)
docker exec s02pg psql -U payload -d payload -c "select slug from _migrations order by id"
docker run -d --rm --name s02pg2 -p 5434:5432 -e POSTGRES_USER=payload -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=payload postgres:16  # при необходимости 2-й запуск
```

Второй запуск migrate (идемпотентность): миграции не должны пересоздаваться, `_migrations` — без дублей.

- [ ] **Step 5: Collision-проверка (если dir-путь)**

Две миграции с одинаковым timestamp-префиксом в разных каталогах (если dir принимает только один каталог — прогнать collision внутри copy-потока): зафиксировать, как Payload ведёт себя (ошибка/дубль).

- [ ] **Step 6: Decision-док + commit**

`docs/superpowers/spikes/2026-09-27-s0-1b-payload-migrations-dir.md`:

```markdown
# S0.1b: Каталог миграций Payload 3.90
- config.migrations.dir: да/нет (цитата из config.d.ts, строки …)
- Несколько каталогов: да/нет
- ВЫБОР: <dir | copy-sync>
- Образец конфига (1:1) + образец copy-скрипта (если выбран copy)
- Collision-поведение: …
```

Commit в том же коммите/следующем: `git add docs/superpowers/spikes/ && git commit -m "docs(spikes): S0.1b payload migrations dir mechanism"`

### Task 3: Spike S0.2 — admin-ui компоненты из пакета (importMap baseDir)

**Files:**
- Create (scratch): `C:\Users\iisiraev\AppData\Local\Temp\opencode\siril-s03\` — scratch Next+Payload и пакет `ext`
- Create: `docs/superpowers/spikes/2026-09-27-s0-2-admin-ui-from-package.md`

**Interfaces:**
- Produces: механизм, при котором `admin.components` строка в контрактах (сейчас `'./src/admin-ui/variant-picker'` — `packages/blocks-definitions/src/to-payload.ts:59`) указывает на файл **в пакете**: (a) `importMap.baseDir` → каталог пакета + rebase строки, (b) fallback: компоненты остаются в app (шаблон шлёт). Task 5 (param `adminUiBase`) и Task 8 (конфиг) используют победителя.

- [ ] **Step 1: Scratch-пакет `ext`**

```
ext/src/admin-ui/picker.tsx   — маленький компонент: export default function Picker(){ return <div className="picker">P</div> }
ext/src/index.ts               — export { } as default; // заглушка + comment
ext/package.json               — { name: "ext", version: "0.0.0", main: "src/index.ts", type: "module" }
```

- [ ] **Step 2: Scratch-приложение (Next 16 + Payload 3.90)**

Структура — 1:1 как у референса: `app/(payload)/api/[...slug]/route.ts`, `app/(payload)/admin/[[...segments]]/page.tsx` (копировать из `apps/admin/app/(payload)/...`), `payload.config.ts` с одной коллекцией `widget`, чьё поле:

```ts
{ name: 'kind', type: 'text', admin: { components: { Field: './admin-ui/picker' } } }
```

и:

```ts
admin: { importMap: { baseDir: <абс. путь к ext/src> } }
```

(Если rebase строки через baseDir не проходит — вторая кандидатура: `baseDir` = корень scratch-app, а строка `./node_modules/ext/src/admin-ui/picker`; зафиксировать какую.)

- [ ] **Step 3: Генерация importMap + сборка**

```bash
cd C:\Users\iisiraev\AppData\Local\Temp\opencode\siril-s03
& "$env:APPDATA\npm\pnpm.cmd" install
& "$env:APPDATA\npm\pnpm.cmd" exec payload generate:importmap
cat app/(payload)/admin/importMap.js   # — должен содержать import из ext/ (а не ./src/admin-ui/…)
& "$env:APPDATA\npm\pnpm.cmd" exec next build
```

- [ ] **Step 4: Рендер** (dev): `next dev` → открыть `/admin` (логин через seed/first user) → поле `kind` у widget → компонент P отрисован (a11y-проверка: `aria`/тег `div.picker` в DOM). Зафиксировать console-ошибки.

- [ ] **Step 5: Decision-док + commit**

`docs/superpowers/spikes/2026-09-27-s0-2-admin-ui-from-package.md`:

```markdown
# S0.2: admin-ui из пакета
- Выбран: <baseDir=package + rebase | node_modules-путь | fallback-в-app>
- Строка в контрактах (final): <значение `adminUiBase`>
- Образец конфига importMap (1:1)
- next build: ок/нет (лог при "нет")
```

`git add docs/superpowers/spikes/ && git commit -m "docs(spikes): S0.2 admin-ui from package verified"`

- [ ] **Step 4 (окончательный этап S0): merge worktree в main**

```bash
git checkout main
git merge --no-ff spike/s0 -m "chore(S0): merge spikes decision docs"
git worktree remove .worktrees/s0
```

Гейт фазы A: три decision-дока существуют в main, все механизмы подтверждены (либо зафиксирован fallback).

---

## Фаза A — Выворот пакетов

Работаем в main. Каждый Task — отдельный зелёный коммит. Порядок: A1 contracts, A2 admin, A3 web, A4 gate.

### Task 4: `@siril/contracts` — переименование + unbuild

**Files:**
- Rename: `packages/blocks-definitions/` → `packages/contracts/`
- Modify: `packages/contracts/package.json`
- Modify (импорт-строки `@siril/blocks-definitions` → `@siril/contracts`): `apps/web/nuxt.config.ts:13`, все `apps/web/app/**/*.{vue,ts}` (блоки, компоненты, страницы, composables — ~20 файлов), `apps/admin/package.json:24`, `apps/admin/src/collections/{pages,forms,sites}.ts`, `apps/admin/app/design/design-client.tsx:4-5`
- Modify: `packages/contracts/src/types.ts:1` (комментарий с именем пакета)
- Test: `packages/contracts/src/*.test.ts` (те же, имя пакета в импортах не важно)

**Interfaces:**
- Produces: пакет `@siril/contracts` (`0.1.0`), `dist/index.mjs` + `dist/index.d.ts` via unbuild; исходный export-surface `src/index.ts` неизменён.

- [ ] **Step 1: Renaming каталога**

```bash
git mv packages/blocks-definitions packages/contracts
```

- [ ] **Step 2: package.json**

`packages/contracts/package.json`:

```json
{
  "name": "@siril/contracts",
  "version": "0.1.0",
  "type": "module",
  "exports": { ".": { "types": "./dist/index.d.ts", "default": "./dist/index.mjs" } },
  "main": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "unbuild",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": { "typescript": "^5.6.0", "unbuild": "^3.5.0", "vitest": "^3.0.0" }
}
```

- [ ] **Step 3: Replace импортов по всему репо**

```bash
# PowerShell (repon root): заменить в исходниках (исключая node_modules/docs)
Get-ChildItem -Recurse -Include *.ts,*.vue,*.mjs,*.json -File -Exclude pnpm-lock.yaml |
  Where-Object { $_.FullName -notmatch 'node_modules|\.git|dist|\.nuxt|\.next' } |
  ForEach-Object { (Get-Content $_.FullName -Raw) -replace '@siril/blocks-definitions', '@siril/contracts' | Set-Content $_.FullName -NoNewline }
git status   # — пересмотреть список (ожидание: nuxt.config.ts, vue-блоки, админ-коллекции, design-client.tsx, package.json)
```

(Корневой `package.json`, `pnpm-workspace.yaml` — не содержат имён пакетов; `pnpm-lock.yaml` пересоздаст `pnpm install`.)

- [ ] **Step 4: install + build + тесты**

```bash
& "$env:APPDATA\npm\pnpm.cmd" install
& "$env:APPDATA\npm\pnpm.cmd" --filter @siril/contracts build
& "$env:APPDATA\npm\pnpm.cmd" --filter @siril/contracts test
& "$env:APPDATA\npm\pnpm.cmd" typecheck   # все workspace'ы
& "$env:APPDATA\npm\pnpm.cmd" lint
```

Ожидание: build создаёт `packages/contracts/dist/index.mjs` + `.d.ts`; тесты (registry/resolve/to-payload/form-fields/variant-preview) PASSED; typecheck/lint без ошибок.

- [ ] **Step 5: .gitignore — dist не коммитится**

Убедиться, что `packages/contracts/dist/` не попадает в git: проверить `git status --porcelain`; если dist виден — добавить в корневой `.gitignore` строку `dist/` (или `packages/*/dist/`).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: blocks-definitions → @siril/contracts (+unbuild dist)"
```

### Task 5: Merge-примитивы `@siril/contracts` (TDD) + `adminUiBase`

**Files:**
- Create: `packages/contracts/src/merge.ts`, `packages/contracts/src/merge.test.ts`
- Modify: `packages/contracts/src/index.ts` (export), `packages/contracts/src/types.ts` (если нужен тип), `packages/contracts/src/to-payload.ts` (опциональный параметр `adminUiBase`)

**Interfaces:**
- Produces (использует Task 8 и Task 9):
  - `mergeBlockRegistry(core: Record<string, BlockDef>, extra: Record<string, BlockDef>): Record<string, BlockDef>` — по id **полное** переопределение entry (extra > core), новые id добавляются.
  - `mergeThemeRegistry(core: ThemeDef[], extra: ThemeDef[]): ThemeDef[]` — то же по `id`, порядок: core-порядок, новые — в конец.
  - `toPayloadBlockFields(blocks, opts?: { adminUiBase?: string })` — default `'./src/admin-ui'` (текущее поведение, тесты не трогаем); с параметром — строка `admin.components.Field` = `${adminUiBase}/variant-picker`.

- [ ] **Step 1: Failing-тесты**

`packages/contracts/src/merge.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { mergeBlockRegistry, mergeThemeRegistry } from './merge'
import type { BlockDef, ThemeDef } from './types'

const block = (id: string, variant: string): BlockDef =>
  ({ id, name: id, variants: [{ id: variant, name: variant, fields: {} }] } as BlockDef)

const theme = (id: string): ThemeDef => ({ id, name: id, blocks: {}, tokens: {} } as ThemeDef)

describe('mergeBlockRegistry', () => {
  it('новые id проекта добавляются', () => {
    const merged = mergeBlockRegistry({ hero: block('hero', 'default') }, { cases: block('cases', 'card') })
    expect(Object.keys(merged)).toEqual(['hero', 'cases'])
  })
  it('коллизию id — полное переопределение (extra > core)', () => {
    const extra = block('hero', 'split')
    const merged = mergeBlockRegistry({ hero: block('hero', 'default') }, { hero: extra })
    expect(merged.hero.variants[0].id).toBe('split')
  })
  it('пустое extra — core без изменений', () => {
    const core = { hero: block('hero', 'default') }
    expect(mergeBlockRegistry(core, {})).toBe(core)
  })
})

describe('mergeThemeRegistry', () => {
  it('полное переопределение по id, новые — в конец', () => {
    const merged = mergeThemeRegistry([theme('default'), theme('mono')], [theme('mono'), theme('client')])
    expect(merged.map((t) => t.id)).toEqual(['default', 'mono', 'client'])
    expect(merged[1]).toBe(theme('mono'))
  })
})
```

`packages/contracts/src/to-payload.test.ts` — добавить в существующий describe:

```ts
it('adminUiBase rebase-ит путь компонента', () => {
  const blocks: Record<string, BlockDef> = { hero: { /* минимальный hero из BLOCKS */ } as any }
  const fields = toPayloadBlockFields({ hero: (require('./registry').BLOCKS.hero) } as any, { adminUiBase: './admin-ui' })
  const variant = fields[0] as any
  expect(variant.admin?.components?.Field).toBe('./admin-ui/variant-picker')
})
```

(Синтаксис под existing-смысл `toPayloadBlockFields` подогнать под фактическую сигнатуру в `to-payload.ts` — `require` заменить на обычный import.)

- [ ] **Step 2: Пробег — тесты падают**

```bash
& "$env:APPDATA\npm\pnpm.cmd" --filter @siril/contracts test -- merge
```

Ожидание: FAIL (`merge.ts` не найден).

- [ ] **Step 3: Реализация**

`packages/contracts/src/merge.ts`:

```ts
import type { BlockDef, ThemeDef } from './types'

export function mergeBlockRegistry(core: Record<string, BlockDef>, extra: Record<string, BlockDef>): Record<string, BlockDef> {
  if (Object.keys(extra).length === 0) return core
  return { ...core, ...extra }
}

export function mergeThemeRegistry(coreThemeDecls: ThemeDef[], extraThemes: ThemeDef[]): ThemeDef[] {
  if (extraThemes.length === 0) return coreThemeDecls
  const map = new Map(coreThemeDecls.map((t) => [t.id, t] as const))
  for (const t of extraThemes) map.set(t.id, t)
  const out = Array.from(map.values())
  return out
}
```

(Порядок `Map` — порядок вставки; `core`-порядок сохраняется, новые id — хвост. Проверить тестом выше.)

`to-payload.ts`: добавить параметр:

```ts
export function toPayloadBlockFields(blocks: Record<string, BlockDef>, opts: { adminUiBase?: string } = {}) {
  const base = opts.adminUiBase ?? './src/admin-ui'
  // …внутри: components: { Field: `${base}/variant-picker` }
}
```

`index.ts`: `export * from './merge'`.

- [ ] **Step 4: Тесты зелёные + build**

```bash
& "$env:APPDATA\npm\pnpm.cmd" --filter @siril/contracts test
& "$env:APPDATA\npm\pnpm.cmd" --filter @siril/contracts build
```

- [ ] **Step 5: Commit**

```bash
git add packages/contracts
git commit -m "feat(contracts): merge primitives (blocks/themes) + adminUiBase rebase"
```

### Task 6: Скелет пакета `@siril/admin`

**Files:**
- Create: `packages/admin/package.json`, `packages/admin/tsconfig.json`, `packages/admin/src/index.ts`, `packages/admin/src/siril-admin-config.ts`, `packages/admin/src/siril-admin-config.test.ts`, `packages/admin/vitest.config.ts` (или `vitest`-блок в tsconfig)

**Interfaces:**
- Produces: пакет `@siril/admin` (`0.1.0`), экспортирующий `sirilAdminConfig(project: { collections?: CollectionConfig[]; endpoints?: Endpoint[]; hooks?: Record<string, Hook[]> }): { collections: CollectionConfig[]; endpoints: Endpoint[]; hooks: Record<string, Hook[]> }` — пока пустые core-списки (заполняются Task 7); merge — аддитивный (project + core).

- [ ] **Step 1: package.json**

`packages/admin/package.json`:

```json
{
  "name": "@siril/admin",
  "version": "0.1.0",
  "private": false,
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": { "test": "vitest run", "typecheck": "tsc --noEmit" },
  "dependencies": {
    "@payloadcms/translations": "^3.90.2",
    "@siril/contracts": "workspace:*",
    "payload": "^3.90.1"
  },
  "devDependencies": { "typescript": "^5.6.0", "vitest": "^3.0.0", "@types/node": "^22.20.4" }
}
```

(Зависимости `payload`, `@payloadcms/*` — переезжают сюда из apps/admin по мере наполнения (Task 7); в скелете — только те, что нужны для типа `CollectionConfig`.)

- [ ] **Step 2: tsconfig + index**

`packages/admin/tsconfig.json`:

```json
{
  "extends": "../../apps/admin/tsconfig.json",
  "compilerOptions": { "noEmit": true, "jsx": "preserve" },
  "include": ["src"]
}
```

`packages/admin/src/index.ts`:

```ts
export { sirilAdminConfig } from './siril-admin-config'
```

- [ ] **Step 3: Failing-тест**

`packages/admin/src/siril-admin-config.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { sirilAdminConfig } from './siril-admin-config'

describe('sirilAdminConfig', () => {
  it('аддитивный merge: core + project', () => {
    const r = sirilAdminConfig({ collections: [{ slug: 'cases', fields: [] } as any] })
    expect(r.collections.map((c: any) => c.slug)).toContain('cases')
    expect(typeof r.endpoints).toBe('object')
    expect(typeof r.hooks).toBe('object')
  })
  it('пустой проект — core без изменений (референс)', () => {
    const r = sirilAdminConfig({})
    expect(Array.isArray(r.collections)).toBe(true)
  })
})
```

- [ ] **Step 4: Реализация + пробег**

`packages/admin/src/siril-admin-config.ts`:

```ts
import type { Endpoint, CollectionConfig, HooksByOperation } from 'payload'
import type { Hook } from 'payload'

type SirilProject = {
  collections?: CollectionConfig[]
  endpoints?: Endpoint[]
  hooks?: Record<string, Hook | Hook[]>
}

export function sirilAdminConfig(_project: SirilProject = {}): {
  collections: CollectionConfig[]
  endpoints: Endpoint[]
  hooks: Record<string, Hook | Hook[]>
} {
  // Core-списки — добавляются Task 7 (import из ./*.ts)
  const coreCollections: CollectionConfig[] = []
  const coreEndpoints: Endpoint[] = []
  const coreHooks: Record<string, Hook | Hook[]> = {}

  const { collections = [], endpoints = [], hooks = {} } = _project
  return {
    collections: [...coreCollections, ...collections],
    endpoints: [...coreEndpoints, ...endpoints],
    hooks: { ...coreHooks, ...hooks },
  }
}
```

```bash
& "$env:APPDATA\npm\pnpm.cmd" install
& "$env:APPDATA\npm\pnpm.cmd" --filter @siril/admin test
```

Ожидание: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/admin pnpm-lock.yaml
git commit -m "feat(admin): @siril/admin package skeleton (sirilAdminConfig)"
```

### Task 7: Перенос core-кода админки в `@siril/admin`

**Files:**
- Rename (git mv, из `apps/admin/src/` в `packages/admin/src/`):
  - `collections/{categories,forms,form-submissions,media,sites,site-content,seo,users,pages,posts}.ts` (все 10)
  - `access/{index.ts,site-scope.ts}`
  - `utils/{with-richtext-html,publish-hook,preview-url,notify,first-user,field-encryption,duplicate-slug}.ts` + их `.test.ts`
  - `endpoints/submissions-csv.ts`
  - `admin-ui/{variant-picker.tsx,form-builder-link.tsx}`
  - `migrations/*.ts` (12 файлов миграций + `index.ts`)
  - `access.test.ts` (→ `packages/admin/src/access.test.ts`)
- Delete (из `apps/admin/src/`): всё перечисленное выше
- Modify: `packages/admin/src/siril-admin-config.ts` (импорт core-списков), `packages/admin/src/index.ts` (экспорт helpers), `packages/admin/package.json` (зависимости `@payloadcms/db-postgres`, `@payloadcms/richtext-lexical`, `nodemailer`), `apps/admin/src/scripts/seed.ts` (импорты `../collections/*` → `@siril/admin`), `apps/admin/payload.config.ts` (в Task 8)

**Interfaces:**
- Consumes: `sirilAdminConfig` (Task 6), `toPayloadBlockFields(blocks, { adminUiBase })` (Task 5), `BLOCKS`/`THEMES` из `@siril/contracts`.
- Produces: `@siril/admin` c core-коллекциями/хуками/эндпоинтами/админ-уи; export-surface: `sirilAdminConfig`, `publishHook`, `notify`, `duplicateSlug`, `withRichtextHtml`, `field-encryption` helpers, `firstUser` hook, `Sites`…(все коллекции), `submissionsCsv`.

- [ ] **Step 1: git mv**

```bash
git mv apps/admin/src/collections packages/admin/src/collections
git mv apps/admin/src/access packages/admin/src/access
git mv apps/admin/src/utils packages/admin/src/utils
git mv apps/admin/src/endpoints packages/admin/src/endpoints
git mv apps/admin/src/admin-ui packages/admin/src/admin-ui
git mv apps/admin/src/migrations packages/admin/src/migrations
git mv apps/admin/src/access.test.ts packages/admin/src/
```

(Относительные импорты внутри перенесённых файлов (`../utils/…`, `./publish-hook`) не меняются. Импорт `@siril/contracts` — уже переименован в Task 4.)

- [ ] **Step 2: Подключить к sirilAdminConfig**

`packages/admin/src/siril-admin-config.ts` (заменил `coreCollections`/`coreEndpoints` на реальные импорты):

```ts
import type { Endpoint, CollectionConfig, Hook } from 'payload'
import { Categories } from './collections/categories'
import { Forms } from './collections/forms'
import { FormSubmissions } from './collections/form-submissions'
import { Media } from './collections/media'
import { Pages } from './collections/pages'
import { Posts } from './collections/posts'
import { Sites } from './collections/sites'
import { SiteContent } from './collections/site-content'
import { Users } from './collections/users'
import { submissionsCsv } from './endpoints/submissions-csv'
import type { CollectionConfig as _ } from 'payload'

// …
const coreCollections: CollectionConfig[] = [Sites, Media, Users, Pages, Posts, Categories, SiteContent, Forms, FormSubmissions]
const coreEndpoints: Endpoint[] = [submissionsCsv]
```

(Порядок и состав — 1:1 как в текущем `apps/admin/payload.config.ts:35`.)

- [ ] **Step 3: index.ts — экспорт helpers (стабильный surface, spec §4)**

`packages/admin/src/index.ts`:

```ts
export { sirilAdminConfig } from './siril-admin-config'
export { publishHook } from './utils/publish-hook'
export { notify, sendEmail } from './utils/notify'
export { duplicateSlug } from './utils/duplicate-slug'
export { withRichtextHtml } from './utils/with-richtext-html'
export * as fieldEncryption from './utils/field-encryption'
export { firstUserHook } from './utils/first-user'
export * as accessScopes from './access'
```

(Имена-экспорты подогнать под фактические экспорты в этих файлах — проверить `rg "export " packages/admin/src/utils/ packages/admin/src/access/` и выровнять; сигнатуры не менять.)

- [ ] **Step 4: seed.ts референса — импорты**

`apps/admin/src/scripts/seed.ts` — заменить `from '../collections/…'` (если есть) на `from '@siril/admin'`; `from '../utils/…'` — аналогично.

- [ ] **Step 5: package.json — зависимости**

`packages/admin/package.json` → dependencies добавить:

```json
"@payloadcms/db-postgres": "^3.90.1",
"@payloadcms/richtext-lexical": "3.90.1",
"nodemailer": "^10.0.10",
"@types/nodemailer": "^7"
```

И из `apps/admin/package.json` **убрать** перешедшие зависимости (`payload`, `@payloadcms/db-postgres`, `@payloadcms/richtext-lexical`, `@payloadcms/translations`, `nodemailer`), добавить:

```json
"@siril/admin": "workspace:*"
```

(`@payloadcms/next`, `@payloadcms/ui`, `next`, `react` — остаются в приложении.)

- [ ] **Step 6: install + тесты + typecheck**

```bash
& "$env:APPDATA\npm\pnpm.cmd" install
& "$env:APPDATA\npm\pnpm.cmd" --filter @siril/admin test
& "$env:APPDATA\npm\pnpm.cmd" typecheck
& "$env:APPDATA\npm\pnpm.cmd" lint
```

Ожидание: тесты пакета (perеехавшие utils-тесты + access + seed-связь) PASSED; typecheck/lint зелёные. (Сборка next/build — Task 8.)

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(admin): move core collections/hooks/endpoints/admin-ui/migrations to @siril/admin"
```

### Task 8: `sirilAdminConfig` в референсе + importMap baseDir (S0.2) + migration-механизм (S0.1b)

**Files:**
- Modify: `apps/admin/payload.config.ts` (полная замена — тонкий конфиг), `apps/admin/package.json` (name → `@siril/reference-admin`, script `migrations:sync` при copy-fallback), `apps/admin/tsconfig.json` (paths `@payload-config` → локальный конфиг), `.github/workflows/ci.yml` (фильтры), `e2e/playwright.config.ts:27,35` (команды фильтров), `package.json` root (script `seed`)
- Create (только если S0.1b → copy-fallback): `apps/admin/scripts/migrations-sync.mjs`
- Modify: `apps/admin/src/migrations/.gitkeep` (пустой каталог проектных)

**Interfaces:**
- Consumes: `sirilAdminConfig` (Task 7), механизм S0.2 (decision-док), механизм S0.1b (decision-док).
- Produces: референс-админка, собранная на пакете; rename `@siril/reference-admin`.

- [x] **Step 1: Тонкий payload.config**

`apps/admin/payload.config.ts` (заменить полностью):

```ts
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { sirilAdminConfig } from '@siril/admin'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { en } from '@payloadcms/translations/languages/en'
import { ru } from '@payloadcms/translations/languages/ru'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

try {
  process.loadEnvFile(path.resolve(dirname, '../../.env'))
} catch {
  // no root .env (prod containers get env injected) — ignore
}

const siril = sirilAdminConfig({}) // референс без проектных расширений

export default buildConfig({
  ...siril.coll // РАЗНОВО: см. ниже (spread)
  admin: {
    importMap: { baseDir: <по S0.2> },
  },
  collections: siril.collections,
  endpoints: siril.endpoints,
  hooks: siril.hooks,
  editor: <lexicalEditor как сейчас>,
  db: postgresAdapter({ pool: { connectionString: process.env.PAYLOAD_DB_URI ?? '' } }),
  secret: process.env.PAYLOAD_SECRET ?? 'dev-secret',
  serverURL: process.env.PAYLOAD_URL ?? 'http://localhost:3001',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  i18n: { fallbackLanguage: 'en', supportedLanguages: { en, ru } },
  // migration-механизм — по S0.1b (ниже, 2 варианта)
})
```

(Варианты в шаблоне `...siril` расписать явно: `collections: siril.collections, endpoints: siril.endpoints, hooks: siril.hooks` — не расползаться.)

- [x] **Step 2: importMap — по S0.2**

По decision-доку S0.2:
- если `baseDir` → каталог пакета: `importMap: { baseDir: path.resolve(dirname, '../../packages/admin/src') }` (workspace) + `adminUiBase = './admin-ui'` (Task 5) — передать в `sirilAdminConfig({ adminUiBase: './admin-ui' })` (расширить сигнатуру Task 7/6 этим опциональным полем — 1 строка).
- строковые пути `admin.components` в контрактах — остаются `${adminUiBase}/variant-picker` (Task 5).
- Сгенерировать: `& "$env:APPDATA\npm\pnpm.cmd" --filter @siril/reference-admin generate:importmap` (имя фильтра — ПОСЛЕ rename в Step 4; для промежуточной генерации — до rename) → убедиться, что `app/(payload)/admin/importMap.js` импортирует из `packages/admin` (workspace-симлинк). Commit-ится.

- [x] **Step 3: Migration-механизм — по S0.1b**

- **Вариант A (есть `migrations.dir`):** `payload.config.ts` → `migrations: { dir: path.resolve(dirname, '../../packages/admin/src/migrations') }`; `apps/admin/src/migrations/` — только `.gitkeep`. CI drift-check (ниже) — на каталог `packages/admin/src/migrations`.
- **Вариант B (copy-синхронизация):** `apps/admin/scripts/migrations-sync.mjs`:

```js
// Идempotent copy core-мigrations из пакета в локальный src/migrations
import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const src = path.resolve(root, '../../packages/admin/src/migrations')
const dst = path.resolve(root, '../src/migrations')
mkdirSync(dst, { recursive: true })
for (const f of readdirSync(src)) {
  if (!f.endsWith('.ts')) continue
  if (f === 'index.ts') continue
  cpSync(path.join(src, f), path.join(dst, f)) // перезапись idempotent (fайлы self-contained)
}
console.log('migrations synced from @siril/admin → src/migrations')
```

`package.json` референса: `"migrations:sync": "node scripts/migrations-sync.mjs"`; `migrate` script не меняется (dir по умолчанию = `src/migrations`). CI drift-check → на `apps/admin/src/migrations` (не меняется).

- [x] **Step 4: Rename приложения + фильтры**

```bash
# package.json apps/admin: "name": "@siril/reference-admin"
```

- `e2e/playwright.config.ts:27`: `pnpm --filter @siril/reference-admin build && pnpm --filter @siril/reference-admin start`
- `.github/workflows/ci.yml`: все `--filter @siril/admin` → `--filter @siril/reference-admin` (migrations job: `migrate`, `migrate:generate`; drift-check git path — по Step 3 вариант)
- `package.json` root: `"seed": "pnpm --filter @siril/reference-admin seed"`

- [x] **Step 5: Полная проверка**

```bash
& "$env:APPDATA\npm\pnpm.cmd" install
& "$env:APPDATA\npm\pnpm.cmd" --filter @siril/contracts build
& "$env:APPDATA\npm\pnpm.cmd" typecheck
& "$env:APPDATA\npm\pnpm.cmd" lint
& "$env:APPDATA\npm\pnpm.cmd" test
docker run -d --rm --name apg -p 5433:5432 -e POSTGRES_USER=payload -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=payload postgres:16
$env:PAYLOAD_DB_URI='postgresql://payload:dev@localhost:5433/payload'
& "$env:APPDATA\npm\pnpm.cmd" --filter @siril/reference-admin migrate
& "$env:APPDATA\npm\pnpm.cmd" --filter @siril/reference-admin seed
```

Ожидание: migrate применяет core-миграции (из пакета), seed создаёт демо-контент. (dev-сервер + ручной логин — Task 13 gate.)

- [x] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor(admin): reference app on @siril/admin (sirilAdminConfig, importMap baseDir, migrations)"
```

### Task 9: Скелет Nuxt-модуля `@siril/web`

**Files:**
- Create: `packages/web/package.json`, `packages/web/tsconfig.json`, `packages/web/src/module.ts`, `packages/web/src/module.test.ts` (smoke: setup не падает), `packages/web/src/runtime/` (пустые `app/`, `server/`, `themes/`)

**Interfaces:**
- Consumes: механизм S0.1 (decision-док: точный `module.ts`), merge-примитивы (Task 5) — не в скелете (включаются при наполнении, Task 10/11).
- Produces: Nuxt-модуль с опциями `siril: { blocks?: Record<string, BlockDef>; themes?: ThemeDef[] }`; runtime-слои регистрируются по S0.1-механизму.

- [x] **Step 1: package.json**

`packages/web/package.json`:

```json
{
  "name": "@siril/web",
  "version": "0.1.0",
  "type": "module",
  "exports": { ".": "./src/module.ts" },
  "main": "./src/module.ts",
  "types": "./src/module.ts",
  "scripts": { "test": "vitest run", "typecheck": "nuxt typecheck" },
  "dependencies": {
    "@nuxt/kit": "^4.0.0",
    "@siril/contracts": "workspace:*"
  },
  "devDependencies": { "nuxt": "^4.5.2", "typescript": "^5.6.0", "vitest": "^3.0.0" }
}
```

- [x] **Step 2: module.ts — из S0.1 (1:1 decision-док)**

Вставить код-образец из `docs/superpowers/spikes/2026-09-27-s0-1-nuxt-overlay.md` с изменением meta/имён:

```ts
import { fileURLToPath } from 'node:url'
import { addTemplate, createResolver, defineNuxtModule } from '@nuxt/kit'
import type { BlockDef, ThemeDef } from '@siril/contracts'
import { mergeBlockRegistry, mergeThemeRegistry, BLOCKS, THEMES } from '@siril/contracts'

export type SirilModuleOptions = { blocks?: Record<string, BlockDef>; themes?: ThemeDef[] }

export default defineNuxtModule<SirilModuleOptions>({
  meta: { name: 'siril-web', configKey: 'siril' },
  setup(options, nuxt) {
    const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))
    // <Точный S0.1-механизм: push слоя (srcDir=runtime/app, serverDir=runtime/server) или зафиксированный fallback>

    // Dual-glob регистр (темы) — addTemplate с абсолютным путём (S0.1 подтвердил; при отрицательном — fallback)
    addTemplate({
      filename: 'siril/theme-styles.gen.mjs',
      getContents: () =>
        `export const moduleThemes = import.meta.glob(${JSON.stringify(fileURLToPath(new URL('./themes', import.meta.url)))} + '/*/tokens.css', { query: '?raw', import: 'default' })\n` +
        `export const projectThemes = import.meta.glob(${JSON.stringify(process.cwd() + '/themes')} + '/*/tokens.css', { query: '?raw', import: 'default' })\n`,
    })
    // nuxt.alias['#siril'] → runtime (auto-import composables/utils)
    nuxt.options.alias['#siril'] = runtimeDir
  },
})
```

Если S0.1 подтвердил alias-glob `~/themes` — использовать его вместо абсолютного пути (короче).

- [x] **Step 3: Smoke-тест** (setup не падает, alias зарегистрирован):

`packages/web/src/module.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { sirilModuleOptions } from './module-options' // вынести чистую логику (см. ниже)
// Сигнатура module.ts из S0.1 проверяется интеграционно (Task 11) — здесь только опции-merge
import { mergeOptions } from './module-options'

describe('module options', () => {
  it('пустые опции — core', () => {
    const r = mergeOptions({})
    expect(r.blocks).toBeDefined()
  })
})
```

`packages/web/src/module-options.ts`:

```ts
import type { BlockDef, ThemeDef } from '@siril/contracts'
import { BLOCKS, THEMES, mergeBlockRegistry, mergeThemeRegistry } from '@siril/contracts'
import type { SirilModuleOptions } from './module'

export function mergeOptions(options: SirilModuleOptions) {
  return {
    blocks: mergeBlockRegistry(BLOCKS as Record<string, BlockDef>, options.blocks ?? {}),
    themes: mergeThemeRegistry(THEMES, options.themes ?? []),
  }
}
```

```bash
& "$env:APPDATA\npm\pnpm.cmd" install
& "$env:APPDATA\npm\pnpm.cmd" --filter @siril/web test
```

(Тип `BLOCKS` в контрактах — `Record<string, BlockDef>`? если нет — cast, как в тесте выше; зафиксировать точный тип в Task 10.)

- [x] **Step 4: Commit**

```bash
git add packages/web pnpm-lock.yaml
git commit -m "feat(web): @siril/web nuxt module skeleton (S0.1 mechanism)"
```

### Task 10: Перенос web-app кода в runtime модуля

**Files:**
- Rename (git mv, из `apps/web/` в `packages/web/src/runtime/`):
  - `app/components/{RichText,PostCard,BlockRenderer}.vue`
  - `app/blocks/**` (все 14 каталогов + `Placeholder.vue`; `registry.ts` — **удаляется**, заменяется generated-шаблоном, Task 11)
  - `app/layouts/default.vue`
  - `app/pages/{[...slug].vue,404.vue,index.vue,blog/index.vue,blog/[slug].vue,preview/page/[...slug].vue,preview/post/[slug].vue}`
  - `app/composables/use-site.ts`
  - `app/utils/{media.ts,media.test.ts,analytics.ts,analytics.test.ts}`
  - `server/` → `packages/web/src/runtime/server/` (весь: `utils/`, `routes/`, `middleware/cache.ts`, `api/**`)
  - `themes/` (root-каталог `apps/web/themes/{default,mono}/tokens.css`) → `packages/web/src/runtime/themes/`
- Delete (из `apps/web/app/blocks/`): `registry.ts`
- Modify: `packages/web/src/runtime/app/blocks/Placeholder.vue` (не менять, путь), `packages/web/src/runtime/app/layouts/default.vue` (dual-glob — ниже), `packages/web/src/module.ts` (addTemplate для block-registry)

**Interfaces:**
- Consumes: S0.1 механизм, merge-примитивы, `@siril/contracts`.
- Produces: runtime с блоками/страницами/роутами; `#siril-block-registry` (generated) с dual-glob (модуль + `~/app/blocks` проекта, oверлей: проект > модуль).

- [x] **Step 1: git mv (все файлы)**

```bash
git mv apps/web/app/components packages/web/src/runtime/app/components
git mv apps/web/app/blocks packages/web/src/runtime/app/blocks
git mv apps/web/app/layouts packages/web/src/runtime/app/layouts
git mv apps/web/app/pages packages/web/src/runtime/app/pages
git mv apps/web/app/composables packages/web/src/runtime/app/composables
git mv apps/web/app/utils packages/web/src/runtime/app/utils
git mv apps/web/server packages/web/src/runtime/server
git mv apps/web/themes packages/web/src/runtime/themes
git rm packages/web/src/runtime/app/blocks/registry.ts
```

(Относительные импорты внутри runtime не меняются. Импорт `@siril/contracts` — Task 4 уже переименовал.)

- [x] **Step 2: Dual-glob блок-registrы — addTemplate в module.ts**

Добавить в `module.ts` (рядом с theme-шаблоном):

```ts
addTemplate({
  filename: 'siril/block-registry.gen.mjs',
  getContents: () =>
    `const moduleBlocks = import.meta.glob(${JSON.stringify(fileURLToPath(new URL('./app/blocks', import.meta.url)))} + '/**/*.vue')\n` +
    `const projectBlocks = import.meta.glob(${JSON.stringify(nuxt.options.srcDir + '/blocks')} + '/**/*.vue')\n` +
    `const pascal = (s) => s.charAt(0).toUpperCase() + s.slice(1)\n` +
    `const merged = { ...moduleBlocks, ...projectBlocks }\n` +
    `export function getBlockComponent(type, variant) {\n` +
    `  const key = Object.keys(merged).find((k) => /\/${type}\/${pascal(varian)}\\.vue$/.test(k))\n` +
    `  if (!key) return () => import('${JSON.stringify(fileURLToPath(new URL('./app/blocks/Placeholder.vue', import.meta.url)))}')\n` +
    `  return merged[key]()\n` +
    `}\n`,
})
```

(Точные имена/путь шаблона — по S0.1-паттерну, если там другой механизм записи; dual-glob merge — проект > модуль через spread order. `placeholder` — явный import, не glob, чтобы не зависеть от order.)

- [x] **Step 3: Theme dual-glob в layout**

`packages/web/src/runtime/app/layouts/default.vue` — заменить текущий `import.meta.glob('../../themes/*/tokens.css', …)` (строка 36) на импорт двух глобов из generated (или 2 `import.meta.glob` прямо в файле: относительный — модульные темы, `~/themes` — проектные (если S0.1 подтвердил alias-glob), else — generated):

```ts
const modThemes = import.meta.glob('../../../themes/*/tokens.css', { query: '?raw', import: 'default' }) as Record<string, () => Promise<string>> // из runtime/app/layouts → runtime/themes
const projThemes = import.meta.glob('~/themes/*/tokens.css', { query: '?raw', import: 'default' }) as Record<string, () => Promise<string>> // проект (alias `~` — S0.1 подтвердит; при neg. → шаблон с абсолютным)
const byId = (map: Record<string, () => Promise<string>>, id: string) =>
  Object.entries(map).find(([p]) => p.includes(`/${id}/tokens.css`))
const selected = byId(projThemes, themeId) ?? byId(modThemes, themeId) ?? byId(modThemes, 'default')
if (!selected) throw new Error('themes/default/tokens.css not found in build')
```

(Логика fallback на default и throw не известному — 1:1 текущей, строки 37–40.)

- [x] **Step 4: Проверка сборки runtime (unit + typecheck пакета)**

```bash
& "$env:APPDATA\npm\pnpm.cmd" --filter @siril/web test   # media/analytics тесты переехали
& "$env:APPDATA\npm\pnpm.cmd" typecheck
```

- [x] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor(web): move app code to @siril/web runtime (blocks, pages, server, themes)"
```

### Task 11: Тонкий референс-web + merge опций

**Files:**
- Create: `apps/web/app/app.vue` (5 строк, как сейчас), `apps/web/app/error.vue` (не меняется, уже в app), `apps/web/app/blocks/.gitkeep`, `apps/web/app/themes/.gitkeep` (пустые палитры проекта — шаблонный pattern, spec §8)
- Modify: `apps/web/nuxt.config.ts` (модуль + transpile + runtimeConfig), `apps/web/package.json` (name → `@siril/reference-web`, deps), `apps/web/.gitignore` (dist/nuxt уже есть)
- Delete: `apps/web/app/{components,blocks,layouts,pages,composables,utils}` (уже в runtime, Task 10)
- Modify: `e2e/playwright.config.ts:35`, `package.json` root (dev:all), `apps/admin/src/scripts/seed.ts` (если ссылается на web — нет)

**Interfaces:**
- Consumes: модуль + runtime (Task 10).
- Produces: референс-web, имя `@siril/reference-web`; `nuxt.config.ts` — 15 строк; DX `pnpm dev:all` 1:1.

- [ ] **Step 1: Остатки app-директории** (после Task 10 в `apps/web/app/` остаются только `app.vue`, `error.vue`):

```bash
# Проверить: Get-ChildItem apps/web/app -Recurse -File   (ожидание: app.vue, error.vue, blocks/.gitkeep, themes/.gitkeep)
New-Item -ItemType File apps/web\app\blocks\.gitkeep
New-Item -ItemType File apps/web\app\themes\.gitkeep
```

- [ ] **Step 2: nuxt.config.ts**

```ts
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: ['@siril/web'],
  siril: {}, // референс — без проектных blocks/themes (дог-фуддинг ядра)
  devtools: { enabled: true },
  runtimeConfig: {
    PAYLOAD_URL: process.env.PAYLOAD_URL ?? 'http://localhost:3001',
    PURGE_TOKEN: process.env.PURGE_TOKEN ?? 'dev-purge-token',
    public: {
      SITE_DOMAIN: process.env.NUXT_PUBLIC_SITE_DOMAIN ?? 'localhost:3000',
      MEDIA_BASE: process.env.NUXT_PUBLIC_MEDIA_BASE ?? 'http://localhost:3001',
    },
  },
  build: { transpile: ['@siril/web', '@siril/contracts'] },
  vite: { server: { allowedHosts: true } },
})
```

- [ ] **Step 3: package.json**

```json
{
  "name": "@siril/reference-web",
  "private": true,
  "type": "module",
  "scripts": { "dev": "nuxt dev --port 3000", "build": "nuxt build", "start": "node .output/server/index.mjs", "test": "vitest run", "typecheck": "nuxt typecheck", "postinstall": "nuxt prepare" },
  "dependencies": {
    "@siril/contracts": "workspace:*",
    "@siril/web": "workspace:*",
    "nuxt": "^4.5.2",
    "vue": "^3.5.43",
    "vue-router": "^5.3.1"
  },
  "devDependencies": { "typescript": "^5", "vitest": "^5.0.1", "vue-tsc": "^3.3.11" }
}
```

- [ ] **Step 4: Фильтры**

- `e2e/playwright.config.ts:35`: `pnpm --filter @siril/reference-web build && pnpm --filter @siril/reference-web start`
- `package.json` root `dev:all`: `"dev:all": "pnpm dev:pg && concurrently -n web,admin -c cyan,magenta \"pnpm --filter @siril/reference-web dev\" \"pnpm --filter @siril/reference-admin dev\""`
- `pnpm-lock.yaml` — пересоздаст `pnpm install` (Step 5).

- [ ] **Step 5: Install + dev-smoke**

```bash
& "$env:APPDATA\npm\pnpm.cmd" install
& "$env:APPDATA\npm\pnpm.cmd" --filter @siril/reference-web build
# dev smoke: запустить dev, curl-ом проверить страницу блога/главную (нужен запущенный admin — либо просто build-проверка)
```

Ожидание: build проходит (runtime-страницы + server-роуты + блокс). (Полный smoke с admin+pg — Task 13.)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor(web): thin reference app on @siril/web module"
```

### Task 12: Gate — Acceptance фазы A

**Files:** (не меняется, только проверки + фикс мелочей)

**Interfaces:**
- Проверка spec §9 A-критериев.

- [ ] **Step 1: Чистый install + полный прогон**

```bash
Remove-Item -Recurse -Force node_modules
& "$env:APPDATA\npm\pnpm.cmd" install
& "$env:APPDATA\npm\pnpm.cmd" lint
& "$env:APPDATA\npm\pnpm.cmd" typecheck
& "$env:APPDATA\npm\pnpm.cmd" test
& "$env:APPDATA\npm\pnpm.cmd" -r build
```

Ожидание: всё зелёное; `pnpm test` — все юнит-тесты (62+3 новых) PASSED.

- [ ] **Step 2: dev:all + ручные проверки**

```bash
& "$env:APPDATA\npm\pnpm.cmd" dev:all
# параллельно:
curl -s http://localhost:3000/          # — HTML главной (x-siril-cache header)
curl -s http://localhost:3000/api/health
curl -s http://localhost:3001/admin/login   # — HTML логина
# login: owner@demo.ru / admin123 (после seed)
```

Ожидание: страницы рендерятся, блоки — из runtime модуля, темы — из runtime.

- [ ] **Step 3: E2E (Playwright, чистый pg 5432)**

```bash
docker run -d --rm --name e2epg -p 5432:5432 -e POSTGRES_USER=payload -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=payload postgres:16
$env:PAYLOAD_DB_URI='postgresql://payload:dev@localhost:5432/payload'
$env:PAYLOAD_SECRET='e2e-secret-at-least-32-characters-long'
& "$env:APPDATA\npm\pnpm.cmd" --filter @siril/reference-admin migrate
& "$env:APPDATA\npm\pnpm.cmd" --filter e2e test:e2e
```

Ожидание: golden-path (create page → publish → site → purge) PASSED.

- [ ] **Step 4: Drift-check (локально, как CI)**

```bash
echo "n" | & "$env:APPDATA\npm\pnpm.cmd" --filter @siril/reference-admin migrate:generate -- --name local_drift
if (git status --porcelain packages/admin/src/migrations/ apps/admin/src/migrations/) { Write-Error "Drift found" } else { Write-Host "No drift" }
```

(Путь — по механизму S0.1b (Step 3 Task 8).) Ожидание: "No drift".

- [ ] **Step 5: Финальный commit (если были фиксы)**

```bash
git add -A
git commit -m "chore: phase A gate — all green"
```

### Task 13: Докси (CLAUDE.md, README, developer.md, CHANGELOG)

**Files:**
- Modify: `CLAUDE.md` (таблица структуры + команды: `@siril/contracts`/`@siril/web`/`@siril/admin`/reference-имена), `README.md` (таблица пакетов, § "блоки" — путь к contracts), `docs/developer.md` (путь `packages/blocks-definitions` → `packages/contracts`; §4 шаг 1 — путь в registry; §8/команды — имя пакета), `CHANGELOG.md` (новое "Unreleased" entry)
- Modify: `docs/roadmap.md` (не трогать — ссылки на phases остаются валидными)

**Interfaces:** (нет)

- [ ] **Step 1: Обновить CLAUDE.md**

Таблица: строка `packages/blocks-definitions` → `packages/contracts (@siril/contracts)`; добавить строки `packages/web (@siril/web — Nuxt module)`, `packages/admin (@siril/admin — Payload extension)`; `apps/web`/`apps/admin` → "reference: @siril/reference-web / @siril/reference-admin".Команды: `pnpm --filter @siril/contracts test` и т.д.

- [ ] **Step 2: README + developer.md**

`README.md:7,21`: path и имя пакета. `docs/developer.md`: все вхождения `packages/blocks-definitions` → `packages/contracts` (rg + replace), §4 шаг 1 — путь registry.

- [ ] **Step 3: CHANGELOG**

В `CHANGELOG.md` в секцию `[Unreleased]` (или создать `## [0.1.0] - 2026-09-27`):

```markdown
- Платформа "движок + кастомизация" (spec 2026-09-27): `@siril/blocks-definitions` → `@siril/contracts` (unbuild, dist), новые пакеты `@siril/web` (Nuxt-модуль), `@siril/admin` (Payload-экстензия, `sirilAdminConfig`); `apps/*` — тонкие reференс-приложения (`@siril/reference-web`, `@siril/reference-admin`).
- Merge-примитивы: `mergeBlockRegistry`, `mergeThemeRegistry` (`@siril/contracts`).
- Lockstep-версия пакетов: 0.1.0.
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "docs: update for @siril/* package structure (phase A)"
```

---

## Session map

- **S0** (Tasks 1–3): один worktree, можно параллельно (независимые scratch-каталоги); результат — 3 decision-дока, merge в main.
- **A** (Tasks 4–13): последовательно в main. Task 4→5 (contracts), 6→7→8 (admin), 9→10→11 (web), 12 (gate), 13 (docs).
- Зависимости: 8 зависит от S0.1b+S0.2; 9–11 зависят от S0.1; 5 — от 4; 7 — от 5,6; 10 — от 9.
- Критерий "готово" (spec §9 A): Task 12 зелёный.

## Self-review (сделан автором плана)

1. **Spec coverage:** S0 (S0.1 overlay — Task 1, S0.1b migrations — Task 2, S0.2 admin-ui — Task 3), A (contracts rename+unbuild — Task 4, merge-примитивы — Task 5, admin-выворот+`sirilAdminConfig` — Tasks 6–8, web-выворот+модуль — Tasks 9–11, demo/seed в референсе — Task 8, e2e+drift+DX-гейты — Task 12, dox — Task 13). Закрытость core и обходные пути (§4) — зафиксированы в Global Constraints + доки (Task 13); расширение-механизмы (project collections/endpoints/hooks) — интерфейс `sirilAdminConfig` уже принимает (Task 6), доки — фаза B. **Gap:** compiled dist `@siril/admin`/`@siril/web` (spec §3) — осознанное отклонение (заметка в File Structure), компенсация — потребитель-транспайл через ts-loader (текущий DX); компиляция — фаза B.
2. **Placeholder scan:** S0-задачи — конкретный scratch-код + curl-проверки; S0-зависимые шаги фазы A — явные ветки (вариант A/B) с кодом, не "TBD".
3. **Type consistency:** `sirilAdminConfig` (Tasks 6/7/8), `mergeBlockRegistry`/`mergeThemeRegistry` (Task 5 → 9/10), `adminUiBase` (Task 5 → 8), имена пакетов/фильтров (Tasks 4/8/11/12 — все `@siril/reference-*` с Task 8/11, CI/e2e обновляются в тех же коммитах).
