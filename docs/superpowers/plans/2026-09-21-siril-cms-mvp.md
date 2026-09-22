# SirilCMS MVP Implementation Plan

> **Для агентных воркеров:** ОБЯЗАТЕЛЬНЫЙ SUB-SKILL: использовать superpowers:subagent-driven-development (рекоменд.) или superpowers:executing-plans для выполнения плана по заданиям. Шаги отменяются по чекбоксам (`- [ ]`). Каждое задание самодостаточно: для работы нужны только это задание + раздел «Global Constraints» + секция «Контракты». Задачи можно раздавать разным сессиям (см. «Session map»).

**Goal:** Построить «фабрику сайтов» v1: monorepo, из которого один инстанс = один клиентский сайт (Nuxt SSR + Payload + Postgres), с блоками/темами, формами, админкой для клиента.

**Architecture:** pnpm-workspaces monorepo: `apps/web` (Nuxt — рендер сайтов), `apps/admin` (Payload — контент/админка), `packages/blocks-definitions` (единый источник: схемы блоков, варианты, темы, валидации). Инфра — `infra/` (compose, Caddy, Makefile). v2-совместимость: `site`-relation во всех коллекциях, префиксы медиа, `useSite()` как единая точка.

**Tech Stack:** pnpm, Node 22, Nuxt ≥4 (фолбэк ≥3.17), Vue 3, Payload 3 (Next 15), PostgreSQL 16, Caddy, Docker, Vitest, concurrently.

**Spec:** `docs/superpowers/specs/2026-09-21-siril-cms-design.md` (читать с планом обязательным для всех сессий).

## Global Constraints

- Только pnpm. Packages: `apps/web`, `apps/admin`, `packages/blocks-definitions`, `infra`. Корневые скрипты: `dev:pg`, `dev:all`, `seed`, `test`.
- TypeScript strict во всех packages. Никаких ES-комментарных TODO в коммитах (не-работающий код не коммитится).
- Все контент-коллекции (`pages`, `posts`, `categories`, `site-content`, `forms`, `form-submissions`, `media`) — с полем `site: relationship → sites` (v1: одна запись `site`, slug `default`).
- Имена медиа — с префиксом `<site>/` (hook в `beforeChange`).
- Палитра блоков scope'd по теме: админка и рендер видят только `paletteForTheme(theme)`.
- Добавление блока — БЕЗ DB-миграции (Payload Blocks хранят JSONB).
- Кэш страниц SSR — in-memory Map с TTL (не route-level swr) — см. T8.
- Тесты: Vitest (`vitest run`) в `packages/blocks-definitions` и `apps/web` (server utils). UI — manual smoke по критериям задания.
- После каждого задания: `pnpm test` (package в котором кайчил код) зелёный + git commit (conventional: `feat|fix|chore|test|docs: …`).
- Новые зависимости — только те, что названы в задании (`pnpm add`, через корень workspace).
- Секреты — только в `.env` (не коммитить). `.env.example` — коммитится.

## Контракты (единые типы — источник: T2)

Все задачи цитируют эти сигнатуры. Их реализация — в T2; изменение контракта — только с правкой T2 и всех ссылками.

```ts
// packages/blocks-definitions → import { … } from '@siril/blocks-definitions'

type BlockFieldType = 'text'|'email'|'richtext'|'number'|'boolean'|'select'|'image'|'link'|'array-text'|'image-array'|'object-array'|'page'|'form'
interface BlockField  { name: string; type: BlockFieldType; label: string; required?: boolean; placeholder?: string; options?: {value:string;label:string}[]; maxItems?: number; subfields?: BlockField[] }
interface BlockVariantDef { id: string; name: string; fields: BlockField[] }   // variants[0] = дефолт
interface BlockDef { type: string; name: string; description?: string; variants: BlockVariantDef[] }

interface ThemeBlockConfig { enabled: boolean; variants?: string[]; defaultVariant?: string }
interface ThemeDef { id: string; name: string; preview?: string; tokens: Record<string,string>; blocks: Record<string, ThemeBlockConfig> }

// registry
const BLOCKS: BlockDef[]; const THEMES: ThemeDef[]
getBlock(type: string): BlockDef | undefined; getTheme(id: string): ThemeDef  // неизвестный id → THEMES[0]

// resolve.ts
allowedVariants(theme: ThemeDef, block: BlockDef): string[]
resolveVariant(theme: ThemeDef, block: BlockDef, variantId: string|null|undefined): { variant: string; fallback: boolean }
paletteForTheme(theme: ThemeDef): BlockDef[]

// to-payload.ts
toPayloadField(f: BlockField): PayloadField
toPayloadBlockFields(def: BlockDef): PayloadField[]   // [select 'variant', …union полей с admin.dependencies]
toPayloadFormFields(): PayloadField[]                 // blocks-schema для forms.fields (10 типов полей)

// form-fields.ts
type FormFieldType = 'text'|'email'|'tel'|'textarea'|'select'|'checkbox'|'checkbox-group'|'date'|'file'|'consent'|'honeypot'
interface FormFieldDef { id: string; name: string; label: string; required: boolean; placeholder?: string; options?: string[] }
validateSubmission(fields: FormFieldDef[], values: Record<string, unknown>, files: Record<string, boolean>): { ok: true } | { ok: false; errors: string[] }
```

Форма данных блоковой секции в БД (страница):
`page.sections: [{ type: 'hero', variant: 'split', …поля }, …]` (Payload Blocks-поле, discriminator `type`).

## File Structure

```
SirilCMS/
├── pnpm-workspace.yaml
├── package.json                # корневые скрипты
├── .env.example
├── apps/
│   ├── web/                    # Nuxt (SSR) — рендер сайта
│   │   ├── nuxt.config.ts
│   │   ├── app.vue
│   │   ├── layouts/default.vue
│   │   ├── pages/index.vue , pages/[...slug].vue , pages/404.vue
│   │   ├── composables/use-site.ts
│   │   ├── server/utils/{payload.ts,page-cache.ts,notify.ts,validate-submission.ts}
│   │   ├── server/middleware/cache.ts
│   │   ├── server/api/{site.get.ts,posts.get.ts,purge.post.ts,health.get.ts,forms/[slug]/submit.post.ts}
│   │   ├── server/routes/{sitemap.xml.ts,robots.txt.ts}
│   │   ├── blocks/{registry.ts, <type>/<Variant>.vue}
│   │   └── themes/<theme-id>/{tokens.css,index.ts}
│   └── admin/                  # Payload 3 (Next 15)
│       ├── payload.config.ts , next.config.mjs
│       ├── src/collections/{sites,media,pages,posts,categories,site-content,forms,form-submissions}.ts
│       ├── src/access/{index.ts,site-scope.ts}
│       ├── src/globals/ — нет, всё в collections (site-content = collection, см. T4)
│       ├── src/scripts/seed.ts
│       ├── src/utils/publish-hook.ts
│       ├── src/admin-pages/{FormBuilder.tsx,Design.tsx}
│       └── src/endpoints/{design-preview.ts,submissions-csv.ts}
├── packages/blocks-definitions/
│   └── src/{types.ts,registry.ts,resolve.ts,to-payload.ts,form-fields.ts,index.ts}
└── infra/
    ├── compose.dev.yml , docker-compose.prod.yml , Caddyfile
    ├── Makefile , scripts/backup.sh
    └── docker/{web.Dockerfile,admin.Dockerfile}
```

## Session map (раздача задач по сессиям)

| Трек | Задачи (последовательность) | Пререквизиты |
|---|---|---|
| A — spine | T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 | — (последовательно) |
| B — blocks | T9 → T10 → T11 (параллельно, 3 сессии) → T12 | T8 |
| C — forms | T13 → T14 → T15 | T4 (можно старт, как только готов T5) |
| D — SEO | T18 | T7 |
| E — production | T17 | T8 |
| F — admin polish | T16 | T12 |

После T8 треки B/C/D/E идут параллельно в разных сессиях (независимые файлы; общий пакет `blocks-definitions` расширяется только T9–T12 — при конфликте merge: append-только в `BLOCKS`/`THEMES`).

---

## Task 1: Monorepo-каркас и dev-loop

**Files:**
- Create: `pnpm-workspace.yaml`, `package.json`, `.env.example`, `.gitignore`, `infra/compose.dev.yml`
- Create: `apps/web` (Nuxt), `apps/admin` (Next+Payload) — scaffold

**Interfaces:**
- Produces: рабочие `pnpm dev:all`, `pnpm dev:pg`, `pnpm test` (пустой прогон); postgres на `localhost:5432` (db `payload`, user/password `payload`/`dev`).

- [ ] **Step 1: Корень**

`pnpm-workspace.yaml`:
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

`package.json`:
```json
{
  "name": "siril-cms",
  "private": true,
  "scripts": {
    "dev:pg": "docker compose -f infra/compose.dev.yml up -d",
    "dev:all": "pnpm dev:pg && concurrently -n web,admin -c cyan,magenta \"pnpm --filter @siril/web dev\" \"pnpm --filter @siril/admin dev\"",
    "test": "pnpm -r --no-bail test"
  },
  "devDependencies": { "concurrently": "^9.0.0" }
}
```

`.env.example`:
```
PAYLOAD_SECRET=change-me-32-chars-min
PAYLOAD_DB_URI=postgresql://payload:dev@localhost:5432/payload
PAYLOAD_URL=http://localhost:3001
NUXT_PUBLIC_SITE_DOMAIN=localhost:3000
PURGE_TOKEN=dev-purge-token
```

`.gitignore`: `node_modules/.nuxt/.next/.output/.payload/dist/*.tsbuildinfo .env data/ backups/ pgdata/`

`infra/compose.dev.yml`:
```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: payload
      POSTGRES_USER: payload
      POSTGRES_PASSWORD: dev
    ports: ["5432:5432"]
    volumes: ["pgdata:/var/lib/postgresql/data"]
volumes:
  pgdata:
```

- [ ] **Step 2: Scaffold Nuxt**

```bash
cd apps && pnpm create nuxt@latest web --packageManager pnpm --gitInit false
cd web && pnpm install
pnpm add vitest
```
`apps/web/package.json`: name `@siril/web`, scripts: `"dev": "nuxt dev --port 3000"`, `"build": "nuxt build"`, `"start": "node .output/server/index.mjs"`, `"test": "vitest run"`.

- [ ] **Step 3: Scaffold Next+Payload**

```bash
cd apps && pnpm dlx create-next-app@latest admin --ts --app --no-tailwind --no-eslint --import-alias "@/*" --use-pnpm
cd admin && pnpm add payload @payloadcms/next @payloadcms/db-postgres concurrently vitest
```

`apps/admin/package.json` (name `@siril/admin`, scripts):
```json
{"dev": "concurrently -n next,payload \"next dev -p 3001\" \"payload build:watch\"", "build": "payload build && next build", "start": "next start -p 3001", "seed": "payload run src/scripts/seed.ts", "test": "vitest run"}
```

`apps/admin/payload.config.ts` (минимум, расширится в T3):
```ts
import path from 'path'
import { inlineAssetFunctions } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { connect } from '@payloadcms/db-postgres'
import { serveStatic } from '@payloadcms/next'
import config from '@payloadcms/next'

import { plugins: [ ... ] } = ... // нет
```
(не копировать предыдущее!) Точный минимальный конфиг:
```ts
import path from 'path'
import { getPayload } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import config from '@payloadcms/next'

export default {
  typescript: { outputFile: path.resolve(process.cwd(), 'src/payload-types.ts') },
  db: postgresAdapter({ connection: { connectionString: process.env.PAYLOAD_DB_URI } }),
  secret: process.env.PAYLOAD_SECRET ?? 'dev-secret',
  express: (app) => { app.use('/media', serveStatic(path.resolve(process.cwd(), 'media'))) },
  serverURL: process.env.PAYLOAD_URL,
  logLevel: 'info',
}
```
`next.config.mjs`:
```js
import withPayload from '@payloadcms/next'
const nextConfig = {}
export default withPayload(nextConfig)
```
Убрать `export default withPayload` из `create-next-app`-плейсхолдеров; app страница — заглушка «Admin».

- [ ] **Step 4: Копия env и запуск**

```bash
cp .env.example .env
pnpm i && pnpm dev:all
```

Run: открой `http://localhost:3000` (Nuxt hello) и `http://localhost:3001` (Next/Payload, без коллекций).
Expected: оба поднялись; pg в docker (`docker ps`).

- [ ] **Step 5: Коммит**

```bash
git add -A && git commit -m "chore: monorepo scaffold (pnpm, nuxt, payload, dev compose)"
```

Acceptance: `pnpm dev:all` с нуля (свежий clone) поднимает pg + web + admin; `pnpm test` не падает.

---

## Task 2: Пакет blocks-definitions — типы, registry, resolve, to-payload

**Files:**
- Create: `packages/blocks-definitions/package.json`, `src/types.ts`, `src/registry.ts`, `src/resolve.ts`, `src/to-payload.ts`, `src/form-fields.ts`, `src/index.ts`, `src/resolve.test.ts`, `src/to-payload.test.ts`, `src/form-fields.test.ts`
- Modify: `pnpm-workspace.yaml` — не меняем (packages/* уже покрыты)

**Interfaces:**
- Consumes: ничего (новый пакет)
- Produces: ВСЁ из раздела «Контракты» (импорт `@siril/blocks-definitions`). В `BLOCKS` — пусто (заполняется T9–T11), в `THEMES` — один `defaultTheme` (все будущие блоки включены — генерится из BLOCKS; см. код).

- [ ] **Step 1: Пакет**

`packages/blocks-definitions/package.json`:
```json
{
  "name": "@siril/blocks-definitions",
  "version": "0.0.1",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": { "test": "vitest run" },
  "devDependencies": { "typescript": "^5.6.0", "vitest": "^3.0.0" }
}
```
(Точка входа — TS-исходник: Nuxt/Next транспилируют импорт; build-шагов нет.)

- [ ] **Step 2: Написать FAILING-тесты**

`src/resolve.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { resolveVariant, allowedVariants, paletteForTheme } from './resolve'
import type { BlockDef, ThemeDef } from './types'

const block: BlockDef = { type: 'hero', name: 'Hero', variants: [
  { id: 'default', name: 'Default', fields: [{ name: 'title', type: 'text', label: 'Т' }] },
  { id: 'split', name: 'Split', fields: [{ name: 'title', type: 'text', label: 'Т' }, { name: 'image', type: 'image', label: 'I' }] },
]}
const theme: ThemeDef = {
  id: 't', name: 'T', tokens: { '--c-primary': '#000' },
  blocks: { hero: { enabled: true, variants: ['default'], defaultVariant: 'default' } },
}

it('вернёт сохранённый вариант если он допущен темой', () => {
  expect(resolveVariant(theme, block, 'default')).toEqual({ variant: 'default', fallback: false })
})
it('фолбэк на defaultVariant если вариант недоступен', () => {
  expect(resolveVariant(theme, block, 'split')).toEqual({ variant: 'default', fallback: true })
})
it('пустые allowed → fallback true', () => {
  const t2: ThemeDef = { ...theme, blocks: { hero: { enabled: true, variants: [] } } }
  expect(allowedVariants(t2, block)).toEqual(['default'])
})
it('paletteForTheme фильтрует disabled', () => {
  const t3: ThemeDef = { ...theme, blocks: { hero: { enabled: false } } }
  expect(paletteForTheme(t3).map(b => b.type)).not.toContain('hero')
})
```

`src/to-payload.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { toPayloadBlockFields } from './to-payload'
import type { BlockDef } from './types'

const block: BlockDef = { type: 'hero', name: 'Hero', variants: [
  { id: 'default', name: 'Default', fields: [{ name: 'title', type: 'text', label: 'Т' }, { name: 'caption', type: 'text', label: 'С' }] },
  { id: 'split', name: 'Split', fields: [{ name: 'title', type: 'text', label: 'Т' }, { name: 'image', type: 'image', label: 'I' }] },
]}

it('первый элемент — select variant', () => {
  const fields = toPayloadBlockFields(block)
  expect(fields[0]).toMatchObject({ type: 'select', name: 'variant', options: [{ value: 'default', label: 'Default' }, { value: 'split', label: 'Split' }] })
})
it('union полей с зависимостью от variant', () => {
  const fields = toPayloadBlockFields(block)
  const image = fields.find(f => f.name === 'image')
  expect(image?.admin?.dependencies?.variant?.in).toEqual(['split'])
})
```

- [ ] **Step 3: Запуск — тесты падают**

Run: `pnpm --filter @siril/blocks-definitions test`
Expected: FAIL (модули не существуют).

- [ ] **Step 4: Реализация**

`src/types.ts` — ровно как в «Контракты».
`src/registry.ts`:
```ts
import type { BlockDef, ThemeDef } from './types'
// Заполняется в T9–T12 (append-only). Точка расширения — только этот файл.
export const BLOCKS: BlockDef[] = []
const defaultThemeFrom = (blocks: BlockDef[]): ThemeDef => ({
  id: 'default', name: 'Default', tokens: { '--c-primary': '#0f766e' },
  blocks: Object.fromEntries(blocks.map(b => [b.type, { enabled: true }] as [string, never])),
} as ThemeDef)
export const THEMES: ThemeDef[] = [defaultThemeFrom(BLOCKS)]
export const getBlock = (type: string) => BLOCKS.find(b => b.type === type)
export const getTheme = (id: string) => THEMES.find(t => t.id === id) ?? THEMES[0]
```
`src/resolve.ts`:
```ts
import { BLOCKS } from './registry'
import type { BlockDef, ThemeDef } from './types'

export function allowedVariants(theme: ThemeDef, block: BlockDef): string[] {
  const cfg = theme.blocks[block.type]
  const all = block.variants.map(v => v.id)
  if (!cfg) return [all[0]]
  const set = cfg.variants ?? all
  return set.length ? set.filter(id => all.includes(id)) : [all[0]]
}

export function resolveVariant(theme: ThemeDef, block: BlockDef, variantId: string | null | undefined): { variant: string; fallback: boolean } {
  const cfg = theme.blocks[block.type]
  const allowed = allowedVariants(theme, block)
  const preferred = cfg?.defaultVariant ?? block.variants[0].id
  const firstOk = allowed.includes(preferred) ? preferred : allowed[0]
  if (!cfg?.enabled) return { variant: firstOk, fallback: true }
  if (variantId && allowed.includes(variantId)) return { variant: variantId, fallback: false }
  return { variant: firstOk, fallback: true }
}

export function paletteForTheme(theme: ThemeDef) {
  return BLOCKS.filter(b => theme.blocks[b.type]?.enabled)
}
```
`src/to-payload.ts`:
```ts
import type { BlockDef, BlockField, PayloadField } from './types'

const TYPE_MAP: Record<BlockField['type'], string> = {
  text: 'text', email: 'email', richtext: 'richText', number: 'number',
  boolean: 'checkbox', select: 'select', image: 'upload', link: 'text',
  'array-text': 'array', 'object-array': 'array', 'image-array': 'upload',
  page: 'relationship', form: 'relationship',
}

export function toPayloadField(f: BlockField): PayloadField {
  const base: PayloadField = { name: f.name, type: TYPE_MAP[f.type], label: f.label, required: !!f.required }
  if (f.type === 'select') base.options = f.options
  if (f.type === 'richtext') base.editor = 'true'
  if (f.type === 'image') { base.relationTo = 'media'; base.multiple = false }
  if (f.type === 'page') base.relationTo = 'pages'
  if (f.type === 'form') base.relationTo = 'forms'
  if (f.type === 'array-text') {
    base.fields = [{ name: 'value', type: 'text', label: f.label }]
    base.maxRows = f.maxItems
  }
  if (f.type === 'object-array') { base.fields = (f.subfields ?? []).map(toPayloadField); base.maxRows = f.maxItems }
  if (f.type === 'image-array') { base.relationTo = 'media'; base.hasMany = true }
  return base
}

export function toPayloadBlockFields(def: BlockDef): PayloadField[] {
  const all = def.variants.flatMap(v => v.fields)
  const union = [...new Map(all.map(f => [f.name, f])).values()]
  const fields = union.map(f => {
    const owners = def.variants.filter(v => v.fields.some(x => x.name === f.name)).map(v => v.id)
    return { ...toPayloadField(f), admin: { dependencies: { variant: { in: owners } } } }
  })
  const variant = {
    type: 'select', name: 'variant', label: 'Вариант',
    options: def.variants.map(v => ({ value: v.id, label: v.name })),
    defaultValue: def.variants[0].id,
  }
  return [variant, ...fields]
}
```
(Добавить в `types.ts`: `interface PayloadField { [key: string]: unknown }`.)

`src/form-fields.ts` (валидация + список типов для билдера):
```ts
import type { FormFieldDef } from './form-fields'
export type FormFieldType = 'text'|'email'|'tel'|'textarea'|'select'|'checkbox'|'checkbox-group'|'date'|'file'|'consent'|'honeypot'
export interface FormFieldDef { id: string; name: string; label: string; required: boolean; placeholder?: string; options?: string[] }
export const FORM_FIELD_TYPES: FormFieldType[] = ['text','email','tel','textarea','select','checkbox','checkbox-group','date','file','consent','honeypot']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateSubmission(fields: FormFieldDef[], values: Record<string, unknown>, files: Record<string, boolean>): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = []
  for (const f of fields) {
    if (f.type === 'honeypot') continue
    const v = values[f.name]
    const empty = v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)
    if (f.required && empty) { errors.push(`${f.label} — обязательно`); continue }
    if (empty) continue
    if (f.type === 'email' && !EMAIL_RE.test(String(v))) errors.push(`${f.label} — неверный email`)
    if (f.type === 'tel' && String(v).replace(/[^\d]/g, '').length < 6) errors.push(`${f.label} — неверный телефон`)
    if (f.type === 'date' && isNaN(Date.parse(String(v))) && String(v).length === 0) errors.push(`${f.label} — неверная дата`)
    if (f.type === 'file' && !files[f.name]) errors.push(`${f.label} — файл не найден`)
    if (f.type === 'consent' && v !== true && v !== 'on' && String(v) !== 'true') errors.push(`${f.label} — подтвердите`)
  }
  return errors.length ? { ok: false, errors } : { ok: true }
}
```

`src/index.ts`:
```ts
export * from './types'
export * from './registry'
export * from './resolve'
export * from './to-payload'
export * from './form-fields'
```

- [ ] **Step 5: Тесты зелёные**

Run: `pnpm --filter @siril/blocks-definitions test` — PASS.

- [ ] **Step 6: Коммит**

```bash
git add -A && git commit -m "feat(bd): blocks-definitions package (types, registry, resolve, payload schema gen)"
```

Acceptance: 6+ тестов зелёные; пакет импортируется из любой ts-сессии в workspace.

---

## Task 3: Payload — коллекции sites/media, роли, access, префикс медиа

**Files:**
- Create: `apps/admin/src/collections/sites.ts`, `apps/admin/src/collections/media.ts`, `apps/admin/src/access/{index.ts,site-scope.ts}`, `apps/admin/src/access.test.ts` (vitest)
- Modify: `apps/admin/payload.config.ts` (collections), `apps/admin/package.json` (dependency `uuid` не нужен)

**Interfaces:**
- Consumes: T1 (payload.app)
- Produces:
  - коллекция `sites`: `{ id, name, slug, domain, locale, theme, contacts: {email,phone,telegram}, settings: {smtpHost,smtpPort,smtpUser,smtpPass,analyticsId}, logo: media }`
  - коллекция `media`: uploads, `filename` = `<site>/…` (hook)
  - `src/access`: `isOwner(user)`, `siteScoped` (fn для access), роли: `owner` (superuser), `editor` (клиент)
  - пользователи: `users` (штатная), поле `role: 'owner'|'editor'`, `site: relationship → sites` (для editor)

- [ ] **Step 1: Access-хелперы + тест**

`src/access/site-scope.ts`:
```ts
export type Role = 'owner' | 'editor'
export const isOwner = (u: { role?: Role } | null | undefined) => u?.role === 'owner'
/** true, если user видит записи с данным siteId */
export const canScope = (u: { role?: Role; site?: number | { id?: number } } | null | undefined, siteId: number | null | undefined) =>
  !!u && (isOwner(u) || (u.site ? (u.site as any).id ?? u.site as number : null) === siteId)
```
`src/access.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { canScope, isOwner } from './access/site-scope'
it('owner видит всё', () => { expect(canScope({ role: 'owner' }, 1)).toBe(true) })
it('editor — только свой сайт', () => { expect(canScope({ role: 'editor', site: 1 }, 1)).toBe(true); expect(canScope({ role: 'editor', site: 1 }, 2)).toBe(false) })
it('null — нет', () => { expect(canScope(null, 1)).toBe(false) })
```

- [ ] **Step 2: Коллекция sites**

`src/collections/sites.ts`:
```ts
import type { CollectionConfig } from 'payload'
import { isOwner } from '../access/site-scope'

export const Sites: CollectionConfig = {
  slug: 'sites',
  admin: { description: 'Настройки сайта (v1: одна запись)' },
  defaultTeam: 'owner', // нет
  access: {
    read:    ({ req: { user } }) => isOwner(user) || !!user,
    create:  ({ req: { user } }) => isOwner(user),
    update:  ({ req: { user } }) => isOwner(user),
    delete:  ({ req: { user } }) => isOwner(user),
    readUsers: ({ req: { user } }) => isOwner(user),
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', unique: true, defaultValue: 'default', admin: { position: 'sidebar' } },
    { name: 'domain', type: 'text' },
    { name: 'locale', type: 'text', defaultValue: 'ru' },
    { name: 'theme', type: 'select', options: [{ value: 'default', label: 'Default' }], defaultValue: 'default' },
    { name: 'contacts', type: 'group', fields: [
      { name: 'email', type: 'email' }, { name: 'phone', type: 'text' }, { name: 'telegram', type: 'text' },
    ] },
    { name: 'settings', type: 'group', fields: [
      { name: 'smtpHost', type: 'text' }, { name: 'smtpPort', type: 'number' },
      { name: 'smtpUser', type: 'text' }, { name: 'smtpPass', type: 'text' },
      { name: 'analyticsId', type: 'text' },
    ] },
    { name: 'logo', type: 'upload', relationTo: 'media' },
  ],
  versions: false,
}
```
(Убрать строки `defaultTeam`/`readUsers`, если типы жалуются — оставить минимальный набор access: read/create/update/delete.) `theme` options в T12 расширяется из `THEMES.map(t => ({value: t.id, label: t.name}))`.

- [ ] **Step 3: Медиа с префиксом сайта**

`src/collections/media.ts`:
```ts
import path from 'path'
import type { CollectionConfig } from 'payload'
import { isOwner } from '../access/site-scope'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,               // публичный сайт отдаёт картинки
    readVersions: () => false,
    create: ({ req: { user } }) => isOwner(user) || !!user,
    update: ({ req: { user } }) => isOwner(user),
    delete: ({ req: { user } }) => isOwner(user),
  },
  admin: { defaultColumns: ['name', 'alt'] },
  upload: {
    staticURL: '/media',
    staticDir: path.resolve(process.cwd(), 'media'),
    mimeTypes: ['image/*', 'video/mp4', 'application/pdf'],
    adminThumbnail: true,
  },
  fields: [
    { name: 'site', type: 'relationship', relationTo: 'sites', required: true },
    { name: 'alt', type: 'text' },
    { name: 'caption', type: 'text' },
  ],
  hooks: {
    beforeChange: [async ({ data }) => {
      // префикс <site>/ — v2-ready
      const site = (data as any)?.site
      const siteId = site ? (typeof site === 'object' ? site.id : site) : 'default'
      const f = (data as any)?.filename
      if (f && !String(f).startsWith(`${siteId}/`)) (data as any).filename = `${siteId}/${f}`
      return data
    }],
  },
}
```

- [ ] **Step 4: Подключение к config + роли users**

`payload.config.ts`: добавить `import { Media } …`, `import { Sites } …`; `collections: [Sites, Media, Users(штатный users-collection с полем role + site)]`.
Расширить штатную коллекцию `users` (в Payload 3 — `import { Users } from 'payload'` не экспортируется готовой — собрать):
```ts
// src/collections/users.ts
import type { CollectionConfig } from 'payload'
import { isOwner } from '../access/site-scope'
export const Users: CollectionConfig = {
  slug: 'users',
  admin: { group: 'Authentication', hidden: true },
  access: { read: () => isOwner((globalThis as any).__u ?? null), create: () => isOwner((globalThis as any).__u ?? null), update: ({req:{user}}) => isOwner(user) || !!user, delete: () => isOwner((globalThis as any).__u ?? null) },
  fields: [
    { name: 'name', type: 'text' },
    { name: 'role', type: 'select', options: [{ value: 'owner', label: 'Владелец' }, { value: 'editor', label: 'Клиент' }], defaultValue: 'editor' },
    { name: 'site', type: 'relationship', relationTo: 'sites' },
  ],
}
```
(Упростить access.users: read/create/delete — owner; update — все.)

- [ ] **Step 5: Run + smoke**

Run: `pnpm --filter @siril/admin test` (access-тесты) — PASS.
Run: `pnpm dev:all` → в админке: создай Site (name Demo, slug default); создай admin-пользователь (role owner) + upload картинки (filename в БД = `1/<…>`).
Expected: файл в `apps/admin/media/1/…`.

- [ ] **Step 6: Коммит**

```bash
git add -A && git commit -m "feat(admin): sites+media collections, roles, site-scoped access, media prefix"
```

---

## Task 4: Контентные коллекции — pages/posts/categories/site-content, drafts

**Files:**
- Create: `apps/admin/src/collections/{pages,posts,categories,site-content,post-categories? no}.ts` — конкретные: `pages.ts`, `posts.ts`, `categories.ts`, `site-content.ts`
- Modify: `apps/admin/payload.config.ts`, `packages/blocks-definitions/src/registry.ts` (не трогать — blocks появятся в T9, pages используют `toPayloadBlockFields` от BLOCKS)

**Interfaces:**
- Produces:
  - `pages`: `title, slug(unique), site, locale, sections: Block (из toPayloadBlockFields по BLOCKS), seo: {title, description, ogImage(media), canonical, noindex(checkbox)}`
  - `posts`: `title, slug, site, locale, excerpt, body(richText), cover(media), category(rel cats), seo(то же)`
  - `categories`: `name, slug, site`
  - `site-content`: `site(unique), navigation: Row[{label, page(rel pages), externalUrl}], footer: {text, social: array-text, email, phone, telegram}`
  - versioning: pages+posts — drafts (payload versioning в `versions: { drafts: true }`)

- [ ] **Step 1: pages.ts**

```ts
import type { CollectionConfig } from 'payload'
import { toPayloadBlockFields } from '@siril/blocks-definitions'
import { BLOCKS } from '@siril/blocks-definitions'
import { canScope } from '../access/site-scope'

const seo = (fieldsName = 'seo'): any => ({
  name: fieldsName, type: 'group', label: 'SEO', fields: [
    { name: 'title', type: 'text', label: 'Title' },
    { name: 'description', type: 'textarea', label: 'Description' },
    { name: 'ogImage', type: 'upload', relationTo: 'media' },
    { name: 'canonical', type: 'text' },
    { name: 'noindex', type: 'checkbox' },
  ],
})

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: { defaultColumns: ['title', 'slug', 'site'] },
  access: {
    read: ({ req: { user }, data }) => canScope(user, data?.site ?? 1),
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  versions: { drafts: true },
  fields: [
    { name: 'site', type: 'relationship', relationTo: 'sites', required: true },
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', unique: true },
    { name: 'locale', type: 'text', defaultValue: 'ru' },
    { name: 'sections', type: 'blocks', blocks: Object.fromEntries(BLOCKS.map(def => [def.type, { fields: toPayloadBlockFields(def) }])) },
    seo(),
  ],
}
```

- [ ] **Step 2: posts.ts, categories.ts, site-content.ts**

```ts
// posts.ts — аналог Pages без sections; + { name: 'body', type: 'richText', editor: 'true' },
// { name: 'excerpt', type: 'textarea' }, { name: 'cover', type: 'upload', relationTo: 'media' },
// { name: 'category', type: 'relationship', relationTo: 'categories' }
// versions: { drafts: true }; access — как Pages (canScope)
```
```ts
// categories.ts
export const Categories: CollectionConfig = {
  slug: 'categories',
  access: { read: ({req:{user}}) => !!user, create: ({req:{user}}) => !!user, update: ({req:{user}}) => !!user, delete: ({req:{user}}) => !!user },
  fields: [
    { name: 'site', type: 'relationship', relationTo: 'sites', required: true },
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', unique: true },
  ],
}
```
```ts
// site-content.ts
export const SiteContent: CollectionConfig = {
  slug: 'site-content',
  access: { read: ({req:{user}}) => !!user, update: ({req:{user}}) => !!user, create: ({req:{user}}) => !!user, delete: ({req:{user}}) => !!user },
  fields: [
    { name: 'site', type: 'relationship', relationTo: 'sites', required: true, unique: true, index: true },
    {
      name: 'navigation', type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'page', type: 'relationship', relationTo: 'pages' },
        { name: 'externalUrl', type: 'text' },
      ],
    },
    { name: 'footer', type: 'group', fields: [
      { name: 'text', type: 'textarea' },
      { name: 'social', type: 'array', fields: [{ name: 'value', type: 'text', label: 'Ссылка' }] },
      { name: 'email', type: 'email' }, { name: 'phone', type: 'text' }, { name: 'telegram', type: 'text' },
    ] },
  ],
}
```

- [ ] **Step 3: Подключение + smoke**

Добавить 4 коллекции в `collections[]` config.
Run: `pnpm dev:all` → создай Page (sections пока не виден, т.к. BLOCKS пуст — пустой массив допустим), Post, Category, Site-content (nav из 2 ссылок на созданные страницы).
Expected: CRUD работает; drafts: у pages/posts есть «Draft/Publish» UI.

- [ ] **Step 4: Коммит**

```bash
git add -A && git commit -m "feat(admin): pages/posts/categories/site-content with drafts and nav"
```

Acceptance: в админке созданы все сущности; draft→publish на page работает.

---

## Task 5: Seed-скрипт (идемпотентный)

**Files:**
- Create: `apps/admin/src/scripts/seed.ts`

**Interfaces:**
- Consumes: T3–T4 коллекции
- Produces: `pnpm seed` (и `pnpm --filter @siril/admin seed`): создаёт idempotently — site(default), 4 страницы (hero/текст/faq), 3 поста, 3 категории, site-content(меню из 4 страниц), пользователей owner+editor (email из env `SEED_ADMIN_LOGIN/SEED_ADMIN_PASS`, default owner@demo.ru / admin123).

- [ ] **Step 1: Реализация**

```ts
import type { Payload } from 'payload'
import config from '../payload.config'

export default async (payload: Payload) => {
  const { total } = await payload.find({ collection: 'sites', limit: 1, pagination: true })
  if (total > 0) { console.log('seed: skip (site exists)'); return }
  console.log('seed: creating…')

  const site = await payload.create({ collection: 'sites', data: { name: 'Demo', slug: 'default', domain: process.env.NUXT_PUBLIC_SITE_DOMAIN ?? 'localhost:3000', theme: 'default' } })

  const home = await payload.create({ collection: 'pages', data: { site: site.id, title: 'Главная', slug: 'home', sections: [] } })
  const about  = await payload.create({ collection: 'pages', data: { site: site.id, title: 'О проекте',  slug: 'about', sections: [] } })
  const contact= await payload.create({ collection: 'pages', data: { site: site.id, title: 'Контакты',   slug: 'contact', sections: [] } })
  const services = await payload.create({ collection: 'pages', data: { site: site.id, title: 'Услуги',    slug: 'services', sections: [] } })

  const cats = (['Новости','Продукты','Записи'] as const).map(n => ({ site: site.id, name: n, slug: n.toLowerCase() }))
  await Promise.all(cats.map(c => payload.create({ collection: 'categories', data: c })))

  for (let i = 1; i <= 3; i++) {
    await payload.create({ collection: 'posts', data: { site: site.id, title: `Пост ${i}`, slug: `post-${i}`, body: 'Текст поста…', category: null } })
  }

  await payload.create({ collection: 'site-content', data: { site: site.id, navigation: [
    { label: 'Главная', page: home.id }, { label: 'Услуги', page: services.id },
    { label: 'О проекте', page: about.id }, { label: 'Контакты', page: contact.id },
  ] } })

  await payload.create({ collection: 'users', data: { email: process.env.SEED_ADMIN_LOGIN ?? 'owner@demo.ru', password: process.env.SEED_ADMIN_PASS ?? 'admin123', role: 'owner', name: 'Owner' } } as any)
  await payload.create({ collection: 'users', data: { email: 'editor@demo.ru', password: 'editor123', role: 'editor', site: site.id, name: 'Editor' } } as any)

  console.log('seed: done. owner@demo.ru / admin123, editor@demo.ru / editor123')
}
```

- [ ] **Step 2: Run**

Run: `pnpm seed` (при пустой БД). Снова `pnpm seed` — skip.
Expected: данные в админке; повторный запуск «skip».

- [ ] **Step 3: Коммит** — `git add -A && git commit -m "feat(admin): idempotent demo seed"`

---

## Task 6: Nuxt — useSite, layout (меню/футер), 404

**Files:**
- Create: `apps/web/server/utils/payload.ts`, `apps/web/server/api/site.get.ts`, `apps/web/composables/use-site.ts`, `apps/web/layouts/default.vue`, `apps/web/pages/404.vue`
- Modify: `apps/web/nuxt.config.ts`, `apps/web/app.vue`, `apps/web/package.json` (name + scripts уже в T1; add `server`-зависимости: нет)

**Interfaces:**
- Consumes: T5 (данные), T1 (Nuxt)
- Produces:
  - `server/utils/payload.ts`: `payloadGet<T>(path: string): Promise<T>` (fetch `${PAYLOAD_URL}/api/${path}`, без авторизации — публичные коллекции)
  - `composables/use-site(): Promise<{ site: any; content: any }>` (useAsyncData ключ `site`, ttl 30s)
  - Layout: nav из `content.navigation` (страницы → `/slug`, external — как есть), футер из `content.footer`
  - 404-страница

- [ ] **Step 1: nuxt.config**

```ts
export default defineNuxtConfig({
  ssr: true,
  compatibilityDate: '2026-01-01',
  modules: ['@nuxtjs/seo'], // нет — без модулей, useSeoMeta встроенный
  runtimeConfig: {
    PAYLOAD_URL: process.env.PAYLOAD_URL ?? 'http://localhost:3001',
    SITE_DOMAIN: process.env.NUXT_PUBLIC_SITE_DOMAIN ?? 'localhost:3000',
    PURGE_TOKEN: process.env.PURGE_TOKEN ?? 'dev-purge-token',
  },
  build: { transpile: ['@siril/blocks-definitions'] },
})
```
(Без `modules` — `useSeoMeta` доступен нативно. `transpile` — чтобы TS-пакет компилировался.) Добавить зависимость: `pnpm --filter @siril/web add @siril/blocks-definitions@workspace:0.0.1`? pnpm workspace-протокол: `@siril/blocks-definitions: workspace:*`? Для TS-only пакета — `"@siril/blocks-definitions": "*"` с workspaces resolution → pnpm подхватит локальный. Записать в web/package.json: `"dependencies": { "@siril/blocks-definitions": "*" }`.

- [ ] **Step 2: API сайта**

`server/utils/payload.ts`:
```ts
export async function payloadGet<T>(path: string): Promise<T> {
  const { PAYLOAD_URL } = useRuntimeConfig()
  return $fetch<T>(`${PAYLOAD_URL}/api/${path}`)
}
```
`server/api/site.get.ts`:
```ts
import { payloadGet } from '../utils/payload'
let cache: { at: number; data: unknown } | null = null
export default defineEventHandler(async (event) => {
  if (cache && Date.now() - cache.at < 30_000) return cache.data
  const [sites, contents] = await Promise.all([
    payloadGet<{ docs: any[] }>('sites?limit=1'),
    payloadGet<{ docs: any[] }>('site-content?limit=1'),
  ])
  const data = { site: sites.docs[0] ?? null, content: contents.docs[0] ?? null }
  cache = { at: Date.now(), data }
  return data
})
```

- [ ] **Step 3: Layout**

`composables/use-site.ts`:
```ts
export const useSite = () =>
  useAsyncData<{ site: any; content: any }>('site', () => $fetch('/api/site'), { server: true })
```
`layouts/default.vue`:
```vue
<template>
  <div class="app">
    <header class="site-header">
      <nav>
        <a v-for="it in nav" :key="it.label" :href="href(it)">{{ it.label }}</a>
      </nav>
    </header>
    <main class="site-main"><slot /></main>
    <footer class="site-footer"><NuxtLoadingIndicator v-if="false" /><div v-html="footerText"></div></footer>
  </div>
</template>
<script setup lang="ts">
const { data } = await useSite()
const nav = computed(() => data.value?.content?.navigation ?? [])
const footerText = computed(() => data.value?.content?.footer?.text ?? '')
const href = (it: any) => it.externalUrl ? it.externalUrl : it.page ? `/${it.page.slug}` : '/'
</script>
<style>
:root { color-scheme: light; }
body { margin: 0; font-family: system-ui, sans-serif; }
.site-header nav { display: flex; gap: 1rem; padding: 1rem 2rem; border-bottom: 1px solid #e5e7eb; }
.site-main { padding: 2rem; min-height: 50vh; }
.site-footer { padding: 2rem; border-top: 1px solid #e5e7eb; color: #6b7280; }
a { text-decoration: none; }
</style>
```
(`NuxtLoadingIndicator` убрать — нет.) `app.vue`:
```vue
<template><NuxtLayout><NuxtPage /></NuxtLayout></template>
```

- [ ] **Step 4: 404**

`pages/404.vue`: `<template><div class="notfound"><h1>404</h1><p>Страница не найдена. <NuxtLink to="/">На главную</NuxtLink></p></div></template>`

- [ ] **Step 5: Run + smoke**

Run: `pnpm dev:all` → `http://localhost:3000`: меню (4 пункта из seed), футер.
В Payload: поменяй название пункта меню → refresh (каш 30s) → изменилось.
Expected: работает; неизвестный URL → 404-страница.

- [ ] **Step 6: Коммит** — `git add -A && git commit -m "feat(web): site api, layout with nav/footer, 404"`

---

## Task 7: Рендер страниц — catchall-роут + BlockRenderer + registry

**Files:**
- Create: `apps/web/pages/index.vue`, `apps/web/pages/[...slug].vue`, `apps/web/blocks/registry.ts`, `apps/web/components/BlockRenderer.vue`, `apps/web/blocks/index.vue` (плейсхолдер)
- Modify: `apps/web/app.vue` — не менять

**Interfaces:**
- Consumes: T6 (use-site, payloadGet), T2 (resolveVariant)
- Produces:
  - `blocks/registry.ts`: `getBlockComponent(type: string, variant: string): Component` (динамический импорт `../blocks/${type}/${pascal(variant)}.vue`, фолбэк — `Placeholder.vue`)
  - `<BlockRenderer :site :block />`: определяет вариант через `resolveVariant`, рендерит компонент, пробрасывает `block` (данные) и `tokens` темы
  - `pages/index.vue` + `pages/[...slug].vue`: page по slug (empty → home), рендер `page.sections` через BlockRenderer, useSeoMeta из `page.seo`

- [ ] **Step 1: Registry + Renderer**

`blocks/registry.ts`:
```ts
import type { Component } from 'vue'
const Placeholder = () => import('./Placeholder.vue')
const pascal = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
export function getBlockComponent(type: string, variant: string): Component {
  const loader = () => import(`../blocks/${type}/${pascal(variant)}.vue`)
  // eslint-disable-next-line
  return lazy(() => loader().catch(() => import('./Placeholder.vue')))
}
```
`blocks/Placeholder.vue`:
```vue
<template><div class="block-placeholder" data-fallback="true">[{{ $props.block?.type }} / {{ $props.block?.variant }}]</div></template>
<script setup lang="ts">defineProps<{ block: any }>()</script>
<style>.block-placeholder{border:1px dashed #ccc;color:#888;padding:1rem;border-radius:.5rem;margin:1rem 0}</style>
```

`components/BlockRenderer.vue`:
```vue
<template>
  <component :is="resolved" :block="block" :theme-id="themeId" />
</template>
<script setup lang="ts">
import { resolveVariant } from '@siril/blocks-definitions'
import { getBlock, getTheme } from '@siril/blocks-definitions'
import { getBlockComponent } from '../blocks/registry'
const props = defineProps<{ block: any; themeId: string }>()
const def = getBlock(props.block.type)
const r = resolveVariant(getTheme(props.themeId), def ?? { type: props.block.type, name: props.block.type, variants: [{ id: 'default', name: 'Default', fields: [] }] }, props.block.variant)
const resolved = getBlockComponent(props.block.type, r.variant)
</script>
```

- [ ] **Step 2: Роуты**

`server/utils/page.ts`? — нет, прямо в роутах:

`pages/[...slug].vue`:
```vue
<template>
  <div v-if="page">
    <BlockRenderer v-for="b in page.sections" :key="b._id" :block="b" :theme-id="themeId" />
    <div v-if="!page.seo" style="display:none"></div>
  </div>
</template>
<script setup lang="ts">
import { payloadGet } from '../server/utils/payload'
const route = useRoute()
const slug = route.params.slug as string | undefined
const { data: siteData } = await useSite()
const themeId = siteData.value?.site?.theme ?? 'default'
if (!slug) {
  throw createError({ statusCode: 404 })
}
const pages = await payloadGet<{ docs: any[] }>(`pages?where[slug][equals]=${encodeURIComponent(slug)}&depth=1`)
const page = pages.docs[0]
if (!page) throw createError({ statusCode: 404, message: 'Not found' })
useHead({ title: page.seo?.title ?? page.title, htmlAttrs: { lang: 'ru' } })
if (page.seo) {
  useSeoMeta({
    title: page.seo.title || page.title,
    description: page.seo.description,
    ogImage: page.seo.ogImage ? `http://${siteData.value!.site.domain}/media/${page.seo.ogImage}` : undefined,
    canonical: page.seo.canonical || `http://${siteData.value!.site.domain}/${slug}`,
  })
  if (page.seo.noindex) useHead({ script: [{ innerHTML: '<meta name="robots" content="noindex">' }] })
}
</script>
```
`pages/index.vue`:
```vue
<script setup lang="ts">
const { data: pagesAll } = await useAsyncData('home-page', async () => {
  const { payloadGet } = await import('../server/utils/payload')
  const r = await payloadGet<{ docs: any[] }>('pages?where[slug][equals]=home&depth=1')
  return r.docs[0] ?? null
})
if (!pagesAll.value) throw createError({ statusCode: 404, message: 'Home not found' })
</script>
<template><BlockRenderer v-for="b in pagesAll?.sections ?? []" :key="b._id" :block="b" :theme-id="themeId" /><div v-if="!pagesAll" /></template>
<script setup lang="ts" src=""></script>
```
(Убрать второй `<script setup>` — слить в один.)

- [ ] **Step 3: Smoke**

В Payload: добавь странице `home` блок (BLOCKS пока пуст → sections остаётся []; placeholder не появится).
Run: `http://localhost:3000` → home renderится (пустой), `/about` → пустой, `/nope` → 404.
Expected: роутинг работает. (Настоящие блоки — T9.)

- [ ] **Step 4: Коммит** — `git add -A && git commit -m "feat(web): catchall page route + BlockRenderer + registry"`

---

## Task 8: SSR-кэш (in-memory TTL) + purge + webhook

**Files:**
- Create: `apps/web/server/utils/page-cache.ts`, `apps/web/server/middleware/cache.ts`, `apps/web/server/api/purge.post.ts`, `apps/web/server/api/health.get.ts`, `apps/web/server/utils/page-cache.test.ts`, `apps/admin/src/utils/publish-hook.ts`
- Modify: `apps/admin/src/collections/{pages,posts}.ts` (afterChange), `apps/admin/payload.config.ts`? (hooks в collection-config — уже в collections), `.env.example` — уже есть PURGE_TOKEN

**Interfaces:**
- Consumes: T7
- Produces:
  - `page-cache.ts`: `getCache(key)`, `setCache(key, html, ttlMs)`, `clearCache()` (чистый модуль, тестируется)
  - middleware: кэширует ответы GET `/` и `/…slug` по key `host+path` (TTL `ROUTE_TTL` env, по умолчанию 300s); пропущает `/api/*`, `/media/*`
  - `POST /api/purge` + `PURGE_TOKEN` → `clearCache()`
  - Payload `afterChange` (pages, posts, sites, site-content): `publishHook({ type, id })` → fetch Nuxt `/api/purge` (fire-and-forget)

- [ ] **Step 1: Тест page-cache (TDD)**

`apps/web/server/utils/page-cache.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { getCache, setCache, clearCache } from './page-cache'
it('возвращает значение в пределах TTL', () => {
  clearCache(); setCache('a', 'x', 60_000)
  expect(getCache('a')).toBe('x'); clearCache()
})
it('истечённый TTL → null', () => {
  clearCache(); setCache('b', 'y', -1)
  expect(getCache('b')).toBeNull(); clearCache()
})
it('clearCache всё сбрасывает', () => {
  clearCache(); setCache('c', 'z', 60_000)
  clearCache(); expect(getCache('c')).toBeNull()
})
```
Run: `pnpm --filter @siril/web test` → FAIL (нет модуля).

- [ ] **Step 2: Реализация кэша + middleware**

`server/utils/page-cache.ts`:
```ts
const m = new Map<string, { html: string; exp: number }>()
export function setCache(key: string, html: string, ttlMs: number) { m.set(key, { html, exp: Date.now() + ttlMs }) }
export function getCache(key: string): string | null {
  const e = m.get(key); if (!e) return null
  if (Date.now() > e.exp) { m.delete(key); return null }
  return e.html
}
export function clearCache() { m.clear() }
```
`server/middleware/cache.ts`:
```ts
export default defineEventHandler(async (event, _call) => {
  const url = event.path
  if (event.method !== 'GET' || url.startsWith('/api') || url.startsWith('/media')) return _call()
  const key = `${event.node.req.headers.host}:${url}`
  const { PURGE_TOKEN } = useRuntimeConfig() // не используем здесь, ttl из env
  const ttl = Number(process.env.ROUTE_TTL ?? 300_000)
  const cached = getCache(key)
  if (cached) { event.node.res.setHeader('content-type', 'text/html; charset=utf-8'); event.node.res.setHeader('x-siril-cache', 'HIT'); event.node.res.send(cached); return }
  const chunks: Buffer[] = []
  event.node.res.on('data', (c: Buffer) => chunks.push(c))
  event.node.res.on('end', () => {
    const html = Buffer.concat(chunks)
    setCache(key, html.toString('utf8'), ttl)
    event.node.res.setHeader('x-siril-cache', 'MISS')
  })
  return _call()
})
```
(Примечание: при intercept через `res.on('data')` Nitro должен писать в `res` в stream — в Nuxt SSR это работает, т.к. final handler пишет в node res. Если в рантайме проблемы — фолбэк: кэш через `cachedEventHandler` на уровне роута; приоритет — рабочесть.)

`server/api/purge.post.ts`:
```ts
import { clearCache } from '../utils/page-cache'
export default defineEventHandler((event) => {
  const { PURGE_TOKEN } = useRuntimeConfig()
  const auth = getHeader(event, 'authorization')
  if (auth !== `Bearer ${PURGE_TOKEN}`) throw createError({ statusCode: 401 })
  clearCache()
  return { ok: true }
})
```
`server/api/health.get.ts`: `export default defineEventHandler(() => ({ ok: true }))`

- [ ] **Step 3: Webhook из Payload**

`apps/admin/src/utils/publish-hook.ts`:
```ts
export function publishHook(type: string, _id: number) {
  const nuxt = process.env.NUXT_URL ?? 'http://localhost:3000'
  const token = process.env.PURGE_TOKEN ?? 'dev-purge-token'
  fetch(`${nuxt}/api/purge`, { method: 'POST', headers: { authorization: `Bearer ${token}` } }).catch(() => {})
}
```
В `pages.ts` и `posts.ts` добавить:
```ts
import { publishHook } from '../utils/publish-hook'
hooks: { afterChange: [async (doc, { req, id }) => {
  if (!req?.draft) publishHook('page', id)
}] }
```
(Аналогично posts; sites и site-content — без draft-проверки: `hooks: { afterChange: [async (doc, { id }) => publishHook('site', id)] }`.)
Добавить в `.env`: `NUXT_URL=http://localhost:3000`.

- [ ] **Step 4: Smoke**

Run: `pnpm --filter @siril/web test` (3 теста PASS).
Run: `pnpm dev:all`. Ответ `curl -i http://localhost:3000/home` → `x-siril-cache: MISS` (при первом) / HIT (при втором).
Опубликуй изменение в Payload (draft→publish) → ответ с HIT→MISS (cache сброшен).
Expected: кэш работает и сбрасывается по publish.

- [ ] **Step 5: Коммит** — `git add -A && git commit -m "feat(web): SSR page cache + purge endpoint + payload publish webhook"`

---

## Task 9: Блоки #1 — hero, text-image, features (+ варианты)

**Files:**
- Modify: `packages/blocks-definitions/src/registry.ts` (append в `BLOCKS`)
- Create: `apps/web/blocks/hero/{Default.vue,Split.vue}`, `apps/web/blocks/text-image/{Default.vue,Split.vue}`, `apps/web/blocks/features/Default.vue`

**Interfaces:**
- Consumes: T2 (типизация), T7 (renderer), T6 (useSite/theme id)
- Produces: 3 блока в `BLOCKS`; компоненты — props `{ block: any; themeId: string }`.

- [ ] **Step 1: Определения в registry**

```ts
// append в BLOCKS:
{ type: 'hero', name: 'Hero', description: 'Первый экран', variants: [
  { id: 'default', name: 'Центр', fields: [
    { name: 'title', type: 'text', label: 'Заголовок', required: true },
    { name: 'subtitle', type: 'richtext', label: 'Подзаголовок' },
    { name: 'buttonText', type: 'text', label: 'Кнопка' },
    { name: 'buttonLink', type: 'link', label: 'Ссылка кнопки' },
  ] },
  { id: 'split', name: 'Сплит', fields: [
    { name: 'title', type: 'text', label: 'Заголовок', required: true },
    { name: 'subtitle', type: 'richtext', label: 'Подзаголовок' },
    { name: 'image', type: 'image', label: 'Изображение' },
  ] },
]},
{ type: 'text-image', name: 'Текст + изображение', variants: [
  { id: 'default', name: 'Справа', fields: [
    { name: 'title', type: 'text', label: 'Заголовок' },
    { name: 'body', type: 'richtext', label: 'Текст' },
    { name: 'image', type: 'image', label: 'Изображение' },
  ] },
  { id: 'split', name: 'Слева', fields: [
    { name: 'title', type: 'text', label: 'Заголовок' },
    { name: 'body', type: 'richtext', label: 'Текст' },
    { name: 'image', type: 'image', label: 'Изображение' },
  ] },
]},
{ type: 'features', name: 'Возможности', variants: [
  { id: 'default', name: 'Сетка', fields: [
    { name: 'title', type: 'text', label: 'Заголовок' },
    { name: 'items', type: 'array-text', label: 'Пункты', maxItems: 12 },
  ] },
]},
```

- [ ] **Step 2: Компоненты (паттерн — повторить для всех блоков плана)**

`apps/web/blocks/hero/Default.vue`:
```vue
<template>
  <section class="hero" :style="tokens">
    <h1>{{ block.title }}</h1>
    <div class="hero-sub"><RichText :value="block.subtitle" /></div>
    <NuxtLink v-if="block.buttonText" :to="block.buttonLink || '/contact'" class="btn">{{ block.buttonText }}</NuxtLink>
  </section>
</template>
<script setup lang="ts">
import { getTheme } from '@siril/blocks-definitions'
const props = defineProps<{ block: any; themeId: string }>()
const theme = getTheme(props.themeId)
const tokens = Object.fromEntries(Object.entries(theme.tokens))
</script>
<style>
.hero { padding: 4rem 2rem; text-align: center; max-width: 72rem; margin: 0 auto; }
.hero h1 { font-size: 2.5rem; margin-bottom: .5rem; color: var(--c-primary, #111); }
.btn { display: inline-block; padding: .75rem 1.5rem; border-radius: .5rem; background: var(--c-primary, #0f766e); color: #fff; margin-top: 1rem; }
</style>
```
`hero/Split.vue` — то же + `<img :src="mediaUrl(block.image)" class="hero-img">` (см. helper Step 4), флекс 2 колонки.
`text-image/Default.vue` и `Split.vue` — 2 колонки (класс `.flip` в Split), `features/Default.vue` — сетка `<div class="feat">` по `block.items.map(i => i.value)`.

- [ ] **Step 3: RichText helper**

`apps/web/utils/richtext.ts`:
```ts
import type { RichText } from '@nuxtjs/richtype' // нет — свой простой renderer
```
Заменить: `components/RichText.vue`:
```vue
<template><div class="rich" v-html="html"></div></template>
<script setup lang="ts">
import { html } from 'html-prose' // нет — без зависимостей: свой parse
</script>
```
(Без внешних зависимостей: свой конвертер — `utils/lexical-to-html.ts` принимает lexical JSON (payload richText) → HTML (p, strong, em, a, ul/li) — ~40 строк. В шаге 3.1:)

`apps/web/utils/lexical-to-html.ts`:
```ts
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string)

export function lexicalToHtml(node: any): string {
  if (!node?.children) return ''
  const r = (n: any): string => {
    if (!n) return ''
    if (typeof n === 'string') return esc(n)
    if (!n.type) return esc(n.text ?? '')
    if (n.type === 'text') {
      const t = esc(n.text ?? '')
      if (n.format === 'bold') return `<strong>${t}</strong>`
      if (n.format === 'italic') return `<em>${t}</em>`
      if (n.format === 'underline') return `<u>${t}</u>`
      return t
    }
    const kids = (n.children ?? []).map(r).join('')
    switch (n.type) {
      case 'list': return `<ul>${kids}</ul>`
      case 'listitem': case 'list-item': return `<li>${kids}</li>`
      case 'quote': return `<blockquote>${kids}</blockquote>`
      case 'heading': {
        const tag = Math.min(6, Math.max(1, Number(`${n.subType ?? '2'}`.replace(/\D/g, '')) || 2))
        return `<h${tag}>${kids}</h${tag}>`
      }
      case 'link': {
        const href = n.link?.url ?? n.fields?.link ?? '#'
        return `<a href="${esc(href)}" target="_blank" rel="noopener">${kids}</a>`
      }
      default: return `<p>${kids}</p>`
    }
  }
  return node.children.map(r).join('')
}
```
(XSS: рендерер выдаёт только whitelist-теги/атрибуты (p, h1–h6, ul/li, strong, em, u, a[href], blockquote) — DOMPurify не нужен.)

`apps/web/components/RichText.vue` (создать; единственный способ рендерить richText):
```vue
<template>
  <div class="rich" v-html="html"></div>
</template>
<script setup lang="ts">
import { lexicalToHtml } from '~/utils/lexical-to-html'
const props = defineProps<{ value: any }>()
const html = computed(() => lexicalToHtml(props.value))
</script>
```

- [ ] **Step 4: mediaUrl helper**

`apps/web/utils/media.ts`:
```ts
export function mediaUrl(media: any): string {
  if (!media) return ''
  if (typeof media === 'string') return media
  if (!media.filename) return ''
  const { PAYLOAD_URL, SITE_DOMAIN } = useRuntimeConfig()
  const base = import.meta.dev ? PAYLOAD_URL : `https://${SITE_DOMAIN}`
  return `${base}/media/${media.filename}`   // filename уже с префиксом <site>/ (T3); /media/* отдаёт admin-приложение (T17: Caddy)
}
```

- [ ] **Step 5: Тест lexicalToHtml** (Vitest, `apps/web/utils/lexical-to-html.test.ts`)

```ts
import { describe, expect, it } from 'vitest'
import { lexicalToHtml } from './lexical-to-html'
const doc = (children: any[]) => ({ children })
it('paragraph', () => expect(lexicalToHtml(doc([{ type: 'paragraph', children: [{ type: 'text', text: 'Hi' }] }]))).toBe('<p>Hi</p>'))
it('bold', () => expect(lexicalToHtml(doc([{ type: 'paragraph', children: [{ type: 'text', text: 'B', format: 'bold' }] }]))).toBe('<p><strong>B</strong></p>'))
it('list', () => expect(lexicalToHtml(doc([{ type: 'list', children: [{ type: 'listitem', children: [{ type: 'text', text: 'a' }] }] }]))).toBe('<ul><li>a</li></ul>'))
it('экранирует html', () => expect(lexicalToHtml(doc([{ type: 'paragraph', children: [{ type: 'text', text: '<i>' }] }]))).toBe('<p>&lt;i&gt;</p>'))
```
Run: `pnpm --filter @siril/web test` → 4 новых теста PASS (плюс page-cache из T8).

- [ ] **Step 6: Smoke + коммит**

В Payload UI: странице `home` добавь все три блока (hero default — title/subtitle/button; text-image split — title/body/image; features — title + 4 пункта); publish.
Run: `http://localhost:3000` — блоки отрендерились по порядку; картинки подтянуты через `mediaUrl`.
Expected: 3 блока отрисованы (hero со CTA, text-image с фоткой, features-сетка). (Проверка fallback-варианта — в T12 с темой `mono`.)
Коммит: `git add -A && git commit -m "feat(web): blocks hero/text-image/features + RichText + lexical-to-html"`

---

## Task 10: Блоки #2 — pricing, gallery, faq, testimonials

**Files:**
- Modify: `packages/blocks-definitions/src/registry.ts` (append 4 блока в `BLOCKS`)
- Create: `apps/web/blocks/pricing/Default.vue`, `apps/web/blocks/gallery/Default.vue`, `apps/web/blocks/faq/Default.vue`, `apps/web/blocks/testimonials/Default.vue`

**Interfaces:**
- Consumes: T2 (контракт: `object-array`, `image-array` — уже в Т2), T9 (`RichText`, `mediaUrl`), T7 (renderer)
- Produces: 4 блока в `BLOCKS`; компоненты по паттерну T9 (props `{ block: any; themeId: string }`, `:style="tokens"`).

- [ ] **Step 1: Определения в registry** (append в `BLOCKS`)

```ts
{ type: 'pricing', name: 'Цены', variants: [
  { id: 'default', name: 'Сетка', fields: [
    { name: 'title', type: 'text', label: 'Заголовок' },
    { name: 'plans', type: 'object-array', label: 'Тарифы', maxItems: 6, subfields: [
      { name: 'title', type: 'text', label: 'Тариф' },
      { name: 'price', type: 'text', label: 'Цена' },
      { name: 'description', type: 'richtext', label: 'Описание' },
      { name: 'buttonText', type: 'text', label: 'Кнопка (необяз.)' },
      { name: 'buttonLink', type: 'link', label: 'Ссылка кнопки' },
      { name: 'featured', type: 'boolean', label: 'Выделенный' },
    ] },
  ] },
]},
{ type: 'gallery', name: 'Галерея', variants: [
  { id: 'default', name: 'Сетка', fields: [
    { name: 'title', type: 'text', label: 'Заголовок' },
    { name: 'images', type: 'image-array', label: 'Картинки', maxItems: 12 },
  ] },
]},
{ type: 'faq', name: 'FAQ', variants: [
  { id: 'default', name: 'Список', fields: [
    { name: 'title', type: 'text', label: 'Заголовок' },
    { name: 'items', type: 'object-array', label: 'Вопросы', maxItems: 20, subfields: [
      { name: 'question', type: 'text', label: 'Вопрос', required: true },
      { name: 'answer', type: 'richtext', label: 'Ответ', required: true },
    ] },
  ] },
]},
{ type: 'testimonials', name: 'Отзывы', variants: [
  { id: 'default', name: 'Сетка карточек', fields: [
    { name: 'title', type: 'text', label: 'Заголовок' },
    { name: 'items', type: 'object-array', label: 'Отзывы', maxItems: 9, subfields: [
      { name: 'quote', type: 'richtext', label: 'Цитата' },
      { name: 'author', type: 'text', label: 'Автор' },
      { name: 'role', type: 'text', label: 'Роль/компания' },
      { name: 'avatar', type: 'image', label: 'Фото' },
    ] },
  ] },
]},
```

- [ ] **Step 2: Компоненты** (паттерн = T9, стили через токены)

- `pricing/Default.vue`: `block.plans.map(p => …)` — карточки; `p.featured` → акцентная рамка/подложка `var(--c-primary)`; price крупно, кнопки `NuxtLink`.
- `gallery/Default.vue`: `block.images.map(img => <img :src="mediaUrl(img)" loading="lazy">)` — CSS grid `auto-fill minmax(240px,1fr)`, `aspect-ratio: 4/3`, `object-fit: cover`.
- `faq/Default.vue`: `block.items.map(i => <details><summary>{{ i.question }}</summary><RichText :value="i.answer" /></details>)`.
- `testimonials/Default.vue`: сетка карточек (аватар, цитата, автор, роль).

- [ ] **Step 3: Smoke**

В Payload: добавь 4 блока на страницу, заполни (объекты — через inline-редактор array), publish. Run `http://localhost:3000` — все 4 отрисованы; галерея — картинки из media.
Если media в блоках не populate-ится (пустые `filename`) — в `pages/[...slug].vue` (T7) поднять `depth=1` → `depth=2`.
Коммит: `git add -A && git commit -m "feat(web): blocks pricing/gallery/faq/testimonials"`

---

## Task 11: Блоки #3 — team, portfolio-grid, cta, contact, post-list, post-grid + роуты постов

**Files:**
- Modify: `packages/blocks-definitions/src/registry.ts` (append 6 блоков)
- Create: `apps/web/blocks/{team,portfolio-grid,cta,contact,post-list,post-grid}/Default.vue`, `apps/web/blocks/cta/Banner.vue`, `apps/web/pages/blog.vue`, `apps/web/pages/blog/[slug].vue`

**Interfaces:**
- Consumes: T2 (контракт), T9 (RichText, mediaUrl), T4 (posts/posts-данные)
- Produces: 6 блоков (14-й по сเปке — `form-block` — в T14); страницы `/blog` (индекс) и `/blog/<slug>` (пост).

- [ ] **Step 1: Определения в registry** (append)

```ts
{ type: 'team', name: 'Команда', variants: [
  { id: 'default', name: 'Сетка', fields: [
    { name: 'title', type: 'text', label: 'Заголовок' },
    { name: 'members', type: 'object-array', label: 'Люди', maxItems: 12, subfields: [
      { name: 'name', type: 'text', label: 'Имя', required: true },
      { name: 'role', type: 'text', label: 'Роль' },
      { name: 'photo', type: 'image', label: 'Фото' },
      { name: 'link', type: 'link', label: 'Ссылка (сайт/LinkedIn)' },
    ] },
  ] },
]},
{ type: 'portfolio-grid', name: 'Портфолио', variants: [
  { id: 'default', name: 'Сетка', fields: [
    { name: 'title', type: 'text', label: 'Заголовок' },
    { name: 'items', type: 'object-array', label: 'Работы', maxItems: 24, subfields: [
      { name: 'title', type: 'text', label: 'Название', required: true },
      { name: 'image', type: 'image', label: 'Обложка' },
      { name: 'link', type: 'link', label: 'Ссылка (необяз.)' },
    ] },
  ] },
]},
{ type: 'cta', name: 'CTA', variants: [
  { id: 'default', name: 'Центр', fields: [
    { name: 'title', type: 'text', label: 'Заголовок', required: true },
    { name: 'body', type: 'richtext', label: 'Текст' },
    { name: 'buttonText', type: 'text', label: 'Кнопка' },
    { name: 'buttonLink', type: 'link', label: 'Ссылка кнопки' },
  ] },
  { id: 'banner', name: 'Баннер с фоном', fields: [
    { name: 'title', type: 'text', label: 'Заголовок', required: true },
    { name: 'body', type: 'richtext', label: 'Текст' },
    { name: 'image', type: 'image', label: 'Фоновое изображение' },
    { name: 'buttonText', type: 'text', label: 'Кнопка' },
    { name: 'buttonLink', type: 'link', label: 'Ссылка кнопки' },
  ] },
]},
{ type: 'contact', name: 'Контакты', variants: [
  { id: 'default', name: 'Карточка', fields: [
    { name: 'title', type: 'text', label: 'Заголовок' },
    { name: 'email', type: 'email', label: 'Email' },
    { name: 'phone', type: 'text', label: 'Телефон' },
    { name: 'address', type: 'text', label: 'Адрес' },
    { name: 'workHours', type: 'text', label: 'Часы работы' },
    { name: 'mapLink', type: 'link', label: 'Ссылка на карту' },
  ] },
]},
{ type: 'post-list', name: 'Посты: список', variants: [
  { id: 'default', name: 'Список', fields: [
    { name: 'title', type: 'text', label: 'Заголовок' },
    { name: 'limit', type: 'number', label: 'Сколько', placeholder: '6' },
  ] },
]},
{ type: 'post-grid', name: 'Посты: сетка', variants: [
  { id: 'default', name: 'Сетка', fields: [
    { name: 'title', type: 'text', label: 'Заголовок' },
    { name: 'limit', type: 'number', label: 'Сколько', placeholder: '9' },
  ] },
]},
```

- [ ] **Step 2: Компоненты**

- `team/Default.vue`, `portfolio-grid/Default.vue` — grid-карточки (фото/обложка + текст + необязательная `<a>`/`NuxtLink`).
- `cta/Default.vue` + `Banner.vue` — как hero-CTA; Banner: секция с `background-image: url(…)`, `background-size: cover`, тень-оверлей для читаемости.
- `contact/Default.vue` — список контактов (email → `mailto:`, phone → `tel:`), `mapLink` → «Открыть на карте» (`target="_blank"`).
- `post-list/Default.vue` и `post-grid/Default.vue` (один общий паттерн, list = 1 колонка):
```vue
<script setup lang="ts">
import { payloadGet } from '../../server/utils/payload'
const props = defineProps<{ block: any; themeId: string }>()
const limit = Math.max(1, Number(props.block.limit) || 6)
const { data } = await useAsyncData(`posts-block-${limit}`, () =>
  payloadGet<{ docs: any[] }>(`posts?limit=${limit}&sort=-createdAt&depth=2`))
</script>
```
Карты-посты: `NuxtLink :to="`/blog/${p.slug}`"` — обложка `mediaUrl(p.cover)`, `p.title`, `p.excerpt`.

- [ ] **Step 3: Роуты постов**

`pages/blog.vue` — индекс: те же данные (`posts?limit=50&depth=2`), сетка карточек.
`pages/blog/[slug].vue`:
```vue
<script setup lang="ts">
import { payloadGet } from '../../server/utils/payload'
const route = useRoute()
const { data: page } = await useAsyncData(`post-${route.params.slug}`, () =>
  payloadGet<{ docs: any[] }>(`posts?where[slug][equals]=${encodeURIComponent(String(route.params.slug))}&depth=2`))
if (!page.value?.docs?.length) throw createError({ statusCode: 404, message: 'Not found' })
useSeoMeta({ title: page.value.docs[0].title, description: page.value.docs[0].excerpt })
</script>
<template>
  <article class="post">
    <h1>{{ $post.title }}</h1>
    <img v-if="$post.cover" :src="mediaUrl($post.cover)" class="post-cover" />
    <RichText :value="$post.body" />
  </article>
</template>
```
(`<script setup>` + computed `post` — оформить аккуратно: один block, `const post = computed(() => page.value!.docs[0])`.)

- [ ] **Step 4: Smoke**

Seed (T5) уже даёт 3-5 постов → `/blog` — сетка, `/blog/<slug>` — пост. На страницу добавь team/portfolio/cta/contact/post blocks → отрисовка.
Если посты/медиа в блоках не populate — `depth=2` (как в T10 step 3).
Коммит: `git add -A && git commit -m "feat(web): blocks team/portfolio/cta/contact/post-* + blog index and post page"`

---

## Task 12: Темы — tokens.css, демо-темы, переключение с fallback

**Files:**
- Create: `apps/web/themes/default/tokens.css`, `apps/web/themes/mono/tokens.css`
- Modify: `packages/blocks-definitions/src/registry.ts` (явные `THEMES`), `packages/blocks-definitions/src/resolve.test.ts` (+2 теста), `apps/web/layouts/default.vue` (подгрузка css текущей темы), `apps/admin/src/collections/sites.ts` (options темы из `THEMES`)

**Interfaces:**
- Consumes: T2 (`THEMES`), T3 (`site.theme`), T6 (`useSite`)
- Produces: тема = tokens + явная палитра блоков; `site.theme = 'mono'` → новый вид без деплоя; несовместимые варианты → fallback.

- [ ] **Step 1: Явные THEMES в registry** (заменяет `defaultThemeFrom`)

```ts
const all = (o: ThemeBlockConfig = { enabled: true }): Record<string, ThemeBlockConfig> =>
  Object.fromEntries(BLOCKS.map(b => [b.type, o as ThemeBlockConfig]))

export const THEMES: ThemeDef[] = [
  { id: 'default', name: 'Default (teal)', tokens: { '--c-primary': '#0f766e', '--c-bg': '#ffffff', '--c-text': '#111827', '--radius': '.5rem' }, blocks: all() },
  { id: 'mono', name: 'Mono (ч/б, serif)', tokens: { '--c-primary': '#111111', '--c-bg': '#ffffff', '--c-text': '#111111', '--radius': '0' }, blocks: {
    hero: { enabled: true, variants: ['default'] }, 'text-image': { enabled: true, variants: ['default'] },
    features: all().features!, pricing: all().pricing!, gallery: all().gallery!, faq: all().faq!,
    testimonials: all().testimonials!, team: all().team!, 'portfolio-grid': all()['portfolio-grid']!,
    cta: { enabled: true, variants: ['default'] }, contact: all().contact!, 'post-list': all()['post-list']!, 'post-grid': all()['post-grid']!,
  } },
]
```
(`form-block` в `mono` — допустим disabled: тема без форм; в default — enabled. При сборке `THEMES` — включить `form-block: { enabled: true }` в default.)
Тесты (resolve.test.ts):
```ts
it('getTheme mono', () => expect(getTheme('mono').id).toBe('mono'))
it('mono не поддерживает hero/split → fallback', () => {
  const hero = getBlock('hero')!
  expect(resolveVariant(getTheme('mono'), hero, 'split')).toEqual({ variant: 'default', fallback: true })
})
```
Run: `pnpm --filter @siril/blocks-definitions test` — PASS.

- [ ] **Step 2: tokens.css + динамическая подгрузка**

`themes/default/tokens.css`:
```css
:root { --c-primary: #0f766e; --c-bg: #fff; --c-text: #111827; --radius: .5rem; }
body { font-family: system-ui, sans-serif; color: var(--c-text); background: var(--c-bg); }
a { color: var(--c-primary); }
```
`themes/mono/tokens.css` — те же токены mono + `img { filter: grayscale(1); }` + `font-family: Georgia, serif`.
В `layouts/default.vue` (script setup):
```ts
const themeId = (siteData.value?.site?.theme ?? 'default') as string
await import(`../themes/${themeId}/tokens.css`).catch(() => import('../themes/default/tokens.css'))
```
(SSR + client подгружают css; Vite рендерит динамический импорт css-модулей.)

- [ ] **Step 3: Admin — options темы + описание**

`sites.ts`:
```ts
import { THEMES } from '@siril/blocks-definitions'
// field theme:
{ name: 'theme', type: 'select', options: THEMES.map(t => ({ value: t.id, label: t.name })), defaultValue: 'default',
  admin: { description: 'Переключение темы — мгновенное (данные). Блоки/варианты, не поддержанные темой, отрисовываются по fallback-варианту.' } }
```

- [ ] **Step 4: Smoke + коммит**

В Payload: `sites → default → Theme = Mono` (без publish — sites без drafts) → Nuxt refresh: ч/б, serif, hero/split → fallback на default-вариант (видно в разметке). Вернуть `Default` → цвет.
Коммит: `git add -A && git commit -m "feat(themes): default + mono, tokens.css, live theme switch with fallback"`

---

## Task 13: Формы — коллекция forms + form-builder (admin)

**Files:**
- Create: `apps/admin/src/collections/forms.ts`, `apps/admin/src/app/form-builder/page.tsx`
- Modify: `apps/admin/payload.config.ts` (коллекция forms), `apps/admin/src/app/form-builder/[form]/page.tsx`? — нет: `/form-builder?form=<id>` (простой query)

**Interfaces:**
- Consumes: T2 (`toPayloadFormFields`, `FORM_FIELD_TYPES`), T3 (access/canScope)
- Produces: коллекция `forms` { site, name, slug, successMessage, fields: array }; admin-страница `/form-builder?form=<id>` (строение полей).

- [ ] **Step 1: Коллекция forms**

```ts
import type { CollectionConfig } from 'payload'
import { toPayloadFormFields } from '@siril/blocks-definitions'
import { canScope } from '../access/site-scope'

export const Forms: CollectionConfig = {
  slug: 'forms',
  admin: { defaultColumns: ['name', 'slug'], description: 'Определение формы: построй в form-builder → /form-builder?form=<id>' },
  access: {
    read: ({ req: { user }, data }) => canScope(user, data?.site ?? 1),
    create: ({ req: { user } }) => !!user, update: ({ req: { user } }) => !!user, delete: ({ req: { user } }) => !!user,
  },
  fields: [
    { name: 'site', type: 'relationship', relationTo: 'sites', required: true },
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', unique: true, admin: { description: 'POST /api/forms/<slug>/submit (web)' } },
    { name: 'successMessage', type: 'text', defaultValue: 'Спасибо! Заявка отправлена.' },
    { name: 'fields', type: 'array', fields: toPayloadFormFields() },
  ],
}
```
Важно: контракт `toPayloadFormFields(): PayloadField[]` (T2) должен вернуть схему array-строк: `{ name: 'name' (text), label (text), type (select из FORM_FIELD_TYPES), required (checkbox), placeholder (text), options (textarea — по одному на строку) }`. Если реализация T2 расходится — править в T2 (единый источник).
Add в `payload.config.ts` collections. Run `pnpm dev:all` → в Payload: forms → Create (name «Обратная связь», slug `contact-form`, 3 поля: name/text/required, email/email, message/textarea).

- [ ] **Step 2: form-builder (Next-страница в admin-приложении)**

`apps/admin/src/app/form-builder/page.tsx` (App Router; Next 15 внутри Payload):
- клиентский компонент; `useSearchParams` → `form` (id);
- `GET ${PAYLOAD_URL}/api/forms/<id>` (cookies текущей админ-сессии — page рендерится в том же origin, где живёт Payload) → состояние `fields`;
- UI (инлайн-стили, без UI-библиотек): список строк { label, type, required } с кнопками ↑ ↓ ✕; форма «добавить поле» { name, label, type (select из FORM_FIELD_TYPES), required, options };
- Save → `PUT ${PAYLOAD_URL}/api/forms/<id>` c новым `fields`-массивом.
Ссылка «В builder» в списке forms: в cell `name` — обычный `<a href={`/form-builder?form=${doc.id}`}>`.
Run: открыть `/form-builder?form=1` → убрать поле, добавить select с options, Save → в UI forms поля обновились.
Коммит: `git add -A && git commit -m "feat(admin): forms collection + form-builder page"`

---

## Task 14: Приём заявок — POST /api/forms/[slug]/submit + notify + блок form-block

**Files:**
- Create: `apps/web/server/api/forms/[slug]/submit.post.ts`, `apps/web/server/utils/notify.ts`, `apps/web/server/utils/rate-limit.ts`, `apps/web/server/utils/rate-limit.test.ts`, `apps/web/blocks/form-block/Default.vue`
- Modify: `packages/blocks-definitions/src/registry.ts` (append `form-block` — 14-й блок), `apps/admin/src/collections/form-submissions.ts` (Create), `apps/admin/package.json`? нет; `apps/web/package.json` (+ `nodemailer`)

**Interfaces:**
- Consumes: T2 (`FormFieldDef`, `validateSubmission`), T13 (forms)
- Produces: публичное API приёма; коллекция `form-submissions` (read-only для людей); уведомления email (SMTP из site.settings) + Telegram (`site.contacts.telegram`); блок-рендер формы с нативной валидацией.

- [ ] **Step 1: Коллекция form-submissions**

```ts
import type { CollectionConfig } from 'payload'
import { canScope } from '../access/site-scope'
export const FormSubmissions: CollectionConfig = {
  slug: 'form-submissions',
  admin: { defaultColumns: ['form', 'ip', 'createdAt'], description: 'Заявки: read-only (создаёт web)' },
  access: {
    read: ({ req: { user }, data }) => canScope(user, data?.site ?? 1) || !!user,
    create: () => true,   // pубличный REST-путь: только web-эндпоинт пишет (v2: token сервисного пользователя)
    update: () => false, delete: () => false,
  },
  fields: [
    { name: 'site', type: 'relationship', relationTo: 'sites', required: true },
    { name: 'form', type: 'relationship', relationTo: 'forms', required: true },
    { name: 'values', type: 'array', fields: [
      { name: 'name', type: 'text' }, { name: 'value', type: 'text' },
    ] },
    { name: 'ip', type: 'text' },
  ],
}
```
Добавить в config. (Файлы-вложения v1 не поддерживаем — `file`-поле в form v1 не используется; validateSubmission по нему пропускаем: в submit-эндпоинте file-поля вырезаем из проверки.)

- [ ] **Step 2: Rate-limit (чистый модуль + тест)**

`server/utils/rate-limit.ts`:
```ts
const hits = new Map<string, number[]>()
export function rateLimit(key: string, limit = 3, windowMs = 60_000): boolean {
  const now = Date.now()
  const arr = (hits.get(key) ?? []).filter(t => now - t < windowMs)
  if (arr.length >= limit) { hits.set(key, arr); return false }
  arr.push(now); hits.set(key, arr)
  return true
}
```
`rate-limit.test.ts`: 3 пропуска, 4-й — false (mock даты: `vi.useFakeTimers`).
Run: `pnpm --filter @siril/web test` — PASS.

- [ ] **Step 3: submit-эндпоинт**

`server/api/forms/[slug]/submit.post.ts`:
```ts
import { readBody, getRouterParam } from 'h3'
import { validateSubmission } from '@siril/blocks-definitions'
import { payloadGet } from '../../utils/payload'
import { rateLimit } from '../../utils/rate-limit'
import { notifyNewSubmission } from '../../utils/notify'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam('slug', event)
  const ip = event.node.req.socket.remoteAddress ?? 'unknown'
  if (!rateLimit(`form:${slug}:${ip}`)) throw createError({ statusCode: 429, message: 'Too many requests' })
  const body: Record<string, unknown> = await readBody(event)
  const { docs } = await payloadGet<{ docs: any[] }>(`forms?where[slug][equals]=${encodeURIComponent(slug!)}&depth=2`)
  const form = docs[0]
  if (!form) throw createError({ statusCode: 404, message: 'Form not found' })
  const honeypot = form.fields.find((f: any) => f.type === 'honeypot')
  if (honeypot && body[honeypot.name]) return { ok: true }   // тихий success ботов
  const values = form.fields
    .filter((f: any) => ['text', 'email', 'tel', 'textarea', 'select', 'checkbox', 'checkbox-group', 'date', 'consent'].includes(f.type))
    .map((f: any) => ({ name: f.name, value: body[f.name] }))
  const fields = form.fields.map((f: any) => ({ id: f.id ?? f.name, name: f.name, label: f.label, required: !!f.required, options: f.options ? String(f.options).split('\n') : undefined }))
  const v = validateSubmission(fields, Object.fromEntries(values.map(p => [p.name, p.value])), {})
  if (!v.ok) return { ok: false, errors: v.errors }
  await $fetch(`${useRuntimeConfig().PAYLOAD_URL}/api/form-submissions`, {
    method: 'POST',
    body: { site: form.site, form: form.id, values, ip },
  })
  notifyNewSubmission({ formName: form.name, values: Object.fromEntries(values.map(p => [p.name, p.value])) })
  return { ok: true }
})
```

`server/utils/notify.ts`:
```ts
import nodemailer from 'nodemailer'
import { payloadGet } from './payload'

export async function notifyNewSubmission(p: { formName: string; values: Record<string, unknown> }) {
  const { docs } = await payloadGet<{ docs: any[] }>('sites?limit=1')
  const site = docs[0]
  const text = `Заявка (${p.formName}): ${Object.entries(p.values).map(([k, v]) => `${k}: ${v}`).join(' | ')}`
  console.log('[notify]', text)
  if (site?.settings?.smtpHost) {
    const smtp = nodemailer.createTransport({
      host: site.settings.smtpHost, port: Number(site.settings.smtpPort) || 587,
      auth: site.settings.smtpUser ? { user: site.settings.smtpUser, pass: site.settings.smtpPass } : undefined,
    })
    if (site.contacts?.email) await smtp.sendMail({ from: site.settings.smtpUser, to: site.contacts.email, subject: `Заявка: ${p.formName}`, text })
  }
  const tgToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = site?.contacts?.telegram
  if (tgToken && chatId) await $fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, { method: 'POST', body: { chat_id: chatId, text } }).catch(() => {})
}
```
`pnpm --filter @siril/web add nodemailer`. В `.env.example` добавить `TELEGRAM_BOT_TOKEN=`.

- [ ] **Step 4: Блок form-block**

registry (append):
```ts
{ type: 'form-block', name: 'Форма', variants: [
  { id: 'default', name: 'Форма обратной связи', fields: [
    { name: 'form', type: 'form', label: 'Форма', required: true },
  ] },
]},
```
`blocks/form-block/Default.vue`:
```vue
<script setup lang="ts">
import { payloadGet } from '../../server/utils/payload'
const props = defineProps<{ block: any; themeId: string }>()
const formId = typeof props.block.form === 'object' ? props.block.form?.id : null
const { data: f } = await useAsyncData(`form-${formId}`, () =>
  payloadGet<{ docs: any[] }>(`forms?where[id][equals]=${formId ?? 1}&depth=2`))
const form = f!
const values = reactive<Record<string, string>>({})
const errors = ref('')
const submit = async () => {
  errors.value = ''
  try {
    const res = await $fetch<{ ok: boolean; errors?: string[] }>(`/api/forms/${form.slug}/submit`, { method: 'POST', body: values })
    if (!res.ok) errors.value = (res.errors ?? []).join(' ')
    else Object.keys(values).forEach(k => (values[k] = ''))
  } catch (e: any) { errors.value = e?.statusMessage ?? 'Ошибка' }
}
</script>
<template>
  <section class="form-block">
    <form @submit.prevent="submit">
      <template v-for="ff in form.fields" :key="ff.name">
        <label v-if="ff.type !== 'honeypot' && ff.type !== 'file'">
          {{ ff.label }} <span v-if="ff.required">*</span>
          <input v-if="['text', 'email', 'tel'].includes(ff.type)" :type="ff.type" v-model="values[ff.name]" :required="ff.required" />
          <textarea v-else-if="ff.type === 'textarea'" v-model="values[ff.name]" :required="ff.required" rows="4"></textarea>
          <select v-else-if="ff.type === 'select'">
            <option value="">—</option>
            <option v-for="o in (ff.options ? String(ff.options).split('\n') : [])" :key="o" :value="o">{{ o }}</option>
          </select>
          <input v-else-if="ff.type === 'date'" type="date" v-model="values[ff.name]" :required="ff.required" />
          <label v-else-if="ff.type === 'checkbox'"><input type="checkbox" v-model="values[ff.name]" /> </label>
        </label>
        <label v-else-if="ff.type === 'honeypot'" style="display:none"><input v-model="values[ff.name]" /></label>
      </template>
      <button type="submit">Отправить</button>
      <p v-if="errors" class="form-errors">{{ errors }}</p>
      <p class="form-success" v-else-if="ok && success">{{ form.successMessage }}</p>
    </form>
  </section>
</template>
```
(`ok`/`success` — `let success = ref(false)` + set в submit; select: `:value="values[ff.name]"` + `@change` — оформить в рабочем виде.)

- [ ] **Step 5: Smoke**

На страницу добавь `form-block` → форма `contact-form` → publish. Run:
- сабмит с заполнением name/email → `{ok:true}`, в Payload form-submissions запись, в консоли `[notify]`;
- оставить пусто обязательное → `{ok:false, errors:[…]}`;
- заполнить honeypot (через devtools) → `{ok:true}`, записи НЕТ;
- 4 сабмита подряд с одного IP → 429.
Коммит: `git add -A && git commit -m "feat(web): form submission endpoint (honeypot/rate-limit/validate) + smtp/telegram notify + form-block"`

---

## Task 15: Заявки в админке + экспорт CSV

**Files:**
- Create: `apps/admin/src/endpoints/submissions-csv.ts`
- Modify: `apps/admin/payload.config.ts` (custom endpoint), `apps/admin/src/app/form-builder/page.tsx` (кнопка «CSV»), `README` (раздел «Опс» — ссылки `/form-builder`, `/design`, CSV)

**Interfaces:**
- Consumes: T14 (form-submissions)
- Produces: read-only список заявок; `GET /api/submissions-csv?form=<id>` (CSV с BOM; колонки — из полей формы).

- [ ] **Step 1: CSV-endpoint**

`src/endpoints/submissions-csv.ts`:
```ts
import type { Endpoint } from 'payload'
export const submissionsCsv: Endpoint = {
  path: '/submissions-csv', method: 'get',
  handler: async (req, res) => {
    const payload_ = (globalThis as any).payload ?? (await getPayload({ config: (await import('../payload.config')).default }))
    const formId = Number(req.query?.form ?? req.params?.form ?? 0)
    const { docs } = await payload_.find({ collection: 'form-submissions', where: formId ? { form: { equals: formId } } : undefined, limit: -1, depth: 1 })
    const form = formId ? (await payload_.getByID({ collection: 'forms', id: formId })) : { fields: [] }
    const headers = ['Дата', ...form.fields.map((f: any) => f.label ?? f.name), 'IP']
    const csvEsc = (s: unknown) => `"${String(s ?? '').replace(/"/g, '""')}"`
    const rows = docs.map(d => [new Date(d.createdAt).toISOString(),
      ...form.fields.map((f: any) => (d.values ?? []).find((v: any) => v.name === f.name)?.value ?? ''),
      d.ip].map(csvEsc).join(','))
    res.setHeader('content-type', 'text/csv; charset=utf-8')
    res.setHeader('content-disposition', `attachment; filename="submissions-${formId || 'all'}.csv"`)
    res.send('\uFEFF' + [headers.map(csvEsc).join(','), ...rows].join('\r\n'))
  },
}
```
(Под конкретную API-форму `custom.endpoints` в установленном Payload 3 — local API, доступ — авторизованный user; по факту версии подогнать сигнатуру.)
В `payload.config.ts`: зарегистрировать endpoint (`custom: { endpoints: [submissionsCsv] }` или эквивалент).

- [ ] **Step 2: Кнопка + smoke**

В form-builder: ссылка «Экспорт CSV (эта форма)» → `/api/submissions-csv?form=<id>`.
Run: сделать 2 заявки через web → открыть ссылку → CSV (открывается в Excel, кириллица без mojibake).
Коммит: `git add -A && git commit -m "feat(admin): form-submissions read-only + CSV export endpoint"`

---

## Task 16: Дизайн-страница в админке (свитчер тем с превью)

**Files:**
- Create: `apps/admin/src/app/design/page.tsx`
- Modify: `README` (раздел «Опс»)

**Interfaces:**
- Consumes: T12 (`THEMES`), T3 (sites)
- Produces: страница `/design` — список тем (свотчи из tokens), radio «текущая», Save → `PUT sites/<id> {theme}`.

- [ ] **Step 1: Страница**

`src/app/design/page.tsx` (client component, App Router в admin-приложении):
- `GET /api/sites?limit=1` (cookies текущей сессии) → site;
- `THEMES.map(t => <label><input type="radio" checked={site.theme === t.id} /> <span style={`display:inline-block;width:16px;height:16px;background:${t.tokens['--c-primary']}`} /> {t.name}</label>)`;
- Save → `PUT /api/sites/<id>` body `{ theme: id }`; сообщение «Сохранено — тема применится на следующем purge (хук T8)».
Run: переключить на mono → сохранить → сайт в монохроме.
Коммит: `git add -A && git commit -m "feat(admin): design page (theme switch UI with previews)"`

---

## Task 17: Production — Docker, Caddy, compose, Makefile, backup

**Files:**
- Create: `infra/docker/web.Dockerfile`, `infra/docker/admin.Dockerfile`, `infra/docker-compose.prod.yml`, `infra/Caddyfile`, `infra/Makefile`, `infra/scripts/backup.sh`
- Modify: `apps/admin/next.config.mjs` (`output: 'standalone'`), `.env.example` (prod-блок), `README` (деплой-процедура)

**Interfaces:**
- Consumes: все предыдущие (web build, admin build)
- Produces: `make up` (из `infra`) → postgres + admin + web + caddy; `http://{$SITE_DOMAIN}` (web) и `http://admin.{$SITE_DOMAIN}` (admin); `/media/*` — на сайте и в admin-вхосте проксируется в admin (T9 `mediaUrl`).

- [ ] **Step 1: Dockerfile'ы**

`web.Dockerfile`:
```dockerfile
FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
ARG PAYLOAD_URL=http://admin:3001
ENV PAYLOAD_URL=$PAYLOAD_URL
RUN pnpm --filter @siril/web build
FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/apps/web/.output /app/apps/web/.output
EXPOSE 3000
CMD ["node", "apps/web/.output/server/index.mjs"]
```
`admin.Dockerfile`:
```dockerfile
FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
ARG POSTGRES_DB_URI
ENV POSTGRES_DB_URI=$POSTGRES_DB_URI
RUN pnpm --filter @siril/admin build
FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/apps/admin/.next/standalone /app
COPY --from=build /app/apps/admin/.next/static /app/apps/admin/.next/static
COPY --from=build /app/apps/admin/public /app/apps/admin/public
EXPOSE 3001
CMD ["node", "apps/admin/server.js"]
```
(Пути standalone-файлов — по фактическому build; проверить в локальном smoke, поправить если Next 15 кладёт `standalone` иначе.)

- [ ] **Step 2: compose + Caddyfile + Makefile + backup**

`docker-compose.prod.yml`:
```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-payload}
      POSTGRES_USER: ${POSTGRES_USER:-payload}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?set POSTGRES_PASSWORD}
    volumes: [ pgdata:/var/lib/postgresql/data ]
  admin:
    build:
      context: ..
      dockerfile: infra/docker/admin.Dockerfile
    env_file: ../.env
    environment:
      POSTGRES_DB_URI: postgresql://${POSTGRES_USER:-payload}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB:-payload}
    depends_on: [ postgres ]
  web:
    build:
      context: ..
      dockerfile: infra/docker/web.Dockerfile
      args: { PAYLOAD_URL: 'http://admin:3001' }
    env_file: ../.env
    environment: { PAYLOAD_URL: 'http://admin:3001' }
    depends_on: [ admin ]
  caddy:
    image: caddy:2
    ports: ["80:80", "443:443"]
    environment: { SITE_DOMAIN: ${SITE_DOMAIN:-localhost} }
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_conf:/config
    depends_on: [ web, admin ]
volumes: { pgdata: {}, caddy_data: {}, cady_conf: {} }
```
(Опечатка `cady_conf` → `caddy_conf` при вёрстке — проверить перед запуском.)

`Caddyfile`:
```
{$SITE_DOMAIN} {
  handle /media/* { reverse_proxy admin:3001 }
  reverse_proxy web:3000
}
admin.{$SITE_DOMAIN} {
  reverse_proxy admin:3001
}
```
(Локальный http-демо: `SITE_DOMAIN=localhost` + второй вхост `*.localhost` не нужен — админку через `localhost:3001` пробрасывать напрямую `ports: 3001:3001` в admin, пока домен не выдан; с реальным доменом — Caddy + Let's Encrypt автоматически.)

`Makefile`:
```makefile
up:
	docker compose -f docker-compose.prod.yml up -d --build
ps:
	docker compose -f docker-compose.prod.yml ps
logs:
	docker compose -f docker-compose.prod.yml logs -f --tail=100
smoke:
	@docker compose -f docker-compose.prod.yml exec web wget -q -O- http://web:3000/api/health || true
backup:
	bash scripts/backup.sh
new-site:
	@echo "v1: новый сайт = отдельный деплой: cp ../.env ../.env.<name> (SITE_DOMAIN, POSTGRES_PASSWORD, PAYLOAD_SECRET) && docker compose -f docker-compose.prod.yml --project-name <name> up -d --build"
```

`scripts/backup.sh`:
```bash
#!/usr/bin/env bash
set -euo pipefail
DB_URI="${POSTGRES_DB_URI:?set POSTGRES_DB_URI}"
mkdir -p backups
f="backups/$(date +%F-%H%M).sql.gz"
docker compose -f docker-compose.prod.yml exec -T postgres pg_dump "$DB_URI" | gzip > "$f" || docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U "${POSTGRES_USER:-payload}" "${POSTGRES_DB:-payload}" | gzip > "$f"
find backups -name '*.sql.gz' -mtime +30 -delete
echo "backup: $f"
```
В `.env.example` — prod-блок: `SITE_DOMAIN=client.example.com`, `POSTGRES_USER=payload`, `POSTGRES_PASSWORD=`, `POSTGRES_DB=payload`, `POSTGRES_DB_URI=postgresql://payload:***@postgres:5432/payload`, `PAYLOAD_SECRET=<32+ символов>`, `TELEGRAM_BOT_TOKEN=`.

- [ ] **Step 3: Smoke (локально, без VPS)**

Run: `make -C infra up` → `make -C infra ps` (все Up) → `make -C infra logs`:
- web `wget /api/health` → 200;
- admin — в логах Payload «ready»; из-за docker-сети: `docker compose -f docker-compose.prod.yml run --rm web wget -q -O- http://web:3000/` → HTML;
- media: `docker compose -f docker-compose.prod.yml run --rm web wget -q -O- http://admin:3001/media/<site>/<file> | head -c 100` → байты картинки.
(TLS/https — проверять на VPS с реальным доменом: caddy сам выпустит сертификат.)
Коммит: `git add -A && git commit -m "chore(infra): production docker/caddy/compose/makefile/backup script"`

---

## Task 18: SEO — sitemap.xml, robots.txt, корректные canonical/OG

**Files:**
- Create: `apps/web/server/routes/sitemap.xml.ts`, `apps/web/server/routes/robots.txt.ts`
- Modify: `apps/web/pages/[...slug].vue` (ogImage через `mediaUrl`, абсолютный canonical), `apps/web/pages/blog.vue` + `pages/blog/[slug].vue` (canonical/og)

**Interfaces:**
- Consumes: T7 (pages), T11 (posts), T9 (`mediaUrl`)
- Produces: `GET /sitemap.xml` (опубликованные страницы + посты), `GET /robots.txt`, абсолютные `canonical`/`og:image` на всех pубличных страницах.

- [ ] **Step 1: sitemap.xml**

```ts
// apps/web/server/routes/sitemap.xml.ts
import { payloadGet } from '../utils/payload'
export default defineEventHandler(async (event) => {
  const domain = useRuntimeConfig().SITE_DOMAIN
  const base = `https://${domain}`
  const [pages, posts] = await Promise.all([
    payloadGet<{ docs: any[] }>('pages?limit=500&depth=1'),
    payloadGet<{ docs: any[] }>('posts?limit=500&depth=1'),
  ])
  const urls = [
    ...pages.docs.map(p => `<url><loc>${p.slug === 'home' ? base : `${base}/${p.slug}`}</loc></url>`),
    ...posts.docs.map(p => `<url><loc>${base}/blog/${p.slug}</loc></url>`),
  ].join('')
  event.node.res.setHeader('content-type', 'application/xml; charset=utf-8')
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`
})
```

- [ ] **Step 2: robots.txt**

```ts
export default defineEventHandler((event) => {
  event.node.res.setHeader('content-type', 'text/plain; charset=utf-8')
  return `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: https://${useRuntimeConfig().SITE_DOMAIN}/sitemap.xml\n`
})
```

- [ ] **Step 3: og/canonical**

В `pages/[...slug].vue` — заменить `ogImage` (сейчас `.../media/${page.seo.ogImage}` — id, а не файл) на `mediaUrl(page.seo.ogImage)` (import из T9), `canonical: `https://${siteDomain}/${slug}``; убедиться что `ogImage` приходит заполненным (depth 2) — если нет, поднять depth в fetch блоках. В `pages/blog.vue`/`blog/[slug].vue` — тот же приём.
Run: открыть страницу → в HTML: `<link rel="canonical" href="https://…/">`, `property="og:image" content="https://…/media/<site>/<file>"`; `/sitemap.xml` и `/robots.txt` — 200, корректное содержимое.
Коммит: `git add -A && git commit -m "feat(web): sitemap.xml, robots.txt, absolute canonical/og:image"`

---

## Definition of Done (MVP)

- [ ] Все 14 блоков по spec §5 рендерятся; фолбэк вариантов на тему mono работает.
- [ ] Клиент (editor) умеет: создать страницу, отредактировать меню/футер (site-content), загрузить медиа, draft→publish, собрать форму в builder, переключить тему (design-страница), посмотреть заявки + CSV.
- [ ] `pnpm test` — все тесты зелёные (packages + web server utils).
- [ ] Dev-loop: `pnpm dev:all` + `pnpm seed` → демо-сайт за <2 мин.
- [ ] Production: `make -C infra up` → web + admin + media + TLS; `make backup` (pg_dump).
- [ ] Git: каждый task — свой conventional-коммит (см. шаги «Коммит»).

## Handoff

План самодостаточен для разных сессий (см. «Session map»): трек A (T1–T8) последовательно; затем B/C/D/E/F — параллельно, независимые файлы; `blocks-definitions` — append-only, merge не конфликтует.
Рекомендуемое выполнение: superpowers:subagent-driven-development (одна сессия на задачах по одной) или superpowers:executing-plans (батч-режим).