# Spike S0.2 — admin-ui components from a package (importMap baseDir)

- Date: 2026-09-27
- Spike: S0.2 (task-3, plan 2026-09-27-engine-platform-s0-a)
- Environment: payload 3.90.1, @payloadcms/next 3.90.1, @payloadcms/db-postgres 3.90.1, next 16.3.5 (Turbopack), react 19.2.8, typescript 5.9.3, node v22.22.2, Docker Desktop 4.91 / postgres:16 on :5435
- Scratch app: `C:\Users\iisiraev\AppData\Local\Temp\opencode\siril-s03` (not committed)

## Question

How should the `admin.components.Field` contract strings (today `'./src/admin-ui/variant-picker'`,
`packages/blocks-definitions/src/to-payload.ts:59`) point at component files that live in the future
engine package instead of the app? Candidate (a) per plan: `importMap.baseDir` → package dir + rebase of
the string; (b) fallback: components stay in the app (template ships them).

## Finding 1 — the rebase mechanics (payload 3.90.1 source)

`payload generate:importmap` (`dist/bin/generateImportMap/utilities/*`):

- The importMap file is `app/(payload)/admin/importMap.js` (or the `src/app/` twin); created empty
  (`flag: 'wx'`) if missing.
- Key = `componentPath#exportName`; the import path is built per entry:
  - `getImportMapToBaseDirPath` = `path.relative(importMapDir, baseDir)` → e.g. `../../../ext/src/`.
  - Relative `componentPath` (leading `./`): `path.posix.join(rel)` → e.g. `../../../ext/src/admin-ui/picker`.
  - Non-relative `componentPath` (package specifier, tsconfig alias): **passed through untouched** —
    `baseDir` is not involved; the bundler resolves it. That is why the generated map always contains
    `import { CollectionCards } from '@payloadcms/next/rsc'` alongside rebased entries.

## Finding 2 — candidate (a) works end-to-end (relative path into the package)

Config (scratch, 1:1 shape of the planned Task 8 line):

```ts
// payload.config.ts
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dirname = path.dirname(fileURLToPath(import.meta.url))
// == planned: path.resolve(dirname, '../../packages/admin/src')
const adminUiPackageSrc = path.resolve(dirname, 'ext/src')

export default buildConfig({
  admin: { importMap: { baseDir: adminUiPackageSrc } },
  ...
})
```

Field contract: `{ name: 'kind', type: 'text', admin: { components: { Field: './admin-ui/picker' } } }`
(`ext/src/admin-ui/picker.tsx` = `export default function Picker(){ return <div className="picker">P</div> }`).

Generated `app/(payload)/admin/importMap.js`:

```js
import { default as default_fb993d959f75af02807c03ddb16aa0ac } from '../../../ext/src/admin-ui/picker'
import { CollectionCards as CollectionCards_f9c02e79a4aed9a3924487c0cd4cafb1 } from '@payloadcms/next/rsc'

export const importMap = {
  "./admin-ui/picker#default": default_fb993d959f75af02807c03ddb16aa0ac,
  "@payloadcms/next/rsc#CollectionCards": CollectionCards_f9c02e79a4aed9a3924487c0cd4cafb1
}
```

Evidence:

- `next build` (Next 16.3.5 Turbopack): `✓ Compiled successfully in 8.2s`, TS check 5.9s, static pages
  2/2; routes `/_not-found`, `/admin/[[...segments]]`, `/api/[...slug]` (log: scratch `build-final.log`).
- SSR render: `GET /admin/collections/widget/1` (dev, REST user, `Authorization: Bearer <jwt>`) → **200**,
  HTML contains the rendered package component: `...document-fields__fields"><div class="picker">P</div><input
  id="field-updatedAt"...` (saved: scratch `widget-final.html`). No console/build errors in dev logs.
  (Admin SSR URLs need the `collections/` segment — `/admin/widget/1` is 404 by design, same as the repo
  e2e's `/admin/collections/pages/create`.)

## Finding 3 — `node_modules` is a hard boundary for Turbopack (important for Task 8)

If the component file is **physically under `node_modules`** — e.g. `baseDir` resolved through the pnpm
store (`node_modules/.pnpm/@siril+admin@…/node_modules/@siril/admin/src/...`), whether via a relative
rebased import or a bare-specifier import — dev SSR fails:

```
Error: Unknown module type
This module doesn't have an associated type. Use a known file extension, or register a loader for it.
```

Fix: `transpilePackages: ['<pkg>']` in the app `next.config.mjs` — with it, the bare-specifier variant
(`Field: 'ext/src/admin-ui/picker'`, no baseDir involvement, imported as-is) also renders (verified: two
pickers, one per mechanism, same page). So:

- **Monorepo workspace (the plan's shape**: `baseDir: path.resolve(dirname, '../../packages/admin/src')`
  **→ the file lives outside `node_modules`)** — works without any extra config (Finding 2).
- **npm-installed package (published platform)** — the resolved path is under `node_modules` → the app
  needs `transpilePackages` while the package ships TS/TSX source, or the package must ship precompiled
  JS (like every other dist dependency).

## Finding 4 — do not use `import.meta.resolve` in `payload.config.ts`

Under the Payload CLI/dev config loader (node ts-loader, CJS-transpiled config) only `import.meta.url` is
shimmed: `import.meta.resolve('ext/package.json')` throws
`TypeError: {import.meta}.resolve is not a function` at page load. Resolve package dirs with plain
`path.resolve(dirname, ...)` in the app config (the planned shape) — no cross-package self-resolution
needed at all.

## CHOICE: **baseDir → package `src` dir + rebase** (plan candidate (a); no fallback needed)

`adminUiBase = './admin-ui'` (Task 5 param, Task 8 passes it to `sirilAdminConfig`):

```ts
// apps/admin/payload.config.ts (Task 8 final shape)
admin: {
  importMap: {
    baseDir: path.resolve(dirname, '../../packages/admin/src'),
  },
}
// contract (Task 5): `admin: { components: { Field: `${adminUiBase}/variant-picker` } }`
//   = './admin-ui/variant-picker' → generated: '../../../packages/admin/src/admin-ui/variant-picker'
```

- Contract string stays relative and short; the rebase is done entirely by Payload at
  `generate:importmap`; no component registration anywhere.
- No `transpilePackages` needed in the monorepo (Finding 3 first bullet) — the package `src` is a
  workspace directory, not a `node_modules` module.
- Not chosen: bare-specifier strings (require `transpilePackages` per app while the package ships TS, and
  couple the contract to the package name); fallback (b) is unnecessary.

## Decision template (per brief)

- Chosen: `baseDir=package + rebase`
- Contract string (final): `adminUiBase = './admin-ui'` (with `baseDir` → engine package `src/`; the
  in-app default `./src/admin-ui` remains valid until Task 8 moves the point of baseDir)
- importMap config sample (1:1): see CHOICE block above
- next build: **ok** (see Finding 2 log line)

## Evidence index (scratch app)

- `payload.config.ts` (baseDir → `ext/src`), `src/collections/widget.ts` (field string),
  `ext/src/admin-ui/picker.tsx`, `next.config.mjs` (no `transpilePackages`).
- `app/(payload)/admin/importMap.js` (generated, quoted above).
- `widget-final.html` (SSR 200, `class="picker"`), `widget-edit3.html` (2 pickers with
  `transpilePackages` + bare specifier), `build-final.log`, `dev-out*.log` (200/201/200, no errors),
  `probe.mjs` (pnpm store resolution through `node_modules/.pnpm/ext@file+ext/...`).
