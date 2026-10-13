// Правило проекта (spec §6): файл ядра нельзя копировать в проект «ради правки» — только полная замена
// (override, содержимое отличается) или новый путь. Идентичная копия = будущий merge-конфликт при обновлении движка.
// Использование: node scripts/check-no-core-copies.mjs <webProjectDir> [...]   (по умолчанию examples/*/web)
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const CORE_RUNTIME = join(REPO, 'packages/web/src/runtime')
// <корень проекта>/<каталог> ↔ каталог core runtime
const MAPPINGS = [['app', 'app'], ['server', 'server']]

function* walk(dir) {
  if (!existsSync(dir)) return
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue
    const full = join(dir, name)
    if (statSync(full).isDirectory()) yield* walk(full)
    else yield full
  }
}

/** Возвращает список проектных файлов, байт-в-байт совпадающих с core-файлом по тому же относительному пути. */
export function findCoreCopies(projectDir, coreRuntimeDir = CORE_RUNTIME) {
  const copies = []
  for (const [projSub, coreSub] of MAPPINGS) {
    const projRoot = join(projectDir, projSub)
    for (const file of walk(projRoot)) {
      const coreFile = join(coreRuntimeDir, coreSub, relative(projRoot, file))
      if (existsSync(coreFile) && readFileSync(coreFile).equals(readFileSync(file))) copies.push(relative(projectDir, file))
    }
  }
  return copies
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dirs = process.argv.slice(2)
  if (dirs.length === 0 && existsSync(join(REPO, 'examples'))) {
    for (const ex of readdirSync(join(REPO, 'examples'))) {
      const web = join(REPO, 'examples', ex, 'web')
      if (existsSync(web)) dirs.push(web)
    }
  }
  let failed = false
  for (const dir of dirs) {
    const copies = findCoreCopies(resolve(dir))
    for (const c of copies) {
      console.error(`check-no-core-copies: ${dir}: ${c} — идентичная копия core-файла. Удалите её или измените (override) / переименуйте (новый путь).`)
      failed = true
    }
  }
  if (failed) process.exit(1)
  console.log(`check-no-core-copies: ok (${dirs.length} project(s))`)
}
