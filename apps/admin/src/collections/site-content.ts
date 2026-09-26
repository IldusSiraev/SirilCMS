import type { CollectionConfig } from 'payload'
import { resolveSiteId } from '../access/site-scope'
import { publishHook } from '../utils/publish-hook'

export const SiteContent: CollectionConfig = {
  slug: 'site-content',
  admin: {
    description: 'Навигация и футер сайта (v1: одна запись)',
  },
  access: {
    // фронтенд читает nav + footer без авторизации (T6/T7); drafts здесь нет
    read: () => true,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  hooks: {
    afterChange: [
      async (args) => {
        publishHook('site-content', args.doc.id as number, resolveSiteId(args.doc))
      },
    ],
  },
  fields: [
    { name: 'site', type: 'relationship', relationTo: 'sites', required: true, unique: true, index: true },
    {
      name: 'navigation',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'page', type: 'relationship', relationTo: 'pages' },
        { name: 'externalUrl', type: 'text' },
      ],
    },
    {
      name: 'footer',
      type: 'group',
      fields: [
        { name: 'text', type: 'textarea' },
        {
          name: 'social',
          type: 'array',
          fields: [{ name: 'value', type: 'text', label: 'Ссылка' }],
        },
        { name: 'email', type: 'email' },
        { name: 'phone', type: 'text' },
        { name: 'telegram', type: 'text' },
      ],
    },
  ],
}
