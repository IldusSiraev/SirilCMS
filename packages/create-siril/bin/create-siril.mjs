#!/usr/bin/env node
// npx @sirilcms/create-siril <name> [--git] [--engine-version X.Y.Z] [--engine-source <dir-with-tgz>]
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { scaffold, validateName } from '../src/scaffold.mjs'

const USAGE = `usage: create-siril <name> [--git] [--engine-version X.Y.Z] [--engine-source <dir>]

  <name>               имя проекта (kebab-case) = имя каталога, префикс пакетов <name>-admin / <name>-web
  --git                git init + первый коммит
  --engine-version     версия @sirilcms/* (по умолчанию — версия этого генератора: lockstep с движком)
  --engine-source      каталог с tgz пакетов движка (для проверки до публикации; обычно не нужен)`

const args = process.argv.slice(2)
const flag = (n) => args.includes(n)
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined }
const optionValues = new Set([opt('--engine-version'), opt('--engine-source')])
const name = args.find((a) => !a.startsWith('--') && !optionValues.has(a))

if (flag('--help') || flag('-h')) { console.log(USAGE); process.exit(0) }
const bad = validateName(name)
if (bad) { console.error(`create-siril: ${bad}\n\n${USAGE}`); process.exit(2) }

const own = JSON.parse(readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8'))
const engineVersion = opt('--engine-version') ?? own.version
const destDir = resolve(name)

try {
  const files = scaffold({ destDir, vars: { name, engineVersion }, engineSource: opt('--engine-source') })
  console.log(`create-siril: создан проект "${name}" (${files.length} файлов), движок @sirilcms/* ${engineVersion}`)
  if (flag('--git')) {
    execFileSync('git', ['init', '-q'], { cwd: destDir })
    execFileSync('git', ['add', '-A'], { cwd: destDir })
    execFileSync('git', ['commit', '-q', '-m', `chore: scaffold ${name} (create-siril ${engineVersion})`], { cwd: destDir })
    console.log('create-siril: git init + первый коммит')
  }
  console.log(`\nДальше:\n  cd ${name}\n  # токен GitHub Packages (read:packages): pnpm config set "//npm.pkg.github.com/:_authToken" <PAT>\n  pnpm install && cp .env.example .env\n  pnpm dev:pg && pnpm setup && pnpm migrate && pnpm dev\n\nПодробности — README.md в проекте.`)
} catch (e) {
  console.error(`create-siril: ${e.message}`)
  process.exit(1)
}
