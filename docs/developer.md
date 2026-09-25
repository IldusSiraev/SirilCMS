# Руководство разработчика — SirilCMS (v1)

Как устроена система, как администрировать контент, как добавлять блоки и как интегрировать темы/вёрстку.

Операционные процедуры (запуск стека, бэкапы, деплой) — отдельно: [runbooks/dev.md](runbooks/dev.md), [runbooks/prod.md](runbooks/prod.md).

---

## 1. Архитектура

Mono-repo (pnpm workspaces):

| Путь | Роль | Порт |
|---|---|---|
| `apps/web` | Публичный сайт: Nuxt 4 (SSR), Nitro | 3000 |
| `apps/admin` | Конструктор: Payload 3 на Next.js, PostgreSQL | 3001 |
| `packages/blocks-definitions` | **Единый источник правды (SSOT)**: контракты блоков, типов полей, тем | — |
| `infra` | docker-compose (dev/prod), Caddy, сценарии | 80/443 (prod) |
| `docs` | Документация (этот гайд, ранбуки, specs/plans) | — |

Поток данных:

```
Админка (Payload UI) → Postgres → Nuxt (server $fetch к Payload REST, БЕЗ токенов)
        → BlockRenderer → HTML (кэш 5 мин)
```

Ключевые правила (не нарушать):

- **Публичные чтения — без auth.** Web-сервер ходит в Payload API без токенов; draft-фильтр — server-side (published-only).
- **Кэш страниц** — middleware `apps/web/server/middleware/cache.ts` (HTML, TTL 5 мин, хедер `x-siril-cache`).
- **Purge**: payload-хук `apps/admin/src/utils/publish-hook.ts` (afterChange, fire-and-forget `POST {NUXT_URL}/api/purge` c `Bearer PURGE_TOKEN`). **draft-save не чистит кэш** (проверка параметра `draft`), publish чистит.
- **Роль owner** — единственный полный доступ; `editor` (Клиент) — только свой site (`canScope`, `apps/admin/src/access/site-scope.ts`).

---

## 2. Развитие (локальная среда)

Коротко (подробности — [runbooks/dev.md](runbooks/dev.md)):

```bash
pnpm install
pnpm dev:pg                                # Postgres 16 (docker) или внешний на :5433
pnpm --filter @siril/admin migrate         # применить миграции
pnpm seed                                  # демо-контент (идемпотентен)
pnpm dev:all                               # web :3000 + admin :3001
pnpm test                                  # 38 тестов (blocks 16 / admin 4 / web 18)
```

Вход в админку после сида: `owner@demo.ru / admin123`.

Точки входа в код:

- Конфиг Payload: `apps/admin/payload.config.ts` (сборка конфигов коллекций из `src/collections/`).
- Коллекции: `apps/admin/src/collections/*.ts` (pages, posts, media, forms, form-submissions, site-content, sites, users, categories).
- Миграции: `apps/admin/src/migrations/*.ts` (+ `.json`).
- Глобальный layout/страницы сайта: `apps/web/app/` (см. §5).

---

## 3. Администрирование

### 3.1 Доступ и роли

- Админка: **`http://localhost:3001/admin`** (корень `/` — плейсхолдер `<h1>Admin</h1>`, не баг).
- Коллекция **Users** (скрытая, группа Authentication) в настройках Payload.
- Роль — select: `owner` (Владелец) / `editor` (Клиент); дефолт — **editor**.
- `editor` ограничен site-связью: видит только контент своего сайта.

> ⚠️ **Первый пользователь** в пустой БД может быть создан без авторизации (логика «self-register первого»). При этом **без явного `"role": "owner"` пользователь станет editor** — в системе не останется админа (дыра). Первый админ создаётся с `role: owner` явно (seed так и делает).

**i18n интерфейса** — `payload.config.ts`, `i18n: { fallbackLanguage: 'en', supportedLanguages: { en, ru } }` (пакет `@payloadcms/translations`). Язык определяется по `Accept-Language` запроса; переключить можно в профиле пользователя (Settings → language). Кастомные/дополнительные строки — через `i18n.translations` (см. [Payload i18n docs](https://payloadcms.com/docs/configuration/i18n)). Field labels полей — plain-строки (русские), от языка UI не зависят.

### 3.2 Настройки сайта (колекция Sites)

Одна запись на сайт. Поля: `name`, `slug`, `domain`, `locale`, **`theme`** (select из `THEMES` — см. §5.1), `contacts`, `logo` (media), `settings` (smtp-поля видны только owner; `analyticsId` — публичный ID счётчика Яндекс.Метрики, подставляется в `<head>` сайта layout'ом). Изменение темы — **изменение данных, работает мгновенно, без деплоя**.

### 3.3 Навигация и футер (Site-content)

Одна запись. `navigation[]`: label + (страница или внешняя ссылка). `footer`: текст, соц-ссылки, email/phone/telegram. Изменение → purge кэша web.

### 3.4 Страницы (Pages) — основа сайта

Страница = `title`, `slug`, `sections[]` (**блоки**, см. §4) + SEO-блок (`seo()` — title/description/og/canonical/noindex). Включены versions (drafts): черновик → Publish. Публичный сайт читает только published.

Домашняя страница — страница со `slug: home` (иначе web отдаёт 404 «Home not found»).

### 3.5 Блог (Posts + Categories)

`/blog` — список, `/blog/[slug]` — пост. Посты — rich-text + SEO.

### 3.6 Медиа (Media)

Аплоады в admin. На web — абсолютные URL через `NUXT_PUBLIC_MEDIA_BASE` (dev: `http://localhost:3001`, prod: `https://admin.<domain>`), хелпер `apps/web/app/utils/media.ts`.

### 3.7 Формы (Forms / Form-submissions)

- Форма = коллекция `forms` с полем `fields[]` (типы — `packages/blocks-definitions/src/form-fields.ts` — от text до honeypot/consent).
- Вставка формы на страницу — блок `form-block` (выбор формы).
- Отправка — публичный endpoint web; записи в `form-submissions`.
- Выгрузка: CSV-endpoint `apps/admin/src/endpoints/submissions-csv.ts` (registered через `endpoints` в payload.config.ts).

### 3.8 Резервные копии / prod

Полные инструкции: [runbooks/prod.md](runbooks/prod.md).

---

## 4. Как создать новый блок

Блок — это **контракт** (SSOT в `packages/blocks-definitions`) + **Payload-поля** (генерируются автоматически) + **Vue-SFC** (вёрстка) + **тема** (ограничения/токены). Пункты 1–3 обязательны, 4 — при желании.

### Шаг 1. Контракт: `packages/blocks-definitions/src/registry.ts`

Дописать в `BLOCKS` (append-only):

```ts
{ type: 'quote', name: 'Цитата', description: 'Большая цитата', variants: [
  { id: 'default', name: 'Центр', fields: [
    { name: 'text', type: 'richtext', label: 'Текст', required: true },
    { name: 'author', type: 'text', label: 'Автор' },
  ] },
] },
```

Правила:

- `variants[0]` = дефолтный (fallback).
- Типы полей — union из `src/types.ts` (`BlockFieldType`):

| Тип в контракте | Payload-тип (генерится `to-payload.ts`) |
|---|---|
| `text`, `email`, `number` | `text`/`email`/`number` |
| `richtext` | `richText` (с `minimalRichTextEditor` — не `editor:'true'`, а то crash) |
| `boolean` | `checkbox` |
| `select` | `select` (+`options`) |
| `image` | `upload` (media, single) |
| `image-array` | `upload` (media, `hasMany`) |
| `link` | `text` (ссылка строкой) |
| `array-text` | `array` (одно поле `value`) |
| `object-array` | `array` (`subfields` → вложенные поля) |
| `page` | `relationship` → pages |
| `form` | `relationship` → forms |

- **Схема БД**: `pages.sections` — Payload-поле `blocks`; за каждый блок строится `slug: def.type` с **union-полками всех variant** (каждое поле с `admin.dependencies: variant in [...]` — в UI видны только поля выбранного варианта). Новые поля/блоки = **новая миграция**.

### Шаг 2. Миграция

```bash
pnpm --filter @siril/admin migrate:generate   # создать миграцию (файл в src/migrations)
pnpm --filter @siril/admin migrate             # применить
```

### Шаг 3. Вёрстка: `apps/web/app/blocks/<type>/<Variant>.vue`

Имя файла — **PascalCase variant id** (`default` → `Default.vue`, `banner` → `Banner.vue`). Регистрация **не нужна** — `apps/web/app/blocks/registry.ts` глобит `./**/*.vue` (кроме `Placeholder.vue`) и матчит `./<type>/<Variant>.vue`. Нет компонента → рендерится `Placeholder.vue`.

Соглашения компонента:

```vue
<template>
  <section class="quote" :style="tokens">
    <blockquote><RichText :value="block.text" /></blockquote>
    <cite v-if="block.author">{{ block.author }}</cite>
  </section>
</template>
<script setup lang="ts">
import { getTheme } from '@siril/blocks-definitions'
const props = defineProps<{ block: any; themeId: string }>()
const tokens = Object.fromEntries(Object.entries(getTheme(props.themeId).tokens))
</script>
```

- Пропсы: `block` (данные строки блока) + `themeId`.
- Токены темы — `:style` с `getTheme(themeId).tokens` (см. `hero/Default.vue`).
- Rich-text — `<RichText :value>`; картинки — через `mediaUrl()`; внутренние ссылки — `NuxtLink`.
- CSS компонента — локальный `<style>` (в SFC это нормально; запрет §7.1 — про `<style>` внутри `<template>`).

### Шаг 4. Темы (при желании)

В `registry.ts`, `THEMES[]` → `blocks`:

```ts
// by-default новые блоки добавляются автоматически (all()), т.к. список строится из BLOCKS
quote: { enabled: true }                 // включить
mono:  { blocks: { ..., quote: { enabled: false } } }  // отключить в mono
```

Опции `ThemeBlockConfig`: `enabled`, `variants: string[]` (подмножество), `defaultVariant`. Поведение fallback — §5.2.

### Шаг 5. Проверка

```bash
pnpm test        # блоки-контракты: to-payload.test / resolve.test в packages/blocks-definitions
pnpm dev:all     # создать страницу в admin с новым блоком → открыть на :3000
```

---

## 5. Темы и шаблоны (вёрстка)

### 5.1 Тема = ДВЕ синхронные точки

Одна тема описана в **двух местах** (оба обязательны):

1. **JS-токены**: `THEMES[].tokens` в `packages/blocks-definitions/src/registry.ts`
   (объект CSS-переменных). Используется каждым блоком через `getTheme(id).tokens` → `:style`.
2. **CSS-файл**: `apps/web/themes/<id>/tokens.css`
   (сырой CSS: `:root { --c-primary… }`, `body { }`, `a { }`). Подхватывается layout
   `apps/web/app/layouts/default.vue` через `import.meta.glob('../../themes/*/tokens.css', { query: '?raw' })`
   и внедряется в `<head>` через `useHead({ style: [{ innerHTML }] })`.

**Новая тема** = (1) папка `apps/web/themes/<ид>/tokens.css`; (2) запись `ThemeDef` в `THEMES`
(`id, name, preview?, tokens, blocks`); (3) — дальше автоматически: select в admin (Sites.theme)
заполняется из `THEMES`, `getTheme` резолвит по id (неизвестный id → `default`).

Переключение темы = менять `Sites.theme` в админке — данные, мгновенно (sites → purge).

### 5.2 Fallback-логика (resolve.ts)

`resolveVariant(theme, block, variantId)`:

- блок отключён темой (`enabled: false`) или вариант не в `variants` → берётся **первый дозволённый** вариант (flag `fallback: true`);
- unknown/отсутствующий `variantId` в данных → тоже первый дозволённый;
- контент не теряется — деградирует только вид.

Пример: тема `mono` отключила `form-block` и оставила только `default` у hero/text-image/cta.

### 5.3 Структура сайта (шаблоны)

`apps/web/app/`:

| Путь | Назначение |
|---|---|
| `layouts/default.vue` | Общий frame: header/nav (из site-content), `<slot>`, footer. Сюда же — CSS-файл темы (§5.1) |
| `pages/index.vue` | Главная: страница `slug=home` (404 если нет) |
| `pages/[...slug].vue` | Любая страница по slug (list блоков) |
| `pages/blog/index.vue`, `pages/blog/[slug].vue` | Блог |
| `pages/404.vue` | Ошибка |
| `components/BlockRenderer.vue` | Разрешает `blockType+variant` → компонент (`getBlock`, `resolveVariant`, `getBlockComponent`) |
| `components/RichText.vue`, `PostCard.vue` | Хелперы |
| `composables/use-site.ts` | `/api/site` → `{ site, content }` (themeId, nav, footer) |
| `utils/media.ts`, `utils/lexical-to-html.ts` | Медиа-URL, rich→HTML |

**«Подключить шаблон к сайту»** = вёрстка блока (§4) + layout/токены (§5.1). Отдельный
«конструктор страниц» — это сам admin: контентщик собирает страницу из блоков в UI;
разработчик добавляет новые блоки/темы.

Новый маршрут (например, статическая «о нас» без админки) — `apps/web/app/pages/about.vue`;
но по умолчанию любой лендинг создаётся через admin (страница + блоки) — без кода.

---

## 6. Типовые грабли

1. **`<style>`/`<script>` внутри `<template>` client-компонента** — жёсткая ошибка `vite:vue`
   (dev: blocking overlay; build: тег молча отбрасывается). Динамический_CSS в head —
   через `useHead({ style: [{ innerHTML }] })` (пример: layout default.vue).
2. **Rich-text**: `editor: 'true'` (строка) в Payload 3 → crash `editor.validate is not a function`.
   Использовать `minimalRichTextEditor` из `to-payload.ts`.
3. **Первый admin**: без явного `role: owner` — в системе не будет владельца (§3.1).
4. **Draft ≠ publish**: draft-save не чистит кэш (это осознанно). Если кэш «просрочен» —
   опубликовать версию или `POST /api/purge`.
5. **Тема без CSS-файла**: layout падает только если отсутствует `themes/default/tokens.css`
   (build-time check). Новая тема без `tokens.css` → молча fallback на default-файл.
6. **Windows/PS 5.1**: `pnpm` может быть вне PATH → `& "$env:APPDATA\npm\pnpm.cmd" …`.
7. **Admin `/`** — плейсхолдер, админка на **`/admin`**.
8. **Placeholder** — если компонент блока нет (или `blockType` не в `BLOCKS`), рендерится
   `apps/web/app/blocks/Placeholder.vue`, а не crash.

---

## 7. Полезные команды (шпаргалка)

```bash
pnpm test                                   # все тесты (38)
pnpm --filter @siril/blocks-definitions test   # только контракты блоков
pnpm --filter @siril/admin migrate:generate # новая миграция (после изменения схемы)
pnpm --filter @siril/admin migrate          # применить миграции
pnpm --filter @siril/admin generate:types   # перегенерировать payload-types.ts
pnpm seed                                   # демо-контент (идемпотентный)
pnpm -r build                               # прод-сборки (web: nuxt build, admin: next build)
make -C infra up                            # production-стек (см. runbooks/prod.md)
```
