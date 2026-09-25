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
 * where-constraint'ом; авторизованный не-owner получает where-constraint по
 * сайту ПОЛЬЗОВАТЕЛЯ.
 *
 * Payload 3.90.1 не передаёт `data` в access.read ни для find (list), ни для
 * findByID — executeAccess вызывается без data (node_modules/payload/dist/
 * collections/operations/find.js, findByID.js). Раньше здесь стоял
 * canScope(user, resolveSiteId(data)), который при отсутствующем data
 * фолбечился на site=1: editor с site=1 получал boolean true и терял
 * where-фильтр вовсе (Payload's combineQueries не добавляет constraint для
 * boolean-результата — видел бы ВСЕ сайты в list-запросе), а editor с
 * site!==1 получал boolean false → Forbidden на любой read, включая
 * findByID своих же документов.
 */
export const publishedOnlyReadAccess = (
  user: ScopedUser | null | undefined,
  query: ReadQuery,
): true | false | { _status: { equals: 'published' } } | { site: { equals: number } } => {
  if (isOwner(user)) return true
  if (!user) {
    if (query?.status === 'draft' || query?.draft === true) return false
    return { _status: { equals: 'published' } }
  }
  return { site: { equals: resolveSiteId({ site: user.site }) } }
}
