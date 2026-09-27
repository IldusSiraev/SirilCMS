import { beforeEach, describe, expect, it } from 'vitest'
import { getCacheMetrics, recordCacheHit, recordCacheMiss, resetCacheMetrics } from './metrics'

describe('cache metrics', () => {
  beforeEach(() => resetCacheMetrics())

  it('starts at zero', () => {
    expect(getCacheMetrics()).toEqual({ hits: 0, misses: 0 })
  })

  it('counts hits and misses independently', () => {
    recordCacheHit()
    recordCacheHit()
    recordCacheMiss()
    expect(getCacheMetrics()).toEqual({ hits: 2, misses: 1 })
  })
})
