import type { CollectionConfig } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: {
    singular: { ru: 'Категория', en: 'Category' },
    plural: { ru: 'Категории', en: 'Categories' },
  },
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
    { name: 'site', type: 'relationship', relationTo: 'sites', label: { ru: 'Сайт', en: 'Site' }, required: true },
    { name: 'name', type: 'text', label: { ru: 'Название', en: 'Name' }, required: true },
    // Уникальность — составной индекс (site, slug) на уровне коллекции (см. `indexes` выше).
    { name: 'slug', type: 'text', label: { ru: 'Слаг', en: 'Slug' } },
  ],
}
