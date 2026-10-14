# Spike S0.1b — Payload migration directory for engine platform (core + project, one Postgres)

- Date: 2026-09-27
- Spike: S0.1b (task-2, plan 2026-09-27-engine-platform-s0-a)
- Environment: payload 3.90.1, @payloadcms/db-postgres 3.90.1, node v22.22.2, Docker Desktop 4.91 / postgres:16 on :5434
- Scratch app: `C:\Users\iisiraev\AppData\Local\Temp\opencode\siril-s02` (not committed)

## Question

How will the future `@sirilcms/admin` engine package ship Payload core migrations while a project
developed on the platform keeps its own migrations, all on the same Postgres?
Candidate mechanisms: (a) a config/adapter migrations-directory option, (b) copy-sync.

## Finding 1 — there is NO `config.migrations.dir` in Payload 3.90.1

Hypothesized `buildConfig({ migrations: { dir: ... } })` is a TypeScript error (verified with `tsc --noEmit` on the scratch app, `payload 3.90.1`):

```
typecheck/config-migrations.ts(7,3): error TS2353: Object literal may only specify known
properties, and 'migrations' does not exist in type 'Config'.
```

`dist/config/types.d.ts` (Config type, line 654) contains no key matching `migrations` at all.

The real knob is on the **adapter**: `postgresAdapter({ migrationDir?: string })`
(`@payloadcms/db-postgres/dist/types.d.ts:45`). It is a single string; `createDatabaseAdapter`
passes it to `findMigrationDir(migrationDir)` and stores it as `payload.db.migrationDir`.
Default search order (relative to cwd): `src/migrations` → `dist/migrations` → `migrations`.

## Finding 2 — exactly ONE directory is read, per run

`payload/dist/database/migrations/readMigrationFiles.js` reads only `payload.db.migrationDir`
(sorted, `*.ts`/`*.js`, excludes `index.*`), with `name = basename.split('.')[0]`
(the full filename without extension, timestamp prefix included).

Proven at runtime:

| run | resolved dir | files read/ applied | tables after |
|---|---|---|---|
| A (no option, default) | `src/migrations` | `1758879900000_zero_init`, `1758880001000_proj_1_add_table` (batch 1) | `proj_t` only — **`core_t` absent** |
| B (`migrationDir: core-migrations`) | `core-migrations` | `1758880000000_core_1_add_table` (batch 2) | `core_t` added; src files invisible |

A single `migrationDir` cannot point at both the node_modules package dir and the project dir
(at the same time). So mechanism (a) alone is **insufficient** — the core and project migrations
must end up in one shared directory.

## Finding 3 — copy-sync is idempotent (dedupe by name, cross-dir)

After copying the core file into `src/migrations` (`scripts/sync-core-migrations.mjs`) and
running `payload migrate` with the default dir: "Reading migration files from
`…\src\migrations`" → **no migrations applied, exit 0**, even though `core_1` was previously
applied from a *different* directory. `migrate.js` (drizzle) dedupes by name against
`payload_migrations`: `alreadyRan = migrationsInDB.find(existing => existing.name === migration.name) → skip`.

## Findings 4–5 — tracking table and batch quirks

- The tracking table is **`payload_migrations`** (`id serial PK, name varchar, batch numeric,
  updated_at, created_at`) — not auto-created by the CLI: a zero-state run *before* any migration
  created the table failed with `relation "payload_migrations" does not exist` (migration DDL
  rolled back). The **first** generated migration must create it, exactly as the repo's
  `20260922_173634_init_sites_media_users.ts:110` does.
- `batch` is **not a monotonic counter**: `newBatch = (row with lexicographically largest
  `name`).batch + 1` (`migrate.js:25-49`, `sort: '-name'`). Observed: a batch-3-era run stored
  new migrations in **batch 2**. Treat `batch` as informational; dedupe/ordering only relies on
  `name` (and `payload_migrations.name` = full filename). Don't build tooling on monotonic batches.
- Same-timestamp-prefix collision (`1758880100000_core_x.ts` + `1758880100000_proj_x.ts`):
  both applied fine in one run (file order = lexicographic), two distinct `name` rows recorded.
  A collision only happens on **identical full filenames**, which is also what copy-sync protects
  against implicitly: a same-named file in core and project is one file after the copy, one
  recorded name — the core side silently wins. Convention to enforce: core and project
  migrations must never share a full filename (prefix is fine).

## CHOICE: **copy-sync** (with `migrationDir` as the optional location switch)

The engine package ships migrations as a plain directory, e.g.
`@sirilcms/admin/migrations/*.ts` (append-only, same `<timestampMs>_<slug>.ts` convention).
The project keeps its own `src/migrations`. Before `payload migrate` the project syncs
core migrations into its own single directory:

```js
// scripts/sync-core-migrations.mjs (scratch-verified, idempotent)
import { cpSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const coreDir = path.dirname(fileURLToPath(import.meta.resolve('@sirilcms/admin/migrations/package.json')))
const destDir = path.resolve(here, '..', 'src', 'migrations')

for (const f of readdirSync(coreDir).sort()) {
  if (f.endsWith('.ts') || f.endsWith('.js')) {
    cpSync(path.join(coreDir, f), path.join(destDir, f), { force: false })
  }
}
```

Project script wiring: `"migrate": "node scripts/sync-core-migrations.mjs && payload migrate"`.

Why copy-sync over `migrationDir`-pointing:
1. Payload reads exactly one directory (Findings 1–2); pointing `migrationDir` at the package
   dir would make project migrations unreachable until they are also copied there — same copy,
   worse location (writing into node_modules).
2. Dedupe by name (Finding 3) makes re-copying an already-applied migration a no-op — no
   re-run, no error, verified across directories.
3. One physical directory + one `payload_migrations` ledger = one ordering/audit surface, and
   `migrate:generate` / `migrate:down` etc. keep working unchanged.

Config stays 1:1 with the repo (default dir); `migrationDir` is only needed if the project wants
a non-`src/migrations` layout:

```ts
// payload.config.ts — 1:1 with the working repo config (optional switch):
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'

const root = path.dirname(fileURLToPath(import.meta.url))

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET!,
  db: postgresAdapter({
    pool: { connectionString: process.env.PAYLOAD_DB_URI },
    // optional; omit to use default src/migrations
    // migrationDir: path.join(root, 'migrations'),
  }),
  // NO `migrations` key exists — TS2353
})
```

Prerequisites the platform must carry (verified here, currently implicit knowledge):

1. The platform's first migration creates `payload_migrations` (Finding 4).
2. Core migrations are append-only, full filenames globally unique (Finding 5).
3. `payload_migrations.name` = full filename — a renamed migration file = "not applied";
   treat migration filenames as immutable after first apply.

## Evidence index (scratch app)

- Files: `payload.config.ts` (env-switched `migrationDir`), `src/migrations/1758879900000_zero_init.ts`,
  `1758880001000_proj_1_add_table.ts`, `1758880100000_{core,proj}_x.ts`,
  `core-migrations/1758880000000_core_1_add_table.ts`, `scripts/sync-core-migrations.mjs`,
  `typecheck/config-migrations.ts`.
- Final `payload_migrations`: `zero_init|1`, `proj_1|1`, `core_1|2`, `core_x|2`, `proj_x|2`;
  tables: `core_t`, `proj_t`, `core_x_t`, `proj_x_t`, `payload_migrations`.
