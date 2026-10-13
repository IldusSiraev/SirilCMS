import { describe, expect, it } from 'vitest'
import { bearerMatches } from './bearer'

describe('bearerMatches', () => {
  it('accepts exact token', () => expect(bearerMatches('Bearer s3cret', 's3cret')).toBe(true))
  it('rejects wrong token', () => expect(bearerMatches('Bearer nope', 's3cret')).toBe(false))
  it('rejects missing header', () => expect(bearerMatches(undefined, 's3cret')).toBe(false))
  it('rejects when server token is unset/empty', () => {
    expect(bearerMatches('Bearer ', '')).toBe(false)
    expect(bearerMatches('Bearer undefined', undefined)).toBe(false)
  })
})
