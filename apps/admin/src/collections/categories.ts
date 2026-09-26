import type { CollectionConfig } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  indexes: [{ unique: true, fields: ['site', 'slug'] }],
  admin: {
    defaultColumns: ['name', 'slug', 'site'],
  },
  access: {
    read: ({ req: { user } }) => !!user,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  fields: [
    { name: 'site', type: 'relationship', relationTo: 'sites', required: true },
    { name: 'name', type: 'text', required: true },
    // Уникальность — составной индекс (site, slug) на уровне коллекции (см. `indexes` выше).
    { name: 'slug', type: 'text' },
  ],
}
