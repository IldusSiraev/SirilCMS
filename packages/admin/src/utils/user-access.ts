import { isOwner, type RoleLike } from '../access/site-scope'

type U = { id?: number | string; role?: RoleLike } | null | undefined

/**
 * update на users: owner — любого; остальные — только себя.
 * Без этого любой залогиненный editor мог записать себе role=owner (или сменить чужой пароль).
 * Возвращает Payload where-constraint для не-owner, чтобы find/update не раскрывал чужие записи.
 */
export function userUpdateAccess(user: U): boolean | { id: { equals: number | string } } {
  if (!user) return false
  if (isOwner(user)) return true
  if (user.id == null) return false
  return { id: { equals: user.id } }
}

/** Анонимная самрегистрация первого юзера: только в пустой БД и если не отключена env-флагом (prod). */
export function firstUserSignupAllowed(existingUserCount: number, env: Record<string, string | undefined>): boolean {
  if (env.DISABLE_FIRST_USER_SIGNUP === 'true') return false
  return existingUserCount === 0
}

/** Поля role/site меняет только owner (или создание первого юзера, когда флаг не отключён). */
export function canWriteRoleFields(user: U, existingUserCount: number, env: Record<string, string | undefined>): boolean {
  if (isOwner(user)) return true
  return !user && firstUserSignupAllowed(existingUserCount, env)
}
