import { expect, it } from 'vitest'
import { toPayloadBlockFields, toPayloadFormFields } from './to-payload'
import type { BlockDef } from './types'

const block: BlockDef = { type: 'hero', name: 'Hero', variants: [
  { id: 'default', name: 'Default', fields: [{ name: 'title', type: 'text', label: { ru: 'Т', en: 'T' } }, { name: 'caption', type: 'text', label: { ru: 'С', en: 'C' } }] },
  { id: 'split', name: 'Split', layout: 'split-right', fields: [{ name: 'title', type: 'text', label: { ru: 'Т', en: 'T' } }, { name: 'image', type: 'image', label: { ru: 'I', en: 'I' } }] },
]}

it('первый элемент — select variant', () => {
  const fields = toPayloadBlockFields(block)
  expect(fields[0]).toMatchObject({ type: 'select', name: 'variant', options: [{ value: 'default', label: 'Default' }, { value: 'split', label: 'Split' }] })
})
it('variant — визуальный пикер: превью-SVG на variant, компонент подключён', () => {
  const fields = toPayloadBlockFields(block)
  const variant = fields[0] as { admin?: { custom?: { variantPreviews?: { value: string; label: string; svg: string }[] }; components?: { Field?: string } } }
  expect(variant.admin?.components?.Field).toBe('./src/admin-ui/variant-picker')
  const previews = variant.admin?.custom?.variantPreviews
  expect(previews).toHaveLength(2)
  expect(previews?.[0]).toMatchObject({ value: 'default', label: 'Default' })
  expect(previews?.[0]?.svg).toContain('<svg')
  expect(previews?.[1]?.svg).not.toBe(previews?.[0]?.svg)
})
it('union полей — admin.condition показывает поле только для варианта-владельца', () => {
  const fields = toPayloadBlockFields(block)
  const image = fields.find(f => f.name === 'image')
  const admin = image?.admin as { condition?: (data: unknown, siblingData: Record<string, unknown>) => boolean } | undefined
  expect(admin?.condition?.(undefined, { variant: 'split' })).toBe(true)
  expect(admin?.condition?.(undefined, { variant: 'default' })).toBe(false)
})
it('toPayloadFormFields — строки в порядке: name, label, type, required, placeholder, options', () => {
  const rows = toPayloadFormFields()
  expect(rows.map(r => r.name)).toEqual(['name', 'label', 'type', 'required', 'placeholder', 'options'])
})
it('toPayloadFormFields — type: select с 11 опциями', () => {
  const rows = toPayloadFormFields()
  const type = rows.find(r => r.name === 'type')
  expect(type?.type).toBe('select')
  expect(type?.options).toHaveLength(11)
})
