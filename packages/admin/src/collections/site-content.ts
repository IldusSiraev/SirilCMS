import type { CollectionConfig } from 'payload'
import { resolveSiteId } from '../access/site-scope'
import { publishHook } from '../utils/publish-hook'

export const SiteContent: CollectionConfig = {
  slug: 'site-content',
  labels: {
    singular: { ru: 'Контент сайта', en: 'Site Content' },
    plural: { ru: 'Контент сайта', en: 'Site Content' },
  },
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
    { name: 'site', type: 'relationship', relationTo: 'sites', label: { ru: 'Сайт', en: 'Site' }, required: true, unique: true, index: true },
    {
      name: 'navigation',
      type: 'array',
      label: { ru: 'Навигация', en: 'Navigation' },
      fields: [
        { name: 'label', type: 'text', label: { ru: 'Подпись', en: 'Label' }, required: true },
        { name: 'page', type: 'relationship', relationTo: 'pages', label: { ru: 'Страница', en: 'Page' } },
        { name: 'externalUrl', type: 'text', label: { ru: 'Внешняя ссылка', en: 'External URL' } },
      ],
    },
    {
      name: 'footer',
      type: 'group',
      label: { ru: 'Футер', en: 'Footer' },
      fields: [
        { name: 'text', type: 'textarea', label: { ru: 'Текст', en: 'Text' } },
        {
          name: 'social',
          type: 'array',
          label: { ru: 'Соцсети', en: 'Social links' },
          fields: [{ name: 'value', type: 'text', label: { ru: 'Ссылка', en: 'Link' } }],
        },
        { name: 'email', type: 'email', label: { ru: 'Email', en: 'Email' } },
        { name: 'phone', type: 'text', label: { ru: 'Телефон', en: 'Phone' } },
        { name: 'telegram', type: 'text', label: { ru: 'Telegram', en: 'Telegram' } },
      ],
    },
  ],
}
