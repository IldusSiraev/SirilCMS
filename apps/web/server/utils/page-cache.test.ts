import { describe, expect, it } from 'vitest'
import { clearCache, getCache, setCache } from './page-cache'
describe('page-cache', () => {
  it('возвращает значение в пределах TTL', () => {
    clearCache(); setCache('a', 'x', 60_000)
    expect(getCache('a')).toBe('x'); clearCache()
  })
  it('истечённый TTL → null', () => {
    clearCache(); setCache('b', 'y', -1)
    expect(getCache('b')).toBeNull(); clearCache()
  })
  it('clearCache всё сбрасывает', () => {
    clearCache(); setCache('c', 'z', 60_000)
    clearCache(); expect(getCache('c')).toBeNull()
  })
  it('не превышает 200 записей (evict oldest)', () => {
    clearCache()
    for (let i = 0; i < 201; i++) setCache(`k${i}`, `v${i}`, 60_000)
    expect(getCache('k0')).toBeNull(); expect(getCache('k200')).toBe('v200'); clearCache()
  })
  it('изоляция ключей', () => {
    clearCache(); setCache('a', 'x', 60_000)
    expect(getCache('b')).toBeNull(); clearCache()
  })
})
