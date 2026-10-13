import { afterEach, describe, expect, it } from 'vitest'
import { BLOCKS, CORE_BLOCKS, CORE_THEMES, THEMES, getBlock, getTheme, registerExtensions, resetExtensions } from './registry'
import { paletteForTheme, resolveVariant } from './resolve'

describe('registerExtensions', () => {
  afterEach(() => resetExtensions())
  const cases = { type: 'cases', name: 'Cases', variants: [{ id: 'card', name: 'Card', fields: [] }] }
  const client = { id: 'client', name: 'Client', tokens: { '--c-primary': '#f00' }, blocks: { cases: { enabled: true } } }

  it('без расширений — реестр равен core', () => {
    expect(BLOCKS.map((b) => b.type)).toEqual(CORE_BLOCKS.map((b) => b.type))
    expect(THEMES.map((t) => t.id)).toEqual(CORE_THEMES.map((t) => t.id))
  })
  it('блок и тема проекта видны через getBlock/getTheme и общие массивы', () => {
    registerExtensions({ blocks: [cases], themes: [client] })
    expect(getBlock('cases')).toBe(cases)
    expect(getTheme('client')).toBe(client)
    expect(BLOCKS.at(-1)).toBe(cases)
    expect(THEMES.map((t) => t.id)).toContain('client')
  })
  it('core-темы по умолчанию включают новый блок проекта; палитра и resolveVariant его видят', () => {
    registerExtensions({ blocks: [cases] })
    const def = getTheme('default')
    expect(paletteForTheme(def).map((b) => b.type)).toContain('cases')
    expect(resolveVariant(def, cases, 'card')).toEqual({ variant: 'card', fallback: false })
  })
  it('идемпотентно: повторный вызов не накапливает', () => {
    registerExtensions({ blocks: [cases], themes: [client] })
    registerExtensions({ blocks: [cases], themes: [client] })
    expect(BLOCKS.filter((b) => b.type === 'cases')).toHaveLength(1)
    expect(THEMES.filter((t) => t.id === 'client')).toHaveLength(1)
  })
  it('тема проекта с id core — полная замена; неизвестный id → первая тема', () => {
    registerExtensions({ themes: [{ ...client, id: 'mono' }] })
    expect(getTheme('mono').tokens['--c-primary']).toBe('#f00')
    expect(getTheme('nope').id).toBe('default')
  })
  it('resetExtensions возвращает core', () => {
    registerExtensions({ blocks: [cases], themes: [client] })
    resetExtensions()
    expect(getBlock('cases')).toBeUndefined()
    expect(THEMES.map((t) => t.id)).toEqual(CORE_THEMES.map((t) => t.id))
  })
})
