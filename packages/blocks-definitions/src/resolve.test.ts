import { describe, expect, it } from 'vitest'
import { resolveVariant, allowedVariants, paletteForTheme } from './resolve'
import type { BlockDef, ThemeDef } from './types'

const block: BlockDef = { type: 'hero', name: 'Hero', variants: [
  { id: 'default', name: 'Default', fields: [{ name: 'title', type: 'text', label: 'Т' }] },
  { id: 'split', name: 'Split', fields: [{ name: 'title', type: 'text', label: 'Т' }, { name: 'image', type: 'image', label: 'I' }] },
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
it('paletteForTheme фильтрует disabled', () => {
  const t3: ThemeDef = { ...theme, blocks: { hero: { enabled: false } } }
  expect(paletteForTheme(t3).map(b => b.type)).not.toContain('hero')
})
