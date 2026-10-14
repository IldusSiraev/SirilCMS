// `payload migrate:create` генерирует `import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'`:
// типы импортируются как значения и Node ESM падает при `payload migrate` («does not provide an export named MigrateDownArgs»).
// Разделяем на `import type { … }` и `import { sql }` во всех миграциях проекта (идемпотентно).
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const dir = resolve(process.argv[2] ?? 'src/migrations')
const BAD = "import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'"
const GOOD = "import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'\nimport { sql } from '@payloadcms/db-postgres'"
let fixed = 0
for (const name of readdirSync(dir)) {
  if (!name.endsWith('.ts') || name === 'index.ts') continue
  const file = join(dir, name)
  const src = readFileSync(file, 'utf8')
  if (src.includes(BAD)) { writeFileSync(file, src.replace(BAD, GOOD)); fixed++ }
}
if (fixed) console.log(`fix-migration-imports: fixed ${fixed} migration(s)`)
