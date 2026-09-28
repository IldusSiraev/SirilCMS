import { describe, expect, it } from 'vitest'
import { mergeOptions } from './module-options'

describe('module options', () => {
  it('пустые опции — core', () => {
    const r = mergeOptions({})
    expect(r.blocks).toBeDefined()
    expect(Object.keys(r.blocks).length).toBeGreaterThan(0)
  })
})
