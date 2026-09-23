const m = new Map<string, { html: string; exp: number }>()

export function setCache(key: string, html: string, ttlMs: number) {
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
