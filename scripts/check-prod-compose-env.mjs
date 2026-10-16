// Собранный web (nuxt build → .output) на рантайме перекрывает runtimeConfig только из NUXT_-переменных.
// Голые PURGE_TOKEN/PAYLOAD_URL из env_file web не видит — остаётся build-time dev-purge-token, и purge из admin
// получает 401. Проверяем, что prod-compose передаёт web NUXT_-имена (и токен — из того же PURGE_TOKEN, что у admin).
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const COMPOSE = resolve(REPO, 'infra/docker-compose.prod.yml')

// Тело сервиса верхнего уровня в compose: строки после `  <name>:` до следующего сервиса/секции.
export function serviceBlock(yaml, name) {
  const lines = yaml.replace(/\r\n/g, '\n').split('\n')
  const start = lines.findIndex((l) => l === `  ${name}:`)
  if (start < 0) return null
  const body = []
  for (const l of lines.slice(start + 1)) {
    if (/^\S/.test(l) || /^ {2}\S/.test(l)) break
    body.push(l)
  }
  return body.join('\n')
}

export const REQUIRED = [
  [/^\s+NUXT_PURGE_TOKEN:\s*\$\{PURGE_TOKEN[:?}]/m, 'NUXT_PURGE_TOKEN: ${PURGE_TOKEN...} (тот же токен, что у admin)'],
  [/^\s+NUXT_PAYLOAD_URL:\s*\S/m, 'NUXT_PAYLOAD_URL'],
]

export function findProblems(yaml) {
  const web = serviceBlock(yaml, 'web')
  if (web == null) return ['нет сервиса web']
  return REQUIRED.filter(([re]) => !re.test(web)).map(([, what]) => `web.environment: нет ${what}`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const problems = findProblems(readFileSync(COMPOSE, 'utf8'))
  if (problems.length) {
    for (const p of problems) console.error(`check-prod-compose-env: infra/docker-compose.prod.yml ${p}`)
    console.error('Собранный Nuxt на рантайме читает только NUXT_-переменные (см. docs/runbooks/prod.md §2.3).')
    process.exit(1)
  }
  console.log('check-prod-compose-env: ok')
}
