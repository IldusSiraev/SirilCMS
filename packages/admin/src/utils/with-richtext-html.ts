import type { Field } from 'payload'
import { lexicalHTMLField } from '@payloadcms/richtext-lexical'

// Каждому richText-полю блока — соседнее вычисляемое code-поле <name>Html (готовый HTML,
// см. docs/developer.md §rich text): web не тянет lexical, рендерит value напрямую через v-html.
export function withRichTextHtml(fields: Field[]): Field[] {
  return fields.flatMap((f) => {
    if ('fields' in f && Array.isArray(f.fields)) {
      return [{ ...f, fields: withRichTextHtml(f.fields) } as Field]
    }
    if ('type' in f && f.type === 'richText' && 'name' in f && f.name) {
      const html = lexicalHTMLField({ lexicalFieldName: f.name, htmlFieldName: `${f.name}Html` })
      return [f, html]
    }
    return [f]
  })
}
