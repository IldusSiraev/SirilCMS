import { describe, expect, it } from 'vitest'
import { canScope, publishedOnlyReadAccess, resolveSiteId } from './access/site-scope'

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
    expect(publishedOnlyReadAccess({ role: 'owner' }, { draft: true })).toBe(true)
  })

  it('anonymous request with no draft/status query is scoped to published docs', () => {
    expect(publishedOnlyReadAccess(null, undefined)).toEqual({ _status: { equals: 'published' } })
  })

  it('anonymous request explicitly asking for draft=true is denied outright', () => {
    expect(publishedOnlyReadAccess(null, { draft: true })).toBe(false)
  })

  it('anonymous request explicitly asking for status=draft is denied outright', () => {
    expect(publishedOnlyReadAccess(null, { status: 'draft' })).toBe(false)
  })

  // Payload 3.90.1 never passes `data` into a collection's access.read — confirmed by
  // reading node_modules/payload/dist/collections/operations/find.js (executeAccess
  // called with just { disableErrors, req }) and findByID.js (executeAccess called with
  // just { id, disableErrors, req }). So a non-owner's site must come from the user, not
  // a per-document `data` argument — otherwise `find` (list) access is evaluated once
  // with no document context and either exposes every site (boolean true drops the
  // where-filter entirely) or 403s the user's own site (boolean false).
  it('authenticated editor gets a where-constraint scoped to their own site, not a boolean', () => {
    expect(publishedOnlyReadAccess({ role: 'editor', site: 2 }, undefined)).toEqual({
      site: { equals: 2 },
    })
  })

  it('authenticated editor with a populated site relationship is scoped by its id', () => {
    expect(publishedOnlyReadAccess({ role: 'editor', site: { id: 5 } }, undefined)).toEqual({
      site: { equals: 5 },
    })
  })

  it('authenticated editor without a site falls back to site 1 (pre-existing resolveSiteId quirk)', () => {
    expect(publishedOnlyReadAccess({ role: 'editor', site: null }, undefined)).toEqual({
      site: { equals: 1 },
    })
  })

  it('editor where-constraint applies regardless of draft/status query (own site, any status)', () => {
    expect(publishedOnlyReadAccess({ role: 'editor', site: 2 }, { draft: true })).toEqual({
      site: { equals: 2 },
    })
  })
})
