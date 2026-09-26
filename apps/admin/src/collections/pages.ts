import type { CollectionConfig, Field } from 'payload'
import { BLOCKS, toPayloadBlockFields } from '@siril/blocks-definitions'
import { publishedOnlyReadAccess, resolveSiteId } from '../access/site-scope'
import { publishHook } from '../utils/publish-hook'
import { buildPreviewURL } from '../utils/preview-url'
import { makeDuplicateSlug } from '../utils/duplicate-slug'
import { seo } from './seo'

export const Pages: CollectionConfig = {
  slug: 'pages',
  indexes: [{ unique: true, fields: ['site', 'slug'] }],
  admin: {
    defaultColumns: ['title', 'slug', 'site'],
    preview: (doc, { token }) =>
      buildPreviewURL(process.env.NUXT_URL ?? 'http://localhost:3000', 'page', doc.slug as string | undefined, token),
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
        publishHook('page', args.doc.id as number, resolveSiteId(args.doc))
      },
    ],
  },
  fields: [
    { name: 'site', type: 'relationship', relationTo: 'sites', required: true },
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      // Уникальность — составной индекс (site, slug), не одиночное unique: true (см. `indexes` выше):
      // два сайта в одной установке должны мочь оба иметь страницу с slug "home".
      // Payload default beforeDuplicate для unique-полей — " - Copy" (пробел+заглавная, невалидно для URL); свой хук вместо него.
      hooks: { beforeDuplicate: [({ value }) => makeDuplicateSlug(value)] },
    },
    { name: 'locale', type: 'text', defaultValue: 'ru' },
    // BLOCKS пуст до T9 — пустой массив допустим, Payload обрабатывает без блоков
    // (v3: blocks — массив { slug, fields })
    {
      name: 'sections',
      type: 'blocks',
      blocks: BLOCKS.map(def => ({
        slug: def.type,
        fields: toPayloadBlockFields(def) as Field[],
      })),
    },
    seo(),
  ],
}
