import { describe, expect, it } from 'vitest'
import { canScope, isOwner, publishedOnlyReadAccess, resolveSiteId } from './access/site-scope'

it('owner видит всё', () => {
  expect(canScope({ role: 'owner' }, 1)).toBe(true)
})

it('editor — только свой сайт', () => {
  expect(canScope({ role: 'editor', site: 1 }, 1)).toBe(true)
  expect(canScope({ role: 'editor', site: 1 }, 2)).toBe(false)
})

it('null — нет', () => {
  expect(canScope(null, 1)).toBe(false)
})

describe('resolveSiteId', () => {
  it('number as-is', () => {
    expect(resolveSiteId({ site: 2 })).toBe(2)
  })
  it('populated relationship object -> its id', () => {
    expect(resolveSiteId({ site: { id: 3 } })).toBe(3)
  })
  it('missing site / no data -> fallback 1', () => {
    expect(resolveSiteId({})).toBe(1)
    expect(resolveSiteId(null)).toBe(1)
    expect(resolveSiteId(undefined)).toBe(1)
  })
})

describe('publishedOnlyReadAccess (draft filter for pages/posts)', () => {
  it('owner sees everything, drafts included, regardless of query', () => {
    expect(publishedOnlyReadAccess({ role: 'owner' }, { draft: true }, { site: 2 })).toBe(true)
  })

  it('anonymous request with no draft/status query is scoped to published docs', () => {
    expect(publishedOnlyReadAccess(null, undefined, undefined)).toEqual({ _status: { equals: 'published' } })
  })

  it('anonymous request explicitly asking for draft=true is denied outright', () => {
    expect(publishedOnlyReadAccess(null, { draft: true }, undefined)).toBe(false)
  })

  it('anonymous request explicitly asking for status=draft is denied outright', () => {
    expect(publishedOnlyReadAccess(null, { status: 'draft' }, undefined)).toBe(false)
  })

  it('authenticated editor on the matching site can read (any status, e.g. their own draft)', () => {
    expect(publishedOnlyReadAccess({ role: 'editor', site: 2 }, undefined, { site: 2 })).toBe(true)
  })

  it('authenticated editor on a different site is denied', () => {
    expect(publishedOnlyReadAccess({ role: 'editor', site: 2 }, undefined, { site: 3 })).toBe(false)
  })
})
