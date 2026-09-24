import { afterEach, describe, expect, it, vi } from 'vitest'
import { rateLimit } from './rate-limit'

describe('rate-limit', () => {
  afterEach(() => { vi.useRealTimers() })

  it('пропускает до лимита (3), затем режет', () => {
    vi.useFakeTimers()
    expect(rateLimit('k')).toBe(true)
    expect(rateLimit('k')).toBe(true)
    expect(rateLimit('k')).toBe(true)
    expect(rateLimit('k')).toBe(false)
  })

  it('новое окно после windowMs сбрасывает счётчик', () => {
    vi.useFakeTimers()
    expect(rateLimit('k2')).toBe(true)
    expect(rateLimit('k2')).toBe(true)
    expect(rateLimit('k2')).toBe(true)
    expect(rateLimit('k2')).toBe(false)
    vi.advanceTimersByTime(60_001)
    expect(rateLimit('k2')).toBe(true)
  })

  it('изоляция ключей', () => {
    vi.useFakeTimers()
    expect(rateLimit('a')).toBe(true)
    expect(rateLimit('a')).toBe(true)
    expect(rateLimit('a')).toBe(true)
    expect(rateLimit('a')).toBe(false)
    expect(rateLimit('b')).toBe(true)
  })
})
