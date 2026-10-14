// Сборка пакетов движка (contracts → web → admin) с межпроцессной блокировкой.
// `pnpm install` в монорепо запускает postinstall'ы нескольких web-приложений (reference-web, example-web)
// ПАРАЛЛЕЛЬНО, и каждый вызывает сборку пакетов: одновременная запись в packages/*/dist (vue-tsc, unbuild, чистка d.ts)
// ломала сборку («ENOENT … Placeholder.d.vue.ts»). Первый процесс собирает, остальные ждут и выходят.
import { execSync } from 'node:child_process'
import { mkdirSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const lock = join(tmpdir(), `siril-build-packages-${createHash('sha1').update(root).digest('hex').slice(0, 10)}.lock`)
const STALE_MS = 10 * 60_000
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function acquire() {
  const deadline = Date.now() + STALE_MS
  for (;;) {
    try {
      mkdirSync(lock)
      return true
    } catch (e) {
      if (e.code !== 'EEXIST') throw e
      try { if (Date.now() - statSync(lock).mtimeMs > STALE_MS) rmSync(lock, { recursive: true, force: true }) } catch { /* гонка с освобождением */ }
      // Ждём, пока владелец закончит: после этого пакеты уже собраны им.
      while (true) {
        try { statSync(lock) } catch { return false }
        if (Date.now() > deadline) throw new Error('build-packages: timeout ожидания блокировки')
        await sleep(500)
      }
    }
  }
}

if (await acquire()) {
  try {
    for (const pkg of ['contracts', 'web', 'admin']) execSync(`pnpm --filter @sirilcms/${pkg} build`, { cwd: root, stdio: 'inherit' })
  } finally {
    rmSync(lock, { recursive: true, force: true })
  }
} else {
  console.log('build-packages: собрано параллельным процессом, пропускаю')
}
