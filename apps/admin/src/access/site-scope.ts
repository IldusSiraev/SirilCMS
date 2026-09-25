export type Role = 'owner' | 'editor'
export type RoleLike = Role | null | undefined

export const isOwner = (u: { role?: RoleLike } | null | undefined) => u?.role === 'owner'

type ScopedUser = {
  role?: RoleLike
  site?: number | { id?: number } | null
}

/** true, если user видит записи с данным siteId */
export const canScope = (
  user: ScopedUser | null | undefined,
  siteId: number | null | undefined,
) => {
  if (!user) return false
  if (isOwner(user)) return true
  const site = user.site
  const siteValue =
    site == null ? null : typeof site === 'object' ? site.id ?? null : site
  return siteValue === siteId
}

export type SiteScopedDoc = { site?: number | { id?: number } | null } | null | undefined

/** id сайта документа (relationship — number или populated {id}); нет данных/site → fallback 1 */
export const resolveSiteId = (doc: SiteScopedDoc): number => {
  const site = doc?.site
  if (site == null) return 1
  if (typeof site === 'object') return site.id ?? 1
  return site
}

type ReadQuery = { status?: unknown; draft?: unknown } | undefined

/**
 * Draft-фильтр для pages/posts: owner видит всё; анонимный запрос с явным
 * draft=true/status=draft отклоняется, иначе скоупится published-only
 * where-constraint'ом; авторизованный не-owner — canScope по сайту документа.
 */
export const publishedOnlyReadAccess = (
  user: ScopedUser | null | undefined,
  query: ReadQuery,
  data: SiteScopedDoc,
): true | false | { _status: { equals: 'published' } } => {
  if (isOwner(user)) return true
  if (!user) {
    if (query?.status === 'draft' || query?.draft === true) return false
    return { _status: { equals: 'published' } }
  }
  return canScope(user, resolveSiteId(data))
}
