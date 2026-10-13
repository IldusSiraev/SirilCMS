import type { CollectionConfig } from 'payload'

// Своя сущность проекта (extension API §4): отдельная коллекция; связь с core — relationship со стороны проекта.
export const Cases: CollectionConfig = {
  slug: 'cases',
  admin: { useAsTitle: 'title' },
  access: { read: () => true },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'site', type: 'relationship', relationTo: 'sites', required: true },
    { name: 'page', type: 'relationship', relationTo: 'pages' },
  ],
}
