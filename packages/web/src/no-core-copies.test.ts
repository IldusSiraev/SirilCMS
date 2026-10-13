import { afterAll, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
// @ts-expect-error — plain .mjs скрипт репозитория без деклараций
import { findCoreCopies } from '../../../scripts/check-no-core-copies.mjs'

describe('findCoreCopies', () => {
  const root = mkdtempSync(join(tmpdir(), 'siril-copies-'))
  const core = join(root, 'core')
  const proj = join(root, 'proj')
  mkdirSync(join(core, 'app', 'blocks', 'hero'), { recursive: true })
  mkdirSync(join(core, 'server', 'api'), { recursive: true })
  writeFileSync(join(core, 'app', 'blocks', 'hero', 'Default.vue'), 'core hero')
  writeFileSync(join(core, 'server', 'api', 'site.get.ts'), 'core site')
  mkdirSync(join(proj, 'app', 'blocks', 'hero'), { recursive: true })
  mkdirSync(join(proj, 'server', 'api'), { recursive: true })
  mkdirSync(join(proj, 'app', 'blocks', 'cases'), { recursive: true })
  afterAll(() => rmSync(root, { recursive: true, force: true }))

  it('идентичная копия core-файла — нарушение', () => {
    writeFileSync(join(proj, 'app', 'blocks', 'hero', 'Default.vue'), 'core hero')
    expect(findCoreCopies(proj, core)).toEqual([join('app', 'blocks', 'hero', 'Default.vue')])
  })
  it('override (содержимое отличается) и новый путь — допустимы', () => {
    writeFileSync(join(proj, 'app', 'blocks', 'hero', 'Default.vue'), 'my hero')
    writeFileSync(join(proj, 'app', 'blocks', 'cases', 'Card.vue'), 'new')
    expect(findCoreCopies(proj, core)).toEqual([])
  })
  it('копия server-роута тоже ловится', () => {
    writeFileSync(join(proj, 'server', 'api', 'site.get.ts'), 'core site')
    expect(findCoreCopies(proj, core)).toEqual([join('server', 'api', 'site.get.ts')])
  })
})
