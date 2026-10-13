# Engine Platform — Фаза B (стабилизация API) Implementation Plan

**Spec:** `docs/superpowers/specs/2026-09-27-siril-engine-platform-design.md` §4, §7, §9 (фаза B).
**Предыдущая фаза:** A (`2026-09-27-engine-platform-s0-a.md`) — пакеты выворочены, но **extension API не подключён**.

## Находка при разборе фазы A (меняет объём B)

Phase A перенёс файлы, но центральное обещание §4 — «проект добавляет блок/тему через `siril.blocks` / `siril.themes`» — **не работает**:

- `@siril/web` module игнорирует опции (`setup(_options, …)`); `module-options.ts` не подключён.
- `mergeBlockRegistry` спредит **массив** `BLOCKS` в объект (ключи `"0","1"…`) — корректно мерджить нечем.
- `getBlock/getTheme/BLOCKS/THEMES` читают статические массивы; `Sites.theme`-select строится при загрузке модуля (`THEMES.map`) — проектные темы туда не попадут.
- `sirilAdminConfig(project)` принимает только `collections/endpoints/hooks`, но не `blocks/themes`.

Следовательно, критерий B («проект-пустышка с 1 блоком + 1 темой + 1 коллекцией по докам») сейчас невыполним. Фаза B = **реализовать** extension API, затем описать его.

## Решения

| # | Решение |
|---|---|
| 1 | Реестр блоков/тем — массивы, override по `type` / `id` (проект заменяет core-запись целиком). |
| 2 | `@siril/contracts` хранит активный реестр; `registerExtensions({blocks, themes})` пересобирает in-place экспортируемые `BLOCKS`/`THEMES` из `CORE_*` + расширений (идемпотентно, `resetExtensions()` для тестов). In-place — чтобы все существующие импорты `BLOCKS`/`THEMES` остались валидны. |
| 3 | Admin: `sirilAdminConfig({ blocks, themes, … })` регистрирует расширения **до** сборки коллекций; `Sites` становится фабрикой (`makeSites`), чтобы select тем брал смерженный реестр. |
| 4 | Web: опции модуля `siril: { blocks, themes }` сериализуются в `#build/siril/registry.gen.mjs`; Nuxt-плагин (client+SSR) и Nitro-плагин зовут `registerExtensions`. |
| 5 | Один файл контрактов проекта (`siril.extensions.ts`) импортируют и `nuxt.config.ts`, и `payload.config.ts` — единый источник для admin и web. |
| 6 | Приёмка B — **example-проект** `examples/minimal-project` в репо (workspace), собираемый только по `docs/extension-api.md`; CI собирает его. |

## Задачи (каждая — отдельный PR)

- [x] **B1. contracts:** массивный merge + `registerExtensions`/`resetExtensions` (TDD); исправить `merge.ts`, удалить мёртвый `module-options.ts` или переделать под массивы.
- [x] **B2. admin:** `makeSites`, `sirilAdminConfig({blocks, themes})`; тест: проектный блок/тема появляются в `pages.sections` и `sites.theme` options.
- [x] **B3. web:** опции модуля → gen-template + плагины; приоритет `app/themes/<id>/tokens.css` проекта над модульной; тест модуля.
- [x] **B4. example-проект** `examples/minimal-project`: 1 блок (контракт + SFC), 1 тема (ThemeDef + tokens.css), 1 коллекция; сборка `nuxt build` + загрузка payload config + `migrate:generate` без падений; CI-джоб.
- [x] **B5. docs:** `docs/extension-api.md` (стабильно / нестабильно, пример каждой строки §4), конвенция «не копировать core-файлы» (+ скрипт-проверка), компат-таблица.
- [ ] **B6. релиз:** lockstep-скрипт (`scripts/release.mjs`: бамп версий всех `@siril/*`, CHANGELOG-проверка, тег), CI-workflow публикации в GitHub Packages (dry-run в PR).

## Вне объёма B

`create-siril` генератор, `templates/project/`, пилот (фаза C); публичный semver-контракт (D); проектный `/design`-свитчер тем в reference-admin (клиентский компонент, берёт `THEMES` статически — отдельная задача, если понадобится).
