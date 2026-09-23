import type { CollectionConfig, Field } from 'payload'
import { BLOCKS, toPayloadBlockFields } from '@siril/blocks-definitions'
import { canScope, isOwner } from '../access/site-scope'
import { seo } from './seo'

type MaybeSite = { site?: number | { id?: number } } | null | undefined

// doc может быть number или { id } (в зависимости от depth); fallback 1 — как в brief
const siteIdOf = (doc: MaybeSite): number => {
  const site = doc?.site
  if (site == null) {
    return 1
  }
  if (typeof site === 'object') {
    return site.id ?? 1
  }
  return site
}

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    defaultColumns: ['title', 'slug', 'site'],
  },
  access: {
    read: ({ req: { user, query }, data }) => {
      if (isOwner(user)) {
        return true
      }
      if (!user) {
        return (query?.status as string | undefined) !== 'draft'
      }
      return canScope(user, siteIdOf(data as MaybeSite))
    },
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  versions: {
    drafts: true,
  },
  fields: [
    { name: 'site', type: 'relationship', relationTo: 'sites', required: true },
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', unique: true },
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
