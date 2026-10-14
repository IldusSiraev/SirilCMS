// Шаблонная обвязка (Next/Payload/Nuxt boilerplate) живёт в двух местах: templates/project (источник для create-siril)
// и examples/minimal-project (проверяется в CI end-to-end). Эти файлы обязаны быть побайтно одинаковыми —
// иначе пример перестаёт доказывать, что шаблон работает.
// Имена `_gitignore` в шаблоне = `.gitignore` в примере (npm не публикует dotfiles).
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const T = join(REPO, 'templates/project')
const E = join(REPO, 'examples/minimal-project')

// [путь в шаблоне, путь в примере]
export const SHARED = [
  ['admin/app/(payload)/layout.tsx'],
  ['admin/app/(payload)/custom.css'],
  ['admin/app/(payload)/admin/[[...segments]]/page.tsx'],
  ['admin/app/(payload)/admin/[[...segments]]/not-found.tsx'],
  ['admin/app/(payload)/api/[...slug]/route.ts'],
  ['admin/app/(frontend)/layout.tsx'],
  ['admin/app/(frontend)/page.tsx'],
  ['admin/app/globals.css'],
  ['admin/next.config.mjs'],
  ['admin/tsconfig.json'],
  ['admin/scripts/ts-loader/index.mjs'],
  ['admin/scripts/ts-loader/loader.mjs'],
  ['admin/scripts/fix-migration-imports.mjs'],
  ['web/app/app.vue'],
  ['web/app/error.vue'],
  ['web/tsconfig.json'],
]

const norm = (p) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n')

export function findDrift(templateDir = T, exampleDir = E) {
  const drift = []
  for (const [t, e = t] of SHARED) {
    const a = join(templateDir, t)
    const b = join(exampleDir, e)
    if (!existsSync(a)) drift.push(`${t}: нет в шаблоне`)
    else if (!existsSync(b)) drift.push(`${e}: нет в примере`)
    else if (norm(a) !== norm(b)) drift.push(`${t}: отличается от examples/minimal-project/${e}`)
  }
  return drift
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const drift = findDrift()
  if (drift.length) {
    for (const d of drift) console.error(`check-template-sync: ${d}`)
    console.error('Правьте оба места одинаково (шаблон — источник, пример — его проверка в CI).')
    process.exit(1)
  }
  console.log(`check-template-sync: ok (${SHARED.length} shared files)`)
}
