const m = new Map<string, { html: string; exp: number }>()
const MAX_ENTRIES = 200

export function setCache(key: string, html: string, ttlMs: number) {
  if (m.size >= MAX_ENTRIES && !m.has(key)) {
    const oldest = m.keys().next().value
    if (oldest !== undefined) m.delete(oldest)
  }
  m.set(key, { html, exp: Date.now() + ttlMs })
}

export function getCache(key: string): string | null {
  const e = m.get(key)
  if (!e) return null
  if (Date.now() > e.exp) {
    m.delete(key)
    return null
  }
  return e.html
}

export function clearCache() {
  m.clear()
}

export function clearCacheForHost(host: string) {
  const prefix = `${host}:`
  for (const key of m.keys()) {
    if (key.startsWith(prefix)) m.delete(key)
  }
}
