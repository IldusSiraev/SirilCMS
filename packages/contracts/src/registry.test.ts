import { describe, expect, it } from 'vitest'
import { BLOCKS } from './registry'
import type { BlockField } from './types'

function collectFields(fields: BlockField[]): BlockField[] {
  return fields.flatMap(f => [f, ...(f.subfields ? collectFields(f.subfields) : [])])
}

describe('BLOCKS — лейблы полей переведены (ru/en), не голые русские строки', () => {
  for (const block of BLOCKS) {
    for (const variant of block.variants) {
      it(`${block.type}/${variant.id}`, () => {
        for (const field of collectFields(variant.fields)) {
          expect(field.label, `${block.type}/${variant.id}.${field.name}`).toEqual(
            expect.objectContaining({ ru: expect.any(String), en: expect.any(String) }),
          )
        }
      })
    }
  }
})
