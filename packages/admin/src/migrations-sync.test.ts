import { mkdtempSync, readdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { syncCoreMigrations } from './migrations-sync.mjs'

let core: string
let project: string
beforeEach(() => {
  core = mkdtempSync(join(tmpdir(), 'core-'))
  project = join(mkdtempSync(join(tmpdir(), 'proj-')), 'migrations')
  writeFileSync(join(core, '20260101_a.ts'), 'a')
  writeFileSync(join(core, '20260101_a.json'), '{}')
  writeFileSync(join(core, 'index.ts'), 'index')
})
afterEach(() => { rmSync(core, { recursive: true, force: true }); rmSync(project, { recursive: true, force: true }) })

describe('syncCoreMigrations', () => {
  it('копирует ts/json, но не index', () => {
    expect(syncCoreMigrations(core, project)).toEqual(['20260101_a.json', '20260101_a.ts'])
    expect(readdirSync(project).sort()).toEqual(['20260101_a.json', '20260101_a.ts'])
  })
  it('идемпотентно: второй запуск — no-op', () => {
    syncCoreMigrations(core, project)
    expect(syncCoreMigrations(core, project)).toEqual([])
  })
  it('изменённый core-файл перезаписывается, файлы проекта не трогаются', () => {
    syncCoreMigrations(core, project)
    writeFileSync(join(project, '20260202_proj.ts'), 'mine')
    writeFileSync(join(core, '20260101_a.ts'), 'a2')
    expect(syncCoreMigrations(core, project)).toEqual(['20260101_a.ts'])
    expect(readFileSync(join(project, '20260101_a.ts'), 'utf8')).toBe('a2')
    expect(readFileSync(join(project, '20260202_proj.ts'), 'utf8')).toBe('mine')
  })
})
