import type { CollectionConfig } from 'payload'
import { THEMES } from '@siril/blocks-definitions'
import { isOwner } from '../access/site-scope'
import { publishHook } from '../utils/publish-hook'
import { decryptField, encryptField } from '../utils/field-encryption'

export const Sites: CollectionConfig = {
  slug: 'sites',
  admin: {
    description: 'Настройки сайта (v1: одна запись)',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => isOwner(user),
    update: ({ req: { user } }) => isOwner(user),
    delete: ({ req: { user } }) => isOwner(user),
  },
  hooks: {
    afterChange: [
      async (args) => {
        publishHook('site', args.doc.id as number, args.doc.id as number)
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      defaultValue: 'default',
      admin: { position: 'sidebar' },
    },
    {
      name: 'domain',
      type: 'text',
    },
    {
      name: 'locale',
      type: 'text',
      defaultValue: 'ru',
    },
    {
      name: 'theme',
      type: 'select',
      options: THEMES.map(t => ({ value: t.id, label: t.name })),
      defaultValue: 'default',
      admin: { description: 'Переключение темы — мгновенное (данные). Блоки/варианты, не поддержанные темой, отрисовываются по fallback-варианту.' },
    },
    {
      name: 'contacts',
      type: 'group',
      fields: [
        { name: 'email', type: 'email' },
        { name: 'phone', type: 'text' },
        { name: 'telegram', type: 'text' },
      ],
    },
    {
      name: 'settings',
      type: 'group',
      fields: [
        { name: 'smtpHost', type: 'text', access: { read: ({ req: { user } }) => isOwner(user) } },
        { name: 'smtpPort', type: 'number', access: { read: ({ req: { user } }) => isOwner(user) } },
        { name: 'smtpUser', type: 'text', access: { read: ({ req: { user } }) => isOwner(user) } },
        {
          name: 'smtpPass',
          type: 'text',
          access: { read: ({ req: { user } }) => isOwner(user) },
          hooks: {
            beforeChange: [({ value }) => (value ? encryptField(value) : value)],
            afterRead: [({ value }) => (value ? decryptField(value) : value)],
          },
        },
        { name: 'analyticsId', type: 'text', admin: { description: 'ID счётчика Яндекс.Метрики (число). Публично читаемо — подставляется в <head> сайта.' } },
      ],
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
    },
  ],
  versions: false,
}
