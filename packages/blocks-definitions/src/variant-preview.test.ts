import { describe, expect, it } from 'vitest'
import { variantPreviewSvg } from './variant-preview'

function rectWidths(svg: string): number[] {
  return [...svg.matchAll(/<rect[^>]*width="(\d+(?:\.\d+)?)"/g)].map((m) => Number(m[1]))
}

function rectCount(svg: string): number {
  return (svg.match(/<rect/g) ?? []).length
}

describe('variantPreviewSvg', () => {
  it('wraps every layout in a 120x72 viewBox svg', () => {
    const svg = variantPreviewSvg('center')
    expect(svg).toContain('viewBox="0 0 120 72"')
    expect(svg.startsWith('<svg')).toBe(true)
  })

  it('center: no image placeholder (small accent rect), has a centered title bar', () => {
    const svg = variantPreviewSvg('center')
    expect(svg).not.toContain('fill="#94a3b8"')
    expect(svg).toContain('fill="#475569"')
  })

  it('split-left: image placeholder sits on the left (x < 20)', () => {
    const svg = variantPreviewSvg('split-left')
    const match = svg.match(/<rect x="(\d+(?:\.\d+)?)"[^>]*fill="#94a3b8"/)
    expect(match).not.toBeNull()
    expect(Number(match![1])).toBeLessThan(20)
  })

  it('split-right: image placeholder sits on the right (x > 50)', () => {
    const svg = variantPreviewSvg('split-right')
    const match = svg.match(/<rect x="(\d+(?:\.\d+)?)"[^>]*fill="#94a3b8"/)
    expect(match).not.toBeNull()
    expect(Number(match![1])).toBeGreaterThan(50)
  })

  it('banner: full-bleed background rect (120x72) in the accent color', () => {
    const svg = variantPreviewSvg('banner')
    expect(svg).toContain('<rect width="120" height="72" fill="#94a3b8"/>')
  })

  it('grid: four small squares plus the background rect', () => {
    const svg = variantPreviewSvg('grid')
    expect(rectCount(svg)).toBe(5)
    const widths = rectWidths(svg)
    expect(widths.filter((w) => w < 60)).toHaveLength(4)
  })

  it('list: wide stacked rows plus the background rect', () => {
    const svg = variantPreviewSvg('list')
    expect(rectCount(svg)).toBe(5)
    const widths = rectWidths(svg)
    expect(widths.filter((w) => w === 104)).toHaveLength(4)
  })

  it('is deterministic', () => {
    expect(variantPreviewSvg('grid')).toBe(variantPreviewSvg('grid'))
  })
})
