# Engine Platform — Фаза C (create-siril + пилот)

**Spec:** §8 (генератор), §9 (фаза C), §10 (template freshness). Фаза B закрыта (extension API, docs, релизный инструментарий; релиз 0.5.0).

## Находка при первой же установке пакетов вне монорепо (C0)

Релиз 0.5.0 **непригоден** для проекта вне монорепо — проверено установкой `pnpm pack`-tarball'ов в копию `examples/minimal-project`:

1. `payload migrate/generate:*` падает: `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING` (Node не стрипает типы в `node_modules`; в монорепо работало, потому что симлинк резолвится вне `node_modules`).
2. `next build` без `transpilePackages` — `Unknown module type`; с ним — type-check падает на импорте `../../../../apps/reference-admin/payload-types` из кода пакета.
3. `nuxt build` — Nitro не транспилирует `src/runtime/server/**/*.ts` из `node_modules`.

Решение B6 «публиковать TS-исходники» было ошибочным → **C0: компилировать `@sirilcms/web` (`@nuxt/module-builder`) и `@sirilcms/admin` (`unbuild`/mkdist) в `dist`**; выпускать 0.6.0.

## Задачи

- [x] **C0.** Компиляция пакетов, фикс типов, `build:packages`, проверка из tarball'ов вне монорепо (PR).
- [x] **C1.** `templates/project/` — чистый шаблон (без демо-контента) на основе `examples/minimal-project`: плейсхолдеры `{{name}}`, зависимости `@sirilcms/*` по версии движка, `.npmrc` (GitHub Packages), `pnpm-workspace.yaml` (`allowBuilds`, `overrides`-секция не нужна), Dockerfile'ы, CI проекта, README.
- [x] **C2.** `packages/create-siril`: bin `create-siril <name> [--git]`, копирование шаблона, подстановка токенов, валидация имени (TDD).
- [x] **C3.** CI «template freshness»: scaffold → установка из tarball'ов текущего коммита → migrate → build → `verify`.
- [ ] **C4.** Пилот: реальный клиентский сайт из шаблона (по HTML-шаблону клиента, `html_templates/` в репо), замер времени против «копируй репо и правь»; одно обновление ядра через `docs/extension-api.md §5`.
