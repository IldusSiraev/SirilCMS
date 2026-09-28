import { it, expect } from 'vitest'
import { yandexMetrikaTag } from './analytics'

it('valid numeric counter id -> script + noscript with that id', () => {
  const tag = yandexMetrikaTag('12345678')
  expect(tag).not.toBeNull()
  expect(tag!.script).toContain('ym(12345678, "init"')
  expect(tag!.noscript).toContain('https://mc.yandex.ru/watch/12345678')
})
it('null/undefined/empty -> null', () => {
  expect(yandexMetrikaTag(null)).toBe(null)
  expect(yandexMetrikaTag(undefined)).toBe(null)
  expect(yandexMetrikaTag('')).toBe(null)
})
it('non-numeric id -> null (rejects injection attempts)', () => {
  expect(yandexMetrikaTag('12345"; alert(1); "')).toBe(null)
  expect(yandexMetrikaTag('12a34')).toBe(null)
  expect(yandexMetrikaTag('abc')).toBe(null)
})
