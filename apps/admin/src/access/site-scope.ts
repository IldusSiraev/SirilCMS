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
