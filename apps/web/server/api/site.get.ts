import { payloadGet } from '../utils/payload'
import { resolveSite } from '../utils/site-resolve'

const cache = new Map<string, { at: number; data: unknown }>()

// Чистим кэш при purge, чтобы свитч темы (sites.theme) применялся без задержки в 30 с
export function clearSiteCache() {
  cache.clear()
}

export default defineEventHandler(async (event) => {
  const host = String(getQuery(event).host ?? getRequestHost(event) ?? '')
  const cached = cache.get(host)
  if (cached && Date.now() - cached.at < 30_000) return cached.data

  const site = await resolveSite(host)
  const contents = site
    ? await payloadGet<{ docs: any[] }>(`site-content?where[site][equals]=${site.id}&limit=1`)
    : { docs: [] }
  const data = { site: site ?? null, content: contents.docs[0] ?? null }
  cache.set(host, { at: Date.now(), data })
  return data
})
