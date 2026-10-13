import type { Field } from 'payload'

export const seo = (name: string = 'seo'): Field => ({
  name,
  type: 'group',
  label: 'SEO',
  fields: [
    { name: 'title', type: 'text', label: { ru: 'Заголовок', en: 'Title' } },
    { name: 'description', type: 'textarea', label: { ru: 'Описание', en: 'Description' } },
    { name: 'ogImage', type: 'upload', relationTo: 'media', label: { ru: 'OG-изображение', en: 'Og Image' } },
    { name: 'canonical', type: 'text', label: { ru: 'Канонический URL', en: 'Canonical' } },
    { name: 'noindex', type: 'checkbox', label: { ru: 'Не индексировать', en: 'Noindex' } },
  ],
})
