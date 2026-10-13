const hits = new Map<string, number[]>()
const MAX_KEYS = 10_000

export function rateLimit(key: string, limit = 3, windowMs = 60_000): boolean {
  const now = Date.now()
  if (hits.size >= MAX_KEYS) for (const [k, arr] of hits) if (!arr.some(t => now - t < windowMs)) hits.delete(k)
  const arr = (hits.get(key) ?? []).filter(t => now - t < windowMs)
  if (arr.length >= limit) { if (arr.length) hits.set(key, arr); else hits.delete(key); return false }
  arr.push(now); hits.set(key, arr)
  return true
}
