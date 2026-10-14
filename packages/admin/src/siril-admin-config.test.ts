import { afterEach, describe, expect, it } from 'vitest'
import { resetExtensions } from '@sirilcms/contracts'
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

  describe('extension API: blocks/themes проекта', () => {
    afterEach(() => resetExtensions())
    const cases = { type: 'cases', name: 'Cases', variants: [{ id: 'card', name: 'Card', fields: [{ name: 'title', type: 'text' as const, label: { en: 'Title' } }] }] }
    const client = { id: 'client', name: 'Client', tokens: {}, blocks: { cases: { enabled: true } } }
    const col = (r: ReturnType<typeof sirilAdminConfig>, slug: string): any => r.collections.find((c: any) => c.slug === slug)

    it('блок проекта попадает в pages.sections', () => {
      const r = sirilAdminConfig({ blocks: [cases] })
      const sections = col(r, 'pages').fields.find((f: any) => f.name === 'sections')
      expect(sections.blocks.map((b: any) => b.slug)).toContain('cases')
    })
    it('тема проекта попадает в sites.theme options', () => {
      const r = sirilAdminConfig({ themes: [client] })
      const theme = col(r, 'sites').fields.find((f: any) => f.name === 'theme')
      expect(theme.options.map((o: any) => o.value)).toEqual(['default', 'mono', 'client'])
    })
    it('без расширений — только core (повторный вызов не накапливает)', () => {
      sirilAdminConfig({ blocks: [cases], themes: [client] })
      const r = sirilAdminConfig({})
      const sections = col(r, 'pages').fields.find((f: any) => f.name === 'sections')
      expect(sections.blocks.map((b: any) => b.slug)).not.toContain('cases')
    })
  })
})
