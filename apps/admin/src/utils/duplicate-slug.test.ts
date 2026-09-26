import { describe, expect, it } from 'vitest'
import { makeDuplicateSlug } from './duplicate-slug'

describe('makeDuplicateSlug', () => {
  it('appends a url-safe -copy-<suffix> to an existing slug', () => {
    const result = makeDuplicateSlug('about')
    expect(result).toMatch(/^about-copy-[a-z0-9]{4}$/)
  })

  it('has no spaces or uppercase (unlike Payload default " - Copy")', () => {
    const result = makeDuplicateSlug('about')!
    expect(result).not.toMatch(/[\sA-Z]/)
  })

  it('returns undefined for an empty/missing slug', () => {
    expect(makeDuplicateSlug(undefined)).toBeUndefined()
    expect(makeDuplicateSlug(null)).toBeUndefined()
    expect(makeDuplicateSlug('')).toBeUndefined()
  })
})
