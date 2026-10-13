let hits = 0
let misses = 0

export function recordCacheHit() {
  hits++
}

export function recordCacheMiss() {
  misses++
}

export function getCacheMetrics(): { hits: number; misses: number } {
  return { hits, misses }
}

export function resetCacheMetrics() {
  hits = 0
  misses = 0
}
