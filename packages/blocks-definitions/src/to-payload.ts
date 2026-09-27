import type { BlockDef, BlockField, PayloadField } from './types'
import { FORM_FIELD_TYPES } from './form-fields'
import { variantPreviewSvg } from './variant-preview'

// Минимальный rich-text адаптер (MVP, без внешних deps; паттерн posts.ts T4):
// string `editor: 'true'` крашится в Payload 3 (editor.validate is not a function)
export const minimalRichTextEditor = {
  sanitize: (value: unknown) => value,
  validate: () => true,
}

const TYPE_MAP: Record<BlockField['type'], string> = {
  text: 'text', email: 'email', richtext: 'richText', number: 'number',
  boolean: 'checkbox', select: 'select', image: 'upload', link: 'text',
  'array-text': 'array', 'object-array': 'array', 'image-array': 'upload',
  page: 'relationship', form: 'relationship',
}

export function toPayloadField(f: BlockField): PayloadField {
  const base: PayloadField = { name: f.name, type: TYPE_MAP[f.type], label: f.label, required: !!f.required }
  if (f.type === 'select') base.options = f.options
  if (f.type === 'richtext') base.editor = minimalRichTextEditor
  if (f.type === 'image') { base.relationTo = 'media'; base.multiple = false }
  if (f.type === 'page') base.relationTo = 'pages'
  if (f.type === 'form') base.relationTo = 'forms'
  if (f.type === 'array-text') {
    base.fields = [{ name: 'value', type: 'text', label: f.label }]
    base.maxRows = f.maxItems
  }
  if (f.type === 'object-array') { base.fields = (f.subfields ?? []).map(toPayloadField); base.maxRows = f.maxItems }
  if (f.type === 'image-array') { base.relationTo = 'media'; base.hasMany = true }
  return base
}

export function toPayloadBlockFields(def: BlockDef): PayloadField[] {
  const all = def.variants.flatMap(v => v.fields)
  const union = [...new Map(all.map(f => [f.name, f] as [string, BlockField])).values()]
  const fields = union.map(f => {
    const owners = def.variants.filter(v => v.fields.some(x => x.name === f.name)).map(v => v.id)
    return { ...toPayloadField(f), admin: { condition: (_data: unknown, siblingData: Record<string, unknown>) => owners.includes(siblingData?.variant as string) } }
  })
  const variant = {
    type: 'select', name: 'variant', label: { ru: 'Вариант', en: 'Variant' },
    options: def.variants.map(v => ({ value: v.id, label: v.name })),
    defaultValue: def.variants[0]!.id,
    admin: {
      // Визуальный пикер вместо select — превью-SVG на вариант (wireframe, не рендер реального блока).
      custom: {
        variantPreviews: def.variants.map(v => ({ value: v.id, label: v.name, svg: variantPreviewSvg(v.layout ?? 'center') })),
      },
      components: { Field: './src/admin-ui/variant-picker' },
    },
  }
  return [variant, ...fields]
}

// Строки для forms.fields (Payload array) — consumer T13: { name: 'fields', type: 'array', fields: toPayloadFormFields() }
export function toPayloadFormFields(): PayloadField[] {
  return [
    { name: 'name', type: 'text', label: { ru: 'Имя (ключ)', en: 'Name (key)' }, required: true },
    { name: 'label', type: 'text', label: { ru: 'Подпись', en: 'Label' }, required: true },
    { name: 'type', type: 'select', options: FORM_FIELD_TYPES.map(t => ({ value: t, label: t })) },
    { name: 'required', type: 'checkbox', label: { ru: 'Обязательное', en: 'Required' }, defaultValue: false },
    { name: 'placeholder', type: 'text', label: { ru: 'Placeholder', en: 'Placeholder' } },
    { name: 'options', type: 'textarea', label: { ru: 'Опции (одна на строку)', en: 'Options (one per line)' } },
  ]
}
