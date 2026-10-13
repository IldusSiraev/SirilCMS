import { describe, expect, it } from 'vitest'
import { canWriteRoleFields, firstUserSignupAllowed, userUpdateAccess } from './user-access'

describe('userUpdateAccess', () => {
  it('denies anonymous', () => expect(userUpdateAccess(null)).toBe(false))
  it('owner updates anyone', () => expect(userUpdateAccess({ id: 1, role: 'owner' })).toBe(true))
  it('editor is scoped to own record only', () => {
    expect(userUpdateAccess({ id: 7, role: 'editor' })).toEqual({ id: { equals: 7 } })
  })
  it('user without id is denied', () => expect(userUpdateAccess({ role: 'editor' })).toBe(false))
})

describe('firstUserSignupAllowed', () => {
  it('allowed on empty DB by default', () => expect(firstUserSignupAllowed(0, {})).toBe(true))
  it('denied once a user exists', () => expect(firstUserSignupAllowed(1, {})).toBe(false))
  it('denied on empty DB when disabled via env (prod)', () => {
    expect(firstUserSignupAllowed(0, { DISABLE_FIRST_USER_SIGNUP: 'true' })).toBe(false)
  })
})

describe('canWriteRoleFields', () => {
  it('owner can', () => expect(canWriteRoleFields({ id: 1, role: 'owner' }, 3, {})).toBe(true))
  it('editor cannot (no self-promotion)', () => expect(canWriteRoleFields({ id: 2, role: 'editor' }, 3, {})).toBe(false))
  it('anonymous first-user signup can', () => expect(canWriteRoleFields(null, 0, {})).toBe(true))
  it('anonymous cannot once users exist', () => expect(canWriteRoleFields(null, 2, {})).toBe(false))
  it('anonymous cannot when signup disabled', () => {
    expect(canWriteRoleFields(null, 0, { DISABLE_FIRST_USER_SIGNUP: 'true' })).toBe(false)
  })
})
