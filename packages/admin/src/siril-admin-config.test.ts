import { describe, expect, it } from 'vitest'
import { sirilAdminConfig } from './siril-admin-config'

describe('sirilAdminConfig', () => {
  it('аддитивный merge: core + project', () => {
    const r = sirilAdminConfig({ collections: [{ slug: 'cases', fields: [] } as any] })
    expect(r.collections.map((c: any) => c.slug)).toContain('cases')
    expect(typeof r.endpoints).toBe('object')
    expect(typeof r.hooks).toBe('object')
  })
  it('пустой проект — core без изменений (референс)', () => {
    const r = sirilAdminConfig({})
    expect(Array.isArray(r.collections)).toBe(true)
  })
})
