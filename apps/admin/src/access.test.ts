import { describe, expect, it } from 'vitest'
import { canScope, isOwner } from './access/site-scope'

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
