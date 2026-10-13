import { describe, expect, it } from 'vitest'
import { mergeBlockRegistry, mergeThemeRegistry } from './merge'
import type { BlockDef, ThemeDef } from './types'

const block = (type: string, variant: string): BlockDef =>
  ({ type, name: type, variants: [{ id: variant, name: variant, fields: [] }] })

const theme = (id: string): ThemeDef => ({ id, name: id, blocks: {}, tokens: {} })

describe('mergeBlockRegistry', () => {
  it('новые типы проекта добавляются в конец', () => {
    const merged = mergeBlockRegistry([block('hero', 'default')], [block('cases', 'card')])
    expect(merged.map((b) => b.type)).toEqual(['hero', 'cases'])
  })
  it('коллизию type — полное переопределение (extra > core), позиция core сохраняется', () => {
    const extra = block('hero', 'split')
    const merged = mergeBlockRegistry([block('hero', 'default'), block('faq', 'default')], [extra])
    expect(merged.map((b) => b.type)).toEqual(['hero', 'faq'])
    expect(merged[0]).toBe(extra)
  })
  it('пустое extra — core без изменений', () => {
    const core = [block('hero', 'default')]
    expect(mergeBlockRegistry(core, [])).toBe(core)
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
