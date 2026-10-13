# S0.1 Spike — Nuxt module overlay + theme-raw template

Date: 2026-09-27
Toolchain: Node v22.22.2, nuxt@4.5.2 (nitropack 2.13.4, vite 8.3.1, vue 3.5.43)
Scratch dir (scratch only, **never committed**): `C:\Users\iisiraev\AppData\Local\Temp\opencode\siril-s01`

## Decision (read this first)

A Nuxt 4 module **can** contribute an app layer (pages, layouts, components, nitro server routes,
server middleware) via `_layers.push` from its own runtime dir, with **no manual registration** in the
consuming app. A template written with `addTemplate({ write: true })` lands on disk in the app's `.nuxt/`
and is importable app-side via the `#build/<filename>` alias. The theme CSS glob must use a
**root-relative `/themes/...` pattern** inside the generated virtual module (`./...` and absolute
`C:/...` patterns do not resolve to the project root).

Copy-paste sample for Task 9 (S.0 module skeleton) — verified shape:

```ts
// module/src/module.ts
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { addTemplate, createResolver, defineNuxtModule } from '@nuxt/kit'

export default defineNuxtModule({
  meta: { name: 'mod', configKey: 'mod' },
  setup(options, nuxt) {
    const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))
    nuxt.options._layers.push({
      srcDir: join(runtimeDir, 'app'),
      package: 'mod',
      config: {
        rootDir: runtimeDir,
        srcDir: join(runtimeDir, 'app'),
      },
    })
    addTemplate({
      filename: 'mod-probe.gen.mjs',
      write: true,
      getContents: () =>
        "export const probe = import.meta.glob('/themes/*/tokens.css', { query: '?raw', import: 'default' })\n",
    })
  },
})
```

Layout contributed by the module (all of these resolved — see evidence):

```
module/
  src/module.ts
  src/runtime/
    app/pages/*.vue        -> merged into route table (app layer wins on name collision)
    app/layouts/*.vue      -> merged into layouts (app layer wins on name collision)
    app/components/*.vue   -> auto-imported, no manual registration
    server/api/*.ts        -> merged into nitro routes (app layer wins)
    middleware/*.ts        -> server middleware
    themes/<id>/tokens.css -> picked up by the /themes glob (see note)
```

## Question (from task brief)

Prove in a scratch dir that a Nuxt 4 module can:
1. Inject an app layer (pages, layouts, components, nitro server routes, server middleware) via
   `_layers.push` from its own runtime dir — no manual registration in the consuming app.
2. Add a template via `addTemplate` that lands in the app's `.nuxt/` and is importable via
   `#build/<filename>`.
3. Prove the dual-glob from the theme design: `themes/<id>/tokens.css` resolves to a real absolute
   path, and the module can glob it raw (`?raw`).

## Setup

Scratch skeleton per brief:

```
siril-s01/
  mod/                      # the Nuxt module (candidate B)
    src/module.ts
    src/runtime/app/pages/mod-test.vue    -> <div>mod-test-page</div>
    src/runtime/app/layouts/mod.vue       -> <div class="mod-layout">...<slot/></div>
    src/runtime/app/components/ModBadge.vue -> <span class="module-badge">module-badge</span>
    src/runtime/server/api/mod.get.ts      -> { src: 'module' }
    src/runtime/themes/default/tokens.css  -> .mod-token{}
  app/                      # consuming Nuxt app (port 3456)
    nuxt.config.ts          -> compatibilityDate '2025-07-15', modules ['mod'], mod: {}
    pages/index.vue         -> <div>app-index</div>
    pages/mod-test.vue      -> <div>app-page ... <AppBadge/> </div>   (layout: 'mod')
    pages/mod-probe.vue     -> <div>module-probe ... <ModBadge/> </div> (layout: 'mod')
    pages/glob-probe.vue    -> imports '#build/mod-probe.gen.mjs', renders Object.keys(probe)
    components/AppBadge.vue -> <span class="app-badge">app-badge</span>
    layouts/mod.vue         -> <div class="app-layout">...<slot/></div>
    server/api/mod.get.ts   -> { src: 'app' }
    themes/default/tokens.css -> .app-token{}
```

`app` resolves `mod` to `../mod` via file path in `modules`. Install: `npm i nuxt vue --registry
https://registry.npmjs.org` (the default registry in this env is a Nexus mirror that lacks nuxt 4 packuments).

## Evidence

Dev server: `node node_modules\nuxt\bin\nuxt.mjs dev --port 3456` (serves over `[::1]`).

1. **Candidate B (`_layers.push`) boots clean** — no `Cannot find module` / overlay errors.
   `dev-out.log`:
   ```
   ✓ Nuxt Nitro server built in 2140ms
   ```

2. **Layer merge / precedence** — `GET /mod-test` → 200. Both `app-page`, `app-layout`, `app-badge`
   found; `mod-test-page`, `module-badge` absent. App page + app layout + app component win over the
   module's same-named page/layout. (The module's page still exists and is used when the app has no
   collision — see #4.)
   `GET /api/mod` → 200 body `{"src":"app"}`. App's nitro route beats the module's `mod.get.ts`.

3. **Module-only page renders** — `GET /mod-probe` (app has no `mod-probe.vue`) → 200.
   `module-probe` + `module-badge` found, `mod-layout` absent (app layout `app-layout` used —
   collision on layout name `mod` goes to app). Confirms module page **and** module component
   auto-import resolve without any registration in the app.

4. **App index** — `GET /` → 200, `app-index` found.

5. **Dual-glob / raw theme template** — `GET /glob-probe` → 200:
   `glob-probe keys=[1]` with key `themes/default/tokens.css`.
   The generated file on disk, `app/.nuxt/mod-probe.gen.mjs`:
   ```js
   export const probe = import.meta.glob('/themes/*/tokens.css', { query: '?raw', import: 'default' })
   ```
   `#build/mod-probe.gen.mjs` resolves (alias → `.nuxt/mod-probe.gen.mjs`) in the page SFC. Vite
   compiles the raw-import glob at transform time; the single `themes/default/tokens.css` file
   resolves and is importable with `query: '?raw'`.

6. **Glob pattern constraint (gotcha, verified):** in the template virtual module, the glob must be
   **root-relative** (`/themes/...`).
   - `./themes/*/tokens.css` → Vite: `Invalid glob ... It must start with '/' or './'` (relative to a
     non-root base resolves under `.nuxt/`).
   - Absolute `C:/Users/.../themes/*/tokens.css` → same `Invalid glob` error (Vite rejects
     absolute-path globs in this context).
   - `/themes/*/tokens.css` → works, keys=[1].
   So Task 9 should generate the pattern as `/` + `posix.join(relativeThemesDir)` (root-relative), not
   an absolute Windows path. (In the real app the themes dir is the web app root, so `/themes/...`
   is the natural form.)

## Deviations from the plan (disclosed)

- Added a second app page (`mod-probe.vue`/`glob-probe.vue`) and a module-only page to isolate
  "module contributes a page the app doesn't have" from the collision case. Plan's three curl checks
  are all covered; these give clearer precedence evidence.
- Kept `mod: {}` (empty options object) per brief; `createResolver`/options not needed for this spike.
- No commit was made in the scratch dir (it is not a repo). Only this decision doc is to be committed.

## Risks / unknowns for Task 9

- Production build (`nuxt build`) not exercised — only dev. Raw-import globs + `_layers` should behave
  the same, but S.0 should run `nuxt build` before relying on it for the theme-raw template.
- The `?raw` template is a generated virtual module; confirm it also resolves under the Nitro SSR
  server route (not just the page) when `apps/web` reads theme tokens server-side.
