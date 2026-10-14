# Extension API — как строить проект на движке SirilCMS

Для кого: разработчик, который делает клиентский сайт **поверх** `@sirilcms/*` и не форкает репозиторий движка.
Принцип: **ядро закрыто, расширение аддитивное** — проект добавляет блоки, темы, коллекции, страницы и хуки, но не правит код ядра и не добавляет поля в core-коллекции (`pages`, `sites`, …). Нужно больше контента на странице — делайте новый **тип блока**; нужна новая сущность — делайте **коллекцию** проекта со связью на core.

Рабочий эталон, который собирается и проверяется в CI: [`examples/minimal-project`](../examples/minimal-project) (блок + тема + коллекция). Всё ниже сверено с ним; сквозной сценарий — `examples/minimal-project/scripts/verify.mjs`.

Дизайн-обоснование: [spec](superpowers/specs/2026-09-27-siril-engine-platform-design.md). Обновление проекта и совместимость версий: [compat.md](compat.md).

---

## 0. Что стабильно, что нет

| Контракт | Статус (0.x, внутренний) |
|---|---|
| Формат `BlockDef` / `ThemeDef` / `BlockField` (`@sirilcms/contracts`) | **Стабилен**; новые необязательные свойства — да, ломающие — только в minor с записью в CHANGELOG |
| `registerExtensions`, `sirilAdminConfig({ blocks, themes, collections, endpoints, hooks, adminUiBase })`, опция Nuxt-модуля `siril: { blocks, themes }` | **Стабилен** |
| Экспортируемые helpers `@sirilcms/admin` (`publishHook`, `notifySubmission`, `encryptField`/`decryptField`, `accessScopes`, `sirilEditor`, `bootstrapOwner`, `withRichTextHtml`, `makeDuplicateSlug`, `buildPreviewURL`, `forceOwnerForFirstUser`) | **Стабильны** сигнатуры |
| `siril-migrations-sync` (bin) | **Стабилен** |
| Соглашения путей проекта: `app/blocks/<type>/<Variant>.vue`, `themes/<id>/tokens.css`, `app/pages/**`, `server/**` | **Стабильны** |
| Внутренняя структура core-коллекций (имена полей, `admin-ui` компоненты), генерируемые файлы `.nuxt/siril/*`, `#siril-registry`, plugin-файлы модуля | **Нестабильны** — меняются без предупреждения (кроме записи в CHANGELOG) |
| Прямые импорты из `@sirilcms/admin/dist/**`, `@sirilcms/web/dist/runtime/**` | **Запрещены** — не API |

Публичный semver-контракт с гарантиями совместимости — фаза D (триггер «выход наружу»); сейчас гарантии внутренние, версии lockstep (`@sirilcms/contracts`, `@sirilcms/web`, `@sirilcms/admin` — одна версия).

---

## 1. Структура проекта

```
my-project/
├─ siril.extensions.ts          ← блоки и темы (общий файл: его импортируют и web, и admin)
├─ web/                         ← Nuxt 4 (публичный сайт)
│  ├─ nuxt.config.ts            ← modules: ['@sirilcms/web'], siril: { blocks, themes }
│  ├─ app/app.vue, app/error.vue
│  ├─ app/blocks/<type>/<Variant>.vue   ← Vue-компоненты ваших блоков
│  ├─ app/pages/**              ← (необязательно) свои страницы
│  ├─ server/**                 ← (необязательно) свои API-роуты
│  └─ themes/<id>/tokens.css    ← CSS ваших тем (в КОРНЕ web, не в app/)
└─ admin/                       ← Next 16 + Payload 3 (админка)
   ├─ payload.config.ts         ← sirilAdminConfig({ blocks, themes, collections })
   ├─ src/collections/*.ts      ← ваши коллекции
   ├─ src/migrations/           ← ЕДИНЫЙ каталог: core-копии + проектные миграции
   ├─ app/(payload)/…           ← стандартная обвязка Payload для Next (копируется из эталона)
   └─ scripts/ts-loader/        ← загрузчик TS для Payload CLI (копируется из эталона)
```

Обвязку `admin/app/(payload)`, `admin/scripts/ts-loader`, `next.config.mjs`, `tsconfig.json`, `web/app/app.vue`, `web/app/error.vue` берите **как есть** из `examples/minimal-project` (в фазе C это станет шаблоном `create-siril`).

> `siril.extensions.ts` лежит рядом с `web/` и `admin/`, поэтому ему нужен свой `package.json` с зависимостью `@sirilcms/contracts` (см. эталон) — иначе типы не резолвятся.

---

## 2. Новый блок

**2.1 Контракт** — чистые данные (`siril.extensions.ts`):

```ts
import type { BlockDef } from '@sirilcms/contracts'

export const casesBlock: BlockDef = {
  type: 'cases',                       // kebab-case, уникален; совпадает с папкой компонента
  name: 'Кейсы',
  variants: [                          // variants[0] — вариант по умолчанию (fallback)
    {
      id: 'card',                      // → файл Card.vue
      name: 'Карточка',
      layout: 'grid',                  // превью варианта в админке
      fields: [
        { name: 'title', type: 'text', label: { ru: 'Заголовок', en: 'Title' }, required: true },
        { name: 'items', type: 'array-text', label: { ru: 'Кейсы', en: 'Cases' }, maxItems: 12 },
      ],
    },
  ],
}
export const blocks = [casesBlock]
```

Типы полей и их соответствие Payload-полям — [developer.md §4](developer.md) (таблица). `richtext`-поле автоматически получает соседнее вычисляемое `<name>Html` — в компоненте рендерите `<RichText :value="block.<name>Html" />`.

**2.2 Компонент** — `web/app/blocks/cases/Card.vue` (имя файла = PascalCase от `id` варианта). Регистрировать нигде не нужно. Props: `block` (данные секции; тип блока — `block.blockType`) и `themeId`. Токены темы: `getTheme(themeId).tokens` → inline `:style`.

**2.3 Подключение** — в **обоих** конфигах:

```ts
// web/nuxt.config.ts
import { blocks, themes } from '../siril.extensions'
export default defineNuxtConfig({ modules: ['@sirilcms/web'], siril: { blocks, themes } })

// admin/payload.config.ts
const { collections, endpoints } = sirilAdminConfig({ adminUiBase: './admin-ui', blocks, themes })
```

**2.4 Миграция** — новый тип блока меняет схему (`pages_blocks_<type>*`, версии): `pnpm migrate:generate` → закоммитить файл (см. §5).

Правила:
- Блок проекта с **тем же `type`**, что у core, **заменяет core целиком** (используйте осознанно: контент существующих страниц деградирует через fallback-вариант, если id вариантов не совпали).
- **Core-темы автоматически включают новые блоки проекта** (иначе их нет в палитре); тема проекта включает только то, что перечислено в её `blocks`.
- Блок без Vue-компонента не роняет сайт — рендерится `Placeholder` (в dev это сразу видно: `[ / card]`).
- Удалять поля/варианты опубликованных блоков нельзя без процесса deprecation — [developer.md §4 шаг 6](developer.md).

---

## 3. Тема «один в один по верстке клиента»

```ts
// siril.extensions.ts
export const clientTheme: ThemeDef = {
  id: 'client',
  name: 'Client',
  tokens: { '--c-primary': '#b91c1c', '--c-bg': '#fffbeb', '--c-text': '#1c1917', '--radius': '1rem' },
  blocks: {                                // что включено и в каких вариантах
    hero: { enabled: true },               // variants не задан → все варианты блока
    cases: { enabled: true, variants: ['card'], defaultVariant: 'card' },
  },
}
export const themes = [clientTheme]
```

- CSS темы — `web/themes/client/tokens.css` (корень проекта `web/`). Он встраивается в `<head>` выбранной темы сайта. Файл проекта с тем же `id`, что у core-темы, **полностью заменяет** core-CSS.
- Тема с `id` core — **полная замена** core-темы (токены, блоки, варианты).
- Блок, не включённый в тему, на странице рендерится по fallback-варианту первого разрешённого варианта; контент не теряется.
- ⚠ **Схема БД зависит от списка тем**: `Sites.theme` — select → enum Postgres. Добавили/убрали тему — `migrate:generate` создаст `ALTER TYPE … ADD VALUE`; закоммитьте. (Ранняя редакция спеки утверждала обратное — это исправлено.)
- Выбрать тему для сайта — Sites → Theme в админке; применение мгновенное, без деплоя, с purge кэша.

---

## 4. Своя коллекция, страницы, хуки

**Коллекция** (новая сущность контента):

```ts
// admin/src/collections/cases.ts
export const Cases: CollectionConfig = {
  slug: 'cases',
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'site', type: 'relationship', relationTo: 'sites', required: true },
    { name: 'page', type: 'relationship', relationTo: 'pages' },   // связь с core — со стороны проекта
  ],
}
// payload.config.ts
sirilAdminConfig({ blocks, themes, collections: [Cases] })
```

Ядро о ваших коллекциях не знает. Не добавляйте поля в core-коллекции — используйте блок или связанную коллекцию.

**Страницы и роуты сайта** — обычные `web/app/pages/**` и `web/server/**` проекта (Nuxt/Nitro). Файл `app/…` проекта с тем же путём, что в модуле, **перекрывает** модульный (app > module). Правило: core-файл **не копируйте** «ради правки» — только полная замена файла или новый путь. Репозиторий проверяет это скриптом `scripts/check-no-core-copies.mjs` (идентичная копия core-файла — ошибка).

**Хуки и серверная логика** — свой код в проекте плюс helpers из `@sirilcms/admin` (список в §0). Хуки на коллекциях проекта вешаются как обычно в Payload; чтобы очищать кэш сайта при публикации своей сущности, вызывайте `publishHook(type, id, siteId)` из `afterChange`.

---

## 5. Миграции: две серии, один каталог

| Серия | Источник | Кто генерирует |
|---|---|---|
| core | `@sirilcms/admin` (`src/migrations`) | релиз движка |
| проектная | `admin/src/migrations` | вы: `pnpm migrate:generate` |

```bash
pnpm migrations:sync     # копирует core-миграции из node_modules/@sirilcms/admin в src/migrations (идемпотентно)
pnpm migrate             # применяет обе серии (учёт — таблица payload_migrations, по имени файла)
pnpm migrate:generate    # создаёт ТОЛЬКО проектную разницу (core-снапшоты уже в каталоге)
```

В реальном проекте коммитите **весь** `src/migrations` (core-копии + проектные); drift-check CI проекта: `migrate` на чистой БД → `migrate:generate` (на вопрос «пустая миграция?» — `n`) → в каталоге не должно появиться нового файла. Имя файла проекта не должно совпадать с core-именем (timestamp-префикс решает).

В файле миграции импортируйте типы раздельно: `import type { MigrateUpArgs, MigrateDownArgs } …` и `import { sql } …` (одним импортом Node ESM падает).

**Обновление движка в проекте:** `pnpm up "@sirilcms/*"` → прочитать CHANGELOG движка (раздел «Breaking / ручные шаги») → `pnpm migrations:sync` → `pnpm migrate:generate` (если ядро изменило схему так, что нужна проектная правка) → `pnpm typecheck && pnpm test && pnpm build` → деплой по `docs/runbooks/prod.md` (бэкап → deploy → verify → откат).

---

## 6. Окружение и запуск

Переменные (полный список — `.env.example` движка): `PAYLOAD_SECRET` (≥32 символа), `PAYLOAD_DB_URI`, `PAYLOAD_URL` (origin админки — **должен совпадать с адресом, по которому её открывают**, иначе save/publish падают на CSRF), `PURGE_TOKEN` (общий у admin и web), `NUXT_URL` (адрес web для purge из admin), `NUXT_PUBLIC_MEDIA_BASE` (origin админки для картинок), для прод: `DISABLE_FIRST_USER_SIGNUP=true`, `INITIAL_OWNER_EMAIL/PASSWORD`.

Первый запуск: `pnpm migrations:sync && pnpm migrate`, затем `pnpm generate:importmap` и `pnpm generate:types` (в репозиторий коммитятся `importMap.js` и `payload-types.ts`), `pnpm dev` в `admin/` и `web/`. `Payload` в dev сам синхронизирует схему (push) — **не полагайтесь на это**: прод применяет только миграции, поэтому всегда генерируйте и коммитьте миграцию.

Отложенная публикация требует `jobs.autoRun` в `payload.config.ts` (см. референс `apps/reference-admin`); оптимизация картинок — `sharp` в конфиге (`sharp` + `imageSizes` у core-медиа уже заданы).

---

## 7. Чеклист «проект собран по докам»

- [ ] `siril.extensions.ts` + `package.json` с `@sirilcms/contracts`
- [ ] Блок: контракт, `app/blocks/<type>/<Variant>.vue`, подключён в обоих конфигах
- [ ] Тема: `ThemeDef`, `themes/<id>/tokens.css`, подключена в обоих конфигах
- [ ] Коллекция в `sirilAdminConfig({ collections })`
- [ ] `migrations:sync` → `migrate` → `migrate:generate`, миграция закоммичена, drift-check пуст
- [ ] `generate:importmap`, `generate:types`
- [ ] `nuxt build` + `next build` проходят; страница с блоком открывается и рендерит ваш компонент (не `Placeholder`), CSS темы виден в `<head>`

Автоматизированная версия этого чеклиста — CI-джоб «Example project».
