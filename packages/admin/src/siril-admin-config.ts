import type { CollectionConfig, Endpoint } from 'payload'
import { registerExtensions } from '@siril/contracts'
import type { BlockDef, ThemeDef } from '@siril/contracts'

import { Categories } from './collections/categories'
import { Forms } from './collections/forms'
import { FormSubmissions } from './collections/form-submissions'
import { Media } from './collections/media'
import { makePages } from './collections/pages'
import { Posts } from './collections/posts'
import { makeSites } from './collections/sites'
import { SiteContent } from './collections/site-content'
import { Users } from './collections/users'
import { submissionsCsv } from './endpoints/submissions-csv'

// payload@3.90 не экспортирует общий тип Hook (hook-типы per-operation,
// например CollectionAfterChangeHook) — либеральный alias, чтобы контракт
// merge оставался присваиваемым для хук-мап Task 7.
type Hook = (args: never) => unknown

type SirilProject = {
  collections?: CollectionConfig[]
  endpoints?: Endpoint[]
  hooks?: Record<string, Hook | Hook[]>
  adminUiBase?: string
  /** Блоки проекта (extension API §4): новый type добавляется, существующий — заменяется целиком. */
  blocks?: BlockDef[]
  /** Темы проекта: новый id добавляется, существующий — заменяется целиком. */
  themes?: ThemeDef[]
}

export function sirilAdminConfig(_project: SirilProject = {}): {
  collections: CollectionConfig[]
  endpoints: Endpoint[]
  hooks: Record<string, Hook | Hook[]>
} {
  // Core-списки — 1:1 с текущим apps/reference-admin/payload.config.ts (порядок сохранён).
  // `seo` — это поле (collections/seo), не коллекция: в конфиг не входит.
  const { collections = [], endpoints = [], hooks = {}, adminUiBase, blocks = [], themes = [] } = _project
  // До сборки core-коллекций: pages.sections и sites.theme строятся из активного (смерженного) реестра.
  registerExtensions({ blocks, themes })
  const coreCollections: CollectionConfig[] = [makeSites(), Media, Users, makePages({ adminUiBase }), Posts, Categories, SiteContent, Forms, FormSubmissions]
  const coreEndpoints: Endpoint[] = [submissionsCsv]
  const coreHooks: Record<string, Hook | Hook[]> = {}
  return {
    collections: [...coreCollections, ...collections],
    endpoints: [...coreEndpoints, ...endpoints],
    hooks: { ...coreHooks, ...hooks },
  }
}
