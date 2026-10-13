import { describe, expect, it } from 'vitest'
import { mergeBlockRegistry, mergeThemeRegistry } from './merge'
import type { BlockDef, ThemeDef } from './types'

const block = (type: string, variant: string): BlockDef =>
  ({ type, name: type, variants: [{ id: variant, name: variant, fields: [] }] })

const theme = (id: string): ThemeDef => ({ id, name: id, blocks: {}, tokens: {} })

describe('mergeBlockRegistry', () => {
  it('новые id проекта добавляются', () => {
    const merged = mergeBlockRegistry({ hero: block('hero', 'default') }, { cases: block('cases', 'card') })
    expect(Object.keys(merged)).toEqual(['hero', 'cases'])
  })
  it('коллизию id — полное переопределение (extra > core)', () => {
    const extra = block('hero', 'split')
    const merged = mergeBlockRegistry({ hero: block('hero', 'default') }, { hero: extra })
    expect(merged.hero.variants[0].id).toBe('split')
  })
  it('пустое extra — core без изменений', () => {
    const core = { hero: block('hero', 'default') }
    expect(mergeBlockRegistry(core, {})).toBe(core)
  })
})

describe('mergeThemeRegistry', () => {
  it('полное переопределение по id, новые — в конец', () => {
    const core = [theme('default'), theme('mono')]
    const extra = [theme('mono'), theme('client')]
    const merged = mergeThemeRegistry(core, extra)
    expect(merged.map((t) => t.id)).toEqual(['default', 'mono', 'client'])
    expect(merged[1]).toBe(extra[0])
    expect(merged[2]).toBe(extra[1])
  })
})
