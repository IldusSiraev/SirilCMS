import { describe, expect, it } from 'vitest'
import { pickSiteByHost } from './site-resolve'

describe('pickSiteByHost', () => {
  it('matches a site by exact domain (case-insensitive)', () => {
    const sites = [{ id: 1, domain: 'a.example.com' }, { id: 2, domain: 'B.example.com' }]
    expect(pickSiteByHost(sites, 'b.example.com')).toEqual(sites[1])
  })

  it('falls back to the only site when no domain matches (single-site backwards compat)', () => {
    const sites = [{ id: 1, domain: 'configured-elsewhere.com' }]
    expect(pickSiteByHost(sites, 'localhost:3000')).toEqual(sites[0])
  })

  it('returns null when multiple sites exist and none match the host', () => {
    const sites = [{ id: 1, domain: 'a.example.com' }, { id: 2, domain: 'b.example.com' }]
    expect(pickSiteByHost(sites, 'unknown.example.com')).toBeNull()
  })

  it('returns null when there are no sites at all', () => {
    expect(pickSiteByHost([], 'a.example.com')).toBeNull()
  })

  it('prefers an exact match over the single-site fallback when both would apply', () => {
    const sites = [{ id: 1, domain: 'a.example.com' }]
    expect(pickSiteByHost(sites, 'a.example.com')).toEqual(sites[0])
  })
})
