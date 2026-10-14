// Логика генератора проекта: валидация имени, подстановка токенов, копирование шаблона.
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = fileURLToPath(new URL('.', import.meta.url))

/** Имя проекта: kebab-case, будет префиксом пакетов `<name>-admin` / `<name>-web`. */
export function validateName(name) {
  if (!name) return 'не указано имя проекта'
  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name)) return `имя "${name}" должно быть в kebab-case: строчные латинские буквы, цифры и дефисы, начинается с буквы`
  if (name.length > 40) return 'имя длиннее 40 символов'
  return null
}

/** Заменяет `{{key}}`; неизвестный токен — ошибка (шаблон не должен тихо оставлять плейсхолдеры). */
export function renderTokens(text, vars) {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in vars)) throw new Error(`неизвестный токен {{${key}}}`)
    return String(vars[key])
  })
}

// npm не публикует dotfiles `.gitignore`/`.npmrc` → в шаблоне они лежат как `_gitignore`/`_npmrc`
const RENAMES = { _gitignore: '.gitignore', _npmrc: '.npmrc' }
const SKIP_DIRS = new Set(['node_modules', '.nuxt', '.output', '.next', '.data'])
const BINARY_EXT = /\.(png|jpe?g|gif|ico|webp|woff2?|ttf|otf|pdf|zip|tgz)$/i

/** Путь к шаблону: `template/` в опубликованном пакете, иначе `templates/project` монорепо. */
export function resolveTemplateDir() {
  for (const p of [resolve(HERE, '../template'), resolve(HERE, '../../../templates/project')]) if (existsSync(p)) return p
  throw new Error('шаблон проекта не найден (template/ или templates/project)')
}

function* walk(dir, rel = '') {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue
    const r = rel ? `${rel}/${entry.name}` : entry.name
    if (entry.isDirectory()) yield* walk(join(dir, entry.name), r)
    else yield r
  }
}

/**
 * Создаёт проект в destDir. vars: { name, engineVersion }.
 * engineSource (необязательно) — каталог с tgz пакетов движка: зависимости `@sirilcms/*` заменяются на `file:` и
 * добавляются pnpm overrides (нужно для проверки шаблона до публикации — CI «template freshness»).
 */
/** @param {{ templateDir?: string, destDir: string, vars: Record<string, string>, engineSource?: string }} opts */
export function scaffold({ templateDir = resolveTemplateDir(), destDir, vars, engineSource }) {
  if (existsSync(destDir) && readdirSync(destDir).length > 0) throw new Error(`каталог ${destDir} не пуст`)
  mkdirSync(destDir, { recursive: true })
  const created = []
  for (const rel of walk(templateDir)) {
    const parts = rel.split('/')
    const base = parts.pop()
    const outRel = [...parts, RENAMES[base] ?? base].join('/')
    const target = join(destDir, outRel)
    mkdirSync(join(target, '..'), { recursive: true })
    if (BINARY_EXT.test(base)) cpSync(join(templateDir, rel), target)
    else writeFileSync(target, renderTokens(readFileSync(join(templateDir, rel), 'utf8'), vars))
    created.push(outRel)
  }
  if (engineSource) applyEngineSource(destDir, engineSource, vars.engineVersion)
  return created
}

/** Подменяет зависимости движка на локальные tgz (абсолютные пути, прямые слэши — работает и на Windows). */
/** @param {string} destDir @param {string} engineSource @param {string} engineVersion */
export function applyEngineSource(destDir, engineSource, engineVersion) {
  const dir = resolve(engineSource).split('\\').join('/')
  const tgz = (pkg) => `file:${dir}/sirilcms-${pkg}-${engineVersion}.tgz`
  for (const pkgFile of ['package.json', 'admin/package.json', 'web/package.json']) {
    const file = join(destDir, pkgFile)
    const pkg = JSON.parse(readFileSync(file, 'utf8'))
    for (const field of ['dependencies', 'devDependencies']) {
      for (const dep of Object.keys(pkg[field] ?? {})) {
        const m = /^@sirilcms\/(contracts|web|admin)$/.exec(dep)
        if (m) pkg[field][dep] = tgz(m[1])
      }
    }
    writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n')
  }
  // web/admin-пакеты движка зависят от contracts по точной версии из реестра → переопределяем на tgz
  const ws = join(destDir, 'pnpm-workspace.yaml')
  writeFileSync(ws, readFileSync(ws, 'utf8').trimEnd() + `\n\noverrides:\n  "@sirilcms/contracts": "${tgz('contracts')}"\n`)
}

