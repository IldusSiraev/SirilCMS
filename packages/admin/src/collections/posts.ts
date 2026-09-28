import type { CollectionConfig, Field } from 'payload'
import { lexicalHTMLField } from '@payloadcms/richtext-lexical'
import { publishedOnlyReadAccess, resolveSiteId } from '../access/site-scope'
import { publishHook } from '../utils/publish-hook'
import { buildPreviewURL } from '../utils/preview-url'
import { makeDuplicateSlug } from '../utils/duplicate-slug'
import { seo } from './seo'

const bodyField: Field = {
  name: 'body',
  type: 'richText',
  label: { ru: 'Текст', en: 'Body' },
}
// Готовый HTML соседним полем — web рендерит через v-html без своей lexical-зависимости.
const bodyHtmlField = lexicalHTMLField({ lexicalFieldName: 'body', htmlFieldName: 'bodyHtml' })

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: {
    singular: { ru: 'Пост', en: 'Post' },
    plural: { ru: 'Посты', en: 'Posts' },
  },
  indexes: [{ unique: true, fields: ['site', 'slug'] }],
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
        publishHook('post', args.doc.id as number, resolveSiteId(args.doc))
      },
    ],
  },
  fields: [
    { name: 'site', type: 'relationship', relationTo: 'sites', label: { ru: 'Сайт', en: 'Site' }, required: true },
    { name: 'title', type: 'text', label: { ru: 'Заголовок', en: 'Title' }, required: true },
    {
      name: 'slug',
      type: 'text',
      label: { ru: 'Слаг', en: 'Slug' },
      // Уникальность — составной индекс (site, slug) на уровне коллекции (см. `indexes` выше).
      hooks: { beforeDuplicate: [({ value }) => makeDuplicateSlug(value)] },
    },
    { name: 'excerpt', type: 'textarea', label: { ru: 'Анонс', en: 'Excerpt' } },
    bodyField,
    bodyHtmlField,
    { name: 'cover', type: 'upload', relationTo: 'media', label: { ru: 'Обложка', en: 'Cover' } },
    { name: 'category', type: 'relationship', relationTo: 'categories', label: { ru: 'Категория', en: 'Category' } },
    seo(),
  ],
}
