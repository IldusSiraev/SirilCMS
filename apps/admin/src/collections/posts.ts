import type { CollectionConfig, Field } from 'payload'
import { publishedOnlyReadAccess } from '../access/site-scope'
import { publishHook } from '../utils/publish-hook'
import { buildPreviewURL } from '../utils/preview-url'
import { makeDuplicateSlug } from '../utils/duplicate-slug'
import { seo } from './seo'

// Минимальный адаптер rich text (MVP): в монорепо не установлен @payloadcms/richtext-lexical
// (не добавляем новые зависимости); адаптер хранит JSON-документ без доп. валидации.
// Полноценный редактор + админ-компоненты — след. задача (см. task-4 report).
const minimalRichText = {
  sanitize: (value: unknown) => value,
  validate: () => true,
}

const bodyField = {
  name: 'body',
  type: 'richText' as const,
  editor: minimalRichText,
} as unknown as Field

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    defaultColumns: ['title', 'slug', 'site', 'category'],
    preview: (doc, { token }) =>
      buildPreviewURL(process.env.NUXT_URL ?? 'http://localhost:3000', 'post', doc.slug as string | undefined, token),
  },
  access: {
    read: ({ req: { user, query } }) => publishedOnlyReadAccess(user, query),
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  versions: {
    drafts: true,
  },
  hooks: {
    afterChange: [
      async (args) => {
        // draft-save не меняет опубликованное → без purge (fire-and-forget)
        const draftParam = args.req.query?.draft
        if (draftParam === true || draftParam === 'true') return
        publishHook('post', args.doc.id as number)
      },
    ],
  },
  fields: [
    { name: 'site', type: 'relationship', relationTo: 'sites', required: true },
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      hooks: { beforeDuplicate: [({ value }) => makeDuplicateSlug(value)] },
    },
    { name: 'locale', type: 'text', defaultValue: 'ru' },
    { name: 'excerpt', type: 'textarea' },
    bodyField,
    { name: 'cover', type: 'upload', relationTo: 'media' },
    { name: 'category', type: 'relationship', relationTo: 'categories' },
    seo(),
  ],
}
