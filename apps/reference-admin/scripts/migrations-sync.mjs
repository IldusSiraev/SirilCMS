import path from 'path'
import { fileURLToPath } from 'url'
import { cpSync, mkdirSync, readdirSync, rmSync } from 'fs'

// S0.1b copy-sync: migrations live in packages/admin/src/migrations (SSOT);
// `payload migrate` runs in the app and reads the app's src/migrations dir,
// so copy the *.ts migrations over before migrate. index.ts/template.ts are
// package internals and never copied; stale copies are removed afterwards.
const scriptsDir = path.dirname(fileURLToPath(import.meta.url))
const src = path.resolve(scriptsDir, '../../../packages/admin/src/migrations')
const dst = path.resolve(scriptsDir, '../src/migrations')

mkdirSync(dst, { recursive: true })

const SKIP = new Set(['index.ts', 'template.ts'])
const srcFiles = readdirSync(src).filter((f) => f.endsWith('.ts') && !SKIP.has(f))

for (const file of srcFiles) {
  cpSync(path.join(src, file), path.join(dst, file))
}

const copied = new Set(srcFiles)
for (const file of readdirSync(dst).filter((f) => f.endsWith('.ts'))) {
  if (!copied.has(file)) {
    rmSync(path.join(dst, file))
    console.log(`migrations:sync: removed stale ${file}`)
  }
}

console.log(`migrations:sync: copied ${srcFiles.length} file(s) from ${src} to ${dst}`)
