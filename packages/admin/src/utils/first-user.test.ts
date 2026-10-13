import { describe, expect, it } from 'vitest'
import { forceOwnerForFirstUser } from './first-user'

describe('forceOwnerForFirstUser', () => {
  it('forces role to owner when no users exist yet, even if editor was requested', () => {
    expect(forceOwnerForFirstUser({ role: 'editor' }, 0)).toEqual({ role: 'owner' })
  })

  it('forces role to owner when no users exist yet and role was omitted', () => {
    expect(forceOwnerForFirstUser({}, 0)).toEqual({ role: 'owner' })
  })

  it('leaves role untouched when users already exist', () => {
    expect(forceOwnerForFirstUser({ role: 'editor' }, 1)).toEqual({ role: 'editor' })
  })

  it('leaves an explicit owner request untouched when users already exist', () => {
    expect(forceOwnerForFirstUser({ role: 'owner' }, 5)).toEqual({ role: 'owner' })
  })
})
