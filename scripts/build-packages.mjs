// Сборка пакетов движка (contracts → web → admin): идемпотентно и безопасно при параллельном запуске.
// `pnpm install` запускает root `prepare` и postinstall'ы нескольких web-приложений (reference-web, example-web)
// одновременно/вперемешку, и каждый вызывает сборку: параллельная запись в packages/*/dist ломала её
// («ENOENT … Placeholder.d.vue.ts» — в CI и в Docker-сборке образов).
// Схема: межпроцессная блокировка (mkdir) + отметка «собрано для хеша исходников». Под блокировкой процесс сверяет
// отметку: исходники не менялись и dist на месте → ничего не делает; иначе собирает и пишет отметку.
// Итог: на одно состояние исходников — одна сборка, даже если процессы стартуют с задержкой друг от друга.
import { execSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const rootHash = createHash('sha1').update(root).digest('hex').slice(0, 10)
const lock = join(tmpdir(), `siril-build-packages-${rootHash}.lock`)
const stampFile = join(root, 'node_modules', '.cache', 'siril-build-packages.stamp')
const STALE_MS = 10 * 60_000
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Инструменты запускаем напрямую через node (bin пакета), а не через `pnpm --filter … build` или npx:
// pnpm 11 перед `run` может сам запустить `pnpm install` (verifyDepsBeforeRun) → postinstall'ы → повторный вход
// в этот скрипт и зависание; npx на Windows добавляет ~30 с на каждый вызов.
function binCommand(dir, pkg, bin, args = '') {
  // package.json не всегда в exports пакета (unbuild) — берём путь из node_modules напрямую (pnpm-симлинк на пакет)
  const pkgJsonPath = join(root, dir, 'node_modules', pkg, 'package.json')
  const pj = JSON.parse(readFileSync(pkgJsonPath, 'utf8'))
  const rel = typeof pj.bin === 'string' ? pj.bin : pj.bin[bin]
  return `node "${join(dirname(pkgJsonPath), rel)}" ${args}`.trim()
}

const BUILDS = [
  ['packages/contracts', () => [binCommand('packages/contracts', 'unbuild', 'unbuild')]],
  ['packages/web', () => [binCommand('packages/web', '@nuxt/module-builder', 'nuxt-module-build', 'build'), 'node scripts/clean-runtime-dts.mjs']],
  ['packages/admin', () => [binCommand('packages/admin', 'unbuild', 'unbuild')]],
]
const OUTPUTS = ['packages/contracts/dist/index.mjs', 'packages/web/dist/module.mjs', 'packages/admin/dist/index.js']
const SOURCES = [
  'packages/contracts/src', 'packages/contracts/package.json',
  'packages/web/src', 'packages/web/scripts', 'packages/web/package.json',
  'packages/admin/src', 'packages/admin/build.config.ts', 'packages/admin/package.json',
  'scripts/build-packages.mjs',
]

function* files(path) {
  const full = join(root, path)
  if (!existsSync(full)) return
  if (statSync(full).isFile()) { yield path; return }
  for (const name of readdirSync(full).sort()) yield* files(`${path}/${name}`)
}

function sourcesHash() {
  const h = createHash('sha1')
  for (const src of SOURCES) for (const f of files(src)) h.update(f).update(readFileSync(join(root, f)))
  return h.digest('hex')
}

async function acquire() {
  const deadline = Date.now() + STALE_MS
  for (;;) {
    try { mkdirSync(lock); return } catch (e) {
      if (e.code !== 'EEXIST') throw e
      try { if (Date.now() - statSync(lock).mtimeMs > STALE_MS) rmSync(lock, { recursive: true, force: true }) } catch { /* гонка с освобождением */ }
      if (Date.now() > deadline) throw new Error('build-packages: timeout ожидания блокировки')
      await sleep(300)
    }
  }
}

// Вложенный вызов во время сборки (на случай, если инструмент всё же запустит install/prepare) обязан выйти сразу,
// иначе он ждёт блокировку, которую держит родитель (взаимная блокировка).
if (process.env.SIRIL_BUILD_PACKAGES_ACTIVE === '1') {
  console.log('build-packages: вложенный вызов во время сборки, пропускаю')
  process.exit(0)
}

await acquire()
try {
  const hash = sourcesHash()
  const upToDate = existsSync(stampFile) && readFileSync(stampFile, 'utf8') === hash && OUTPUTS.every((o) => existsSync(join(root, o)))
  if (upToDate) {
    console.log('build-packages: пакеты уже собраны для текущих исходников, пропускаю')
  } else {
    const env = { ...process.env, SIRIL_BUILD_PACKAGES_ACTIVE: '1' }
    for (const [dir, cmds] of BUILDS) {
      for (const cmd of cmds()) execSync(cmd, { cwd: join(root, dir), stdio: 'inherit', env })
    }
    mkdirSync(join(root, 'node_modules', '.cache'), { recursive: true })
    writeFileSync(stampFile, hash)
  }
} finally {
  rmSync(lock, { recursive: true, force: true })
}
