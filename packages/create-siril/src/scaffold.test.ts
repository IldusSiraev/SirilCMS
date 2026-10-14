import { mkdtempSync, readFileSync, existsSync, readdirSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { applyEngineSource, renderTokens, resolveTemplateDir, scaffold, validateName } from './scaffold.mjs'

describe('validateName', () => {
  it('kebab-case допустим', () => {
    for (const ok of ['acme', 'acme-site', 'site2', 'a-b-c']) expect(validateName(ok)).toBeNull()
  })
  it('мусор отклоняется', () => {
    for (const bad of ['', 'Acme', 'acme_site', '2site', 'acme--site', '-acme', 'acme-', 'сайт', 'a b'])
      expect(validateName(bad), bad).toBeTypeOf('string')
    expect(validateName('x'.repeat(41))).toMatch(/40/)
    expect(validateName(undefined as unknown as string)).toBeTypeOf('string')
  })
})

describe('renderTokens', () => {
  it('подставляет все вхождения', () => expect(renderTokens('{{a}}-{{b}}-{{a}}', { a: 'x', b: 1 })).toBe('x-1-x'))
  it('неизвестный токен — ошибка', () => expect(() => renderTokens('{{nope}}', {})).toThrow(/nope/))
  it('не трогает одиночные скобки и JSX/шаблонные строки', () => expect(renderTokens('${x} {y} {{z}}', { z: '1' })).toBe('${x} {y} 1'))
})

describe('scaffold (реальный templates/project)', () => {
  const root = mkdtempSync(join(tmpdir(), 'create-siril-'))
  afterAll(() => rmSync(root, { recursive: true, force: true }))
  const dest = join(root, 'acme-site')
  const files = scaffold({ destDir: dest, vars: { name: 'acme-site', engineVersion: '9.9.9' } })
  const read = (p: string) => readFileSync(join(dest, p), 'utf8')

  it('подставляет имя проекта и версию движка', () => {
    const rootPkg = JSON.parse(read('package.json'))
    expect(rootPkg.name).toBe('acme-site')
    expect(rootPkg.scripts.dev).toContain('acme-site-web')
    expect(JSON.parse(read('admin/package.json')).name).toBe('acme-site-admin')
    expect(JSON.parse(read('admin/package.json')).dependencies['@sirilcms/admin']).toBe('9.9.9')
    expect(JSON.parse(read('web/package.json')).dependencies['@sirilcms/web']).toBe('9.9.9')
  })
  it('переименовывает _gitignore/_npmrc и не оставляет токенов', () => {
    expect(existsSync(join(dest, '.gitignore'))).toBe(true)
    expect(existsSync(join(dest, '.npmrc'))).toBe(true)
    expect(existsSync(join(dest, '_gitignore'))).toBe(false)
    expect(existsSync(join(dest, 'admin/.gitignore'))).toBe(true)
    for (const f of files) {
      if (statSync(join(dest, f)).isFile()) expect(readFileSync(join(dest, f), 'utf8'), f).not.toMatch(/\{\{\w+\}\}/)
    }
  })
  it('шаблон не содержит демо-контента (пустые блоки/темы/коллекции)', () => {
    expect(read('siril.extensions.ts')).toContain('export const blocks: BlockDef[] = []')
    expect(read('siril.extensions.ts')).toContain('export const themes: ThemeDef[] = []')
    expect(readdirSync(join(dest, 'admin/src/migrations'))).toEqual(['.gitkeep'])
  })
  it('непустой каталог — ошибка', () => {
    expect(() => scaffold({ destDir: dest, vars: { name: 'x', engineVersion: '1.0.0' } })).toThrow(/не пуст/)
  })
  it('шаблон найден и содержит обвязку Payload/Nuxt', () => {
    expect(existsSync(join(resolveTemplateDir(), 'admin/app/(payload)/layout.tsx'))).toBe(true)
  })
})

describe('applyEngineSource', () => {
  const root = mkdtempSync(join(tmpdir(), 'create-siril-src-'))
  afterAll(() => rmSync(root, { recursive: true, force: true }))
  it('зависимости @sirilcms/* → file: tgz, contracts переопределён в pnpm-workspace', () => {
    const dest = join(root, 'p')
    scaffold({ destDir: dest, vars: { name: 'p', engineVersion: '0.6.0' }, engineSource: join(root, 'packs') })
    const web = JSON.parse(readFileSync(join(dest, 'web/package.json'), 'utf8'))
    expect(web.dependencies['@sirilcms/web']).toMatch(/^file:.*\/sirilcms-web-0\.6\.0\.tgz$/)
    expect(web.dependencies['@sirilcms/contracts']).toMatch(/sirilcms-contracts-0\.6\.0\.tgz$/)
    expect(web.dependencies.nuxt).toBe('^4.5.2')
    const ws = readFileSync(join(dest, 'pnpm-workspace.yaml'), 'utf8')
    expect(ws).toContain('overrides:')
    expect(ws).toMatch(/"@sirilcms\/contracts": "file:.*sirilcms-contracts-0\.6\.0\.tgz"/)
    expect(applyEngineSource).toBeTypeOf('function')
  })
})
