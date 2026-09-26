import { expect, it } from 'vitest'
import { resolveVariant, allowedVariants, paletteForTheme } from './resolve'
import { getTheme, getBlock } from './registry'
import type { BlockDef, ThemeDef } from './types'

const block: BlockDef = { type: 'hero', name: 'Hero', variants: [
  { id: 'default', name: 'Default', fields: [{ name: 'title', type: 'text', label: { ru: 'Т', en: 'T' } }] },
  { id: 'split', name: 'Split', fields: [{ name: 'title', type: 'text', label: { ru: 'Т', en: 'T' } }, { name: 'image', type: 'image', label: { ru: 'I', en: 'I' } }] },
]}
const theme: ThemeDef = {
  id: 't', name: 'T', tokens: { '--c-primary': '#000' },
  blocks: { hero: { enabled: true, variants: ['default'], defaultVariant: 'default' } },
}

it('вернёт сохранённый вариант если он допущен темой', () => {
  expect(resolveVariant(theme, block, 'default')).toEqual({ variant: 'default', fallback: false })
})
it('фолбэк на defaultVariant если вариант недоступен', () => {
  expect(resolveVariant(theme, block, 'split')).toEqual({ variant: 'default', fallback: true })
})
it('пустые allowed → fallback true', () => {
  const t2: ThemeDef = { ...theme, blocks: { hero: { enabled: true, variants: [] } } }
  expect(allowedVariants(t2, block)).toEqual(['default'])
})
it('variants темы называют несуществующий id блока → fallback на первый вариант блока, не пустой список', () => {
  const t4: ThemeDef = { ...theme, blocks: { hero: { enabled: true, variants: ['typo-does-not-exist'] } } }
  expect(allowedVariants(t4, block)).toEqual(['default'])
  expect(resolveVariant(t4, block, 'split')).toEqual({ variant: 'default', fallback: true })
})
it('paletteForTheme фильтрует disabled', () => {
  const t3: ThemeDef = { ...theme, blocks: { hero: { enabled: false } } }
  expect(paletteForTheme(t3).map(b => b.type)).not.toContain('hero')
})
it('getTheme mono', () => expect(getTheme('mono').id).toBe('mono'))
it('mono не поддерживает hero/split → fallback', () => {
  const hero = getBlock('hero')!
  expect(resolveVariant(getTheme('mono'), hero, 'split')).toEqual({ variant: 'default', fallback: true })
})
