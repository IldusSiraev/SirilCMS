import { describe, expect, it } from 'vitest'
import { omitUnrenderable } from './editor'

describe('omitUnrenderable', () => {
  it('drops relationship embed, keeps the rest', () => {
    const out = omitUnrenderable([{ key: 'paragraph' }, { key: 'relationship' }, { key: 'upload' }, { key: 'link' }])
    expect(out.map(f => f.key)).toEqual(['paragraph', 'upload', 'link'])
  })
})
