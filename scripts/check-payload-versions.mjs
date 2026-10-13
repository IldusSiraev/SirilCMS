// Все `payload` и `@payloadcms/*` во всех workspace-пакетах должны быть запинены (без ^/~) на ОДНУ версию.
// Иначе pnpm ставит две копии (@payloadcms/ui, translations) → разъехавшийся React-контекст, краш админки.
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const roots = ['packages', 'apps']
const found = []
for (const root of roots) {
  if (!existsSync(root)) continue
  for (const dir of readdirSync(root, { withFileTypes: true })) {
    const file = join(root, dir.name, 'package.json')
    if (!dir.isDirectory() || !existsSync(file)) continue
    const pkg = JSON.parse(readFileSync(file, 'utf8'))
    for (const field of ['dependencies', 'devDependencies', 'peerDependencies']) {
      for (const [name, range] of Object.entries(pkg[field] ?? {})) {
        if (name === 'payload' || name.startsWith('@payloadcms/')) found.push({ file, name, range })
      }
    }
  }
}

const problems = []
for (const f of found) if (!/^\d+\.\d+\.\d+$/.test(f.range)) problems.push(`${f.file}: ${f.name}@${f.range} — нужна точная версия (без ^/~)`)
const versions = new Set(found.map(f => f.range))
if (versions.size > 1) problems.push(`разные версии Payload в workspace: ${[...versions].join(', ')}`)

if (problems.length) {
  console.error('check-payload-versions: FAIL\n' + problems.map(p => '  - ' + p).join('\n'))
  process.exit(1)
}
console.log(`check-payload-versions: ok (${found.length} deps, ${[...versions][0]})`)
