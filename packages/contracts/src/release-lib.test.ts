import { describe, expect, it } from 'vitest'
import { assertLockstep, assertTagMatches, nextVersion, rollChangelog, unreleasedBody } from '../../../scripts/release-lib.mjs'

describe('nextVersion', () => {
  it('minor/patch/major', () => {
    expect(nextVersion('0.1.0', 'minor')).toBe('0.2.0')
    expect(nextVersion('0.1.4', 'patch')).toBe('0.1.5')
    expect(nextVersion('0.9.3', 'major')).toBe('1.0.0')
  })
  it('точная версия', () => expect(nextVersion('0.1.0', '1.2.3')).toBe('1.2.3'))
  it('мусор — ошибка', () => {
    expect(() => nextVersion('0.1.0', 'huge')).toThrow(/неизвестный/)
    expect(() => nextVersion('v0.1', 'minor')).toThrow(/не X.Y.Z/)
  })
})

describe('assertLockstep', () => {
  it('одинаковые версии — ок', () => expect(assertLockstep({ a: '0.1.0', b: '0.1.0' })).toBe('0.1.0'))
  it('разные — ошибка с перечнем', () => {
    expect(() => assertLockstep({ '@siril/a': '0.1.0', '@siril/b': '0.2.0' })).toThrow(/@siril\/a@0\.1\.0, @siril\/b@0\.2\.0/)
  })
})

const CL = `# Changelog

## [Unreleased]

### Added
- Фича

## [0.2.0] — 2026-09-26

### Changed
- Старое
`

describe('rollChangelog', () => {
  it('переносит Unreleased в версию и оставляет пустую Unreleased сверху', () => {
    const out = rollChangelog(CL, '0.3.0', '2026-10-14')
    expect(out).toContain('## [Unreleased]\n\n## [0.3.0] — 2026-10-14\n\n### Added\n- Фича')
    expect(unreleasedBody(out)).toBe('')
    expect(out).toContain('## [0.2.0] — 2026-09-26')
  })
  it('пустой Unreleased — ошибка', () => {
    expect(() => rollChangelog(rollChangelog(CL, '0.3.0', 'd'), '0.4.0', 'd')).toThrow(/пуста/)
  })
  it('нет секции — ошибка; повтор версии — ошибка', () => {
    expect(() => rollChangelog('# x\n', '0.3.0', 'd')).toThrow(/нет секции/)
    expect(() => rollChangelog(CL, '0.2.0', 'd')).toThrow(/уже есть/)
  })
  it('сохраняет CRLF', () => {
    const out = rollChangelog(CL.replace(/\n/g, '\r\n'), '0.3.0', 'd')
    expect(out).toContain('\r\n')
    expect(out.replace(/\r\n/g, '')).not.toContain('\n')
  })
})

describe('assertTagMatches', () => {
  it('v+версия', () => {
    expect(() => assertTagMatches('v0.3.0', '0.3.0')).not.toThrow()
    expect(() => assertTagMatches('v0.3.1', '0.3.0')).toThrow(/не совпадает/)
  })
})

import { assertGreaterThanReleased, highestReleased } from '../../../scripts/release-lib.mjs'

describe('highestReleased / assertGreaterThanReleased', () => {
  it('находит наибольшую версию по семверу, не по строке', () => {
    expect(highestReleased(CL + '\n## [0.10.0] — x\n\n## [0.9.0] — y\n')).toBe('0.10.0')
    expect(highestReleased('# x')).toBeNull()
  })
  it('новая версия должна быть строго больше выпущенной', () => {
    expect(() => assertGreaterThanReleased('0.2.0', CL)).toThrow(/не больше/)
    expect(() => assertGreaterThanReleased('0.1.9', CL)).toThrow(/не больше/)
    expect(() => assertGreaterThanReleased('0.3.0', CL)).not.toThrow()
  })
})
