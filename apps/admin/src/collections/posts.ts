import type { CollectionConfig, Field } from 'payload'
import { canScope, isOwner } from '../access/site-scope'
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

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    defaultColumns: ['title', 'slug', 'site', 'category'],
  },
  access: {
    read: ({ req: { user, query }, data }) => {
      if (isOwner(user)) {
        return true
      }
      if (!user) {
        if (query?.status === 'draft' || query?.draft === true) {
          return false
        }
        return { _status: { equals: 'published' } }
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
    { name: 'excerpt', type: 'textarea' },
    bodyField,
    { name: 'cover', type: 'upload', relationTo: 'media' },
    { name: 'category', type: 'relationship', relationTo: 'categories' },
    seo(),
  ],
}
