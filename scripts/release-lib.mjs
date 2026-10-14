// Чистая логика релиза (lockstep-версии @sirilcms/*). CLI — scripts/release.mjs.

export const RELEASE_PACKAGES = ['packages/contracts', 'packages/web', 'packages/admin', 'packages/create-siril']

const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/

/** `kind`: major|minor|patch или точная версия X.Y.Z. До 1.0 breaking-изменения идут в minor. */
export function nextVersion(current, kind) {
  const m = SEMVER.exec(current)
  if (!m) throw new Error(`текущая версия "${current}" не X.Y.Z`)
  if (SEMVER.test(kind)) return kind
  const [maj, min, pat] = m.slice(1).map(Number)
  if (kind === 'major') return `${maj + 1}.0.0`
  if (kind === 'minor') return `${maj}.${min + 1}.0`
  if (kind === 'patch') return `${maj}.${min}.${pat + 1}`
  throw new Error(`неизвестный тип релиза "${kind}" (major|minor|patch|X.Y.Z)`)
}

/** Lockstep: у всех пакетов релиза должна быть одна версия. Возвращает её. */
export function assertLockstep(versions) {
  const uniq = [...new Set(Object.values(versions))]
  if (uniq.length !== 1) {
    const detail = Object.entries(versions).map(([k, v]) => `${k}@${v}`).join(', ')
    throw new Error(`нарушен lockstep: ${detail}`)
  }
  return uniq[0]
}

/** Содержимое секции [Unreleased] (без заголовка), либо null если секции нет. */
export function unreleasedBody(changelog) {
  const m = /^## \[Unreleased\]\s*\n([\s\S]*?)(?=^## \[|\s*$(?![\s\S]))/m.exec(changelog.replace(/\r\n/g, '\n'))
  return m ? m[1].trim() : null
}

/** [Unreleased] → [version] — date; сверху новая пустая [Unreleased]. Нет/пусто — ошибка (релиз без записей). */
export function rollChangelog(changelog, version, date) {
  const crlf = changelog.includes('\r\n')
  const text = changelog.replace(/\r\n/g, '\n')
  const body = unreleasedBody(text)
  if (body == null) throw new Error('в CHANGELOG.md нет секции "## [Unreleased]"')
  if (body === '') throw new Error('секция [Unreleased] пуста — нечего релизить')
  if (text.includes(`## [${version}]`)) throw new Error(`версия ${version} уже есть в CHANGELOG.md`)
  const out = text.replace('## [Unreleased]', `## [Unreleased]\n\n## [${version}] — ${date}`)
  return crlf ? out.replace(/\n/g, '\r\n') : out
}

/** Тег релиза должен совпадать с версией пакетов (защита publish-workflow). */
export function assertTagMatches(tag, version) {
  if (tag !== `v${version}`) throw new Error(`тег ${tag} не совпадает с версией пакетов v${version}`)
}

const cmp = (a, b) => {
  const [x, y] = [a, b].map((v) => v.split('.').map(Number))
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i]
  return 0
}

/** Наибольшая релизная версия, уже упомянутая в CHANGELOG (`## [X.Y.Z]`); null если релизов не было. */
export function highestReleased(changelog) {
  const versions = [...changelog.matchAll(/^## \[(\d+\.\d+\.\d+)\]/gm)].map((m) => m[1])
  return versions.length ? versions.sort(cmp).at(-1) : null
}

/** Новая версия обязана быть строго больше всех уже выпущенных (теги `v*` продукта и образы GHCR делят пространство версий). */
export function assertGreaterThanReleased(version, changelog) {
  const top = highestReleased(changelog)
  if (top && cmp(version, top) <= 0) {
    throw new Error(`версия ${version} не больше уже выпущенной ${top} (пространство тегов v* общее с образами GHCR) — укажите точную версию > ${top}`)
  }
}
