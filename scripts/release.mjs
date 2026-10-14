// Lockstep-релиз движка: бамп версии @sirilcms/{contracts,web,admin}, перенос [Unreleased] в CHANGELOG,
// коммит `release: vX.Y.Z` и тег. НЕ пушит — push тега запускает publish-workflow (.github/workflows/publish-packages.yml).
//
//   node scripts/release.mjs <major|minor|patch|X.Y.Z> [--dry-run]
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { RELEASE_PACKAGES, assertGreaterThanReleased, assertLockstep, nextVersion, rollChangelog } from './release-lib.mjs'

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const args = process.argv.slice(2)
const dry = args.includes('--dry-run')
const kind = args.find((a) => !a.startsWith('--'))
if (!kind) {
  console.error('usage: node scripts/release.mjs <major|minor|patch|X.Y.Z> [--dry-run]')
  process.exit(2)
}

const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8' }).trim()
const readJson = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'))

try {
  const pkgs = Object.fromEntries(RELEASE_PACKAGES.map((d) => [d, readJson(`${d}/package.json`)]))
  const current = assertLockstep(Object.fromEntries(Object.entries(pkgs).map(([d, p]) => [p.name, p.version])))
  const version = nextVersion(current, kind)

  if (!dry) {
    if (git('status', '--porcelain', '--untracked-files=no')) throw new Error('рабочее дерево не чистое — закоммитьте/отложите изменения')
    const branch = git('rev-parse', '--abbrev-ref', 'HEAD')
    if (branch !== 'main') throw new Error(`релиз делается с main (сейчас ${branch})`)
    if (git('tag', '--list', `v${version}`)) throw new Error(`тег v${version} уже существует`)
  }

  const date = new Date().toISOString().slice(0, 10)
  const changelogPath = join(ROOT, 'CHANGELOG.md')
  assertGreaterThanReleased(version, readFileSync(changelogPath, 'utf8'))
  const rolled = rollChangelog(readFileSync(changelogPath, 'utf8'), version, date)

  console.log(`release: ${current} -> ${version}${dry ? ' (dry-run, ничего не записано)' : ''}`)
  for (const d of RELEASE_PACKAGES) console.log(`  ${pkgs[d].name} ${current} -> ${version}`)
  if (dry) process.exit(0)

  for (const d of RELEASE_PACKAGES) {
    const file = join(ROOT, d, 'package.json')
    const raw = readFileSync(file, 'utf8')
    writeFileSync(file, raw.replace(`"version": "${current}"`, `"version": "${version}"`))
  }
  writeFileSync(changelogPath, rolled)
  git('add', 'CHANGELOG.md', ...RELEASE_PACKAGES.map((d) => `${d}/package.json`))
  git('commit', '-m', `release: v${version}`)
  git('tag', '-a', `v${version}`, '-m', `v${version}`)
  console.log(`\nготово: коммит и тег v${version} созданы локально.\nопубликовать: git push origin main v${version}`)
} catch (e) {
  console.error(`release: ${e.message}`)
  process.exit(1)
}
