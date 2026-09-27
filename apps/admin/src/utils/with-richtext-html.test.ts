import { it, expect } from 'vitest'
import type { Field } from 'payload'
import { withRichTextHtml } from './with-richtext-html'

it('richText-поле — добавляет соседнее code-поле <name>Html', () => {
  const fields: Field[] = [{ name: 'body', type: 'richText', label: 'Body' }]
  const out = withRichTextHtml(fields)
  expect(out).toHaveLength(2)
  expect(out[0]).toBe(fields[0])
  expect(out[1]).toMatchObject({ name: 'bodyHtml', type: 'code' })
})

it('нет richText-полей — массив не меняется', () => {
  const fields: Field[] = [{ name: 'title', type: 'text', label: 'Title' }]
  expect(withRichTextHtml(fields)).toEqual(fields)
})

it('вложенный array (object-array) — рекурсивно добавляет html-поле подполю', () => {
  const fields: Field[] = [{
    name: 'plans', type: 'array', label: 'Plans',
    fields: [{ name: 'description', type: 'richText', label: 'Description' }],
  }]
  const out = withRichTextHtml(fields) as any[]
  expect(out).toHaveLength(1)
  expect(out[0].fields).toHaveLength(2)
  expect(out[0].fields[1]).toMatchObject({ name: 'descriptionHtml', type: 'code' })
})
