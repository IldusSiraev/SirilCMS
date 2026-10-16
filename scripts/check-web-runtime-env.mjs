// Smoke собранного reference-web: PURGE_TOKEN, заданный на рантайме как NUXT_PURGE_TOKEN, должен перекрывать
// build-time значение (так prod-compose передаёт токен web). Запуск после `pnpm --filter @sirilcms/reference-web build`:
//   node scripts/check-web-runtime-env.mjs
import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const SERVER = resolve(REPO, 'apps/reference-web/.output/server/index.mjs')
const PORT = process.env.CHECK_PORT ?? '3999'
const BASE = `http://127.0.0.1:${PORT}`

if (!existsSync(SERVER)) {
  console.error(`check-web-runtime-env: нет ${SERVER} — сначала pnpm --filter @sirilcms/reference-web build`)
  process.exit(1)
}

const token = `runtime-${randomBytes(12).toString('hex')}`
const env = { ...process.env, PORT, NUXT_PURGE_TOKEN: token }
delete env.PURGE_TOKEN // голое имя на рантайме ни на что не влияет — убираем, чтобы проверка не зависела от него
const server = spawn(process.execPath, [SERVER], { env, stdio: ['ignore', 'inherit', 'inherit'] })

const purge = (bearer) =>
  fetch(`${BASE}/api/purge`, { method: 'POST', headers: { authorization: `Bearer ${bearer}` } }).then((r) => r.status)

let failed = false
try {
  let up = false
  for (let i = 0; i < 60 && !up; i++) {
    up = await fetch(`${BASE}/api/health`).then((r) => r.ok, () => false)
    if (!up) await new Promise((r) => setTimeout(r, 500))
  }
  if (!up) throw new Error('web не поднялся за 30 с')
  const checks = [
    ['Bearer NUXT_PURGE_TOKEN', await purge(token), 200],
    ['Bearer dev-purge-token', await purge('dev-purge-token'), 401],
  ]
  for (const [what, got, want] of checks) {
    const ok = got === want
    if (!ok) failed = true
    console.log(`check-web-runtime-env: ${what} -> ${got} (ожидается ${want})${ok ? '' : '  FAIL'}`)
  }
} catch (e) {
  failed = true
  console.error(`check-web-runtime-env: ${e.message}`)
} finally {
  server.kill()
}
process.exit(failed ? 1 : 0)
