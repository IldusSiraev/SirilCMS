import type { Field } from 'payload'

export const seo = (name: string = 'seo'): Field => ({
  name,
  type: 'group',
  label: 'SEO',
  fields: [
    { name: 'title', type: 'text', label: 'Title' },
    { name: 'description', type: 'textarea', label: 'Description' },
    { name: 'ogImage', type: 'upload', relationTo: 'media' },
    { name: 'canonical', type: 'text' },
    { name: 'noindex', type: 'checkbox' },
  ],
})
