import type { CollectionConfig } from 'payload'
import { isOwner } from '../access/site-scope'
import { publishHook } from '../utils/publish-hook'

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
        publishHook('site', args.doc.id as number)
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
      options: [
        { value: 'default', label: 'Default' },
      ], // T12: options из THEMES
      defaultValue: 'default',
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
        { name: 'smtpPass', type: 'text', access: { read: ({ req: { user } }) => isOwner(user) } },
        { name: 'analyticsId', type: 'text', access: { read: ({ req: { user } }) => isOwner(user) } },
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
