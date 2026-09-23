import { payloadGet } from '../utils/payload'

let cache: { at: number; data: unknown } | null = null

export default defineEventHandler(async (event) => {
  if (cache && Date.now() - cache.at < 30_000) return cache.data
  const [sites, contents] = await Promise.all([
    payloadGet<{ docs: any[] }>('sites?limit=1'),
    payloadGet<{ docs: any[] }>('site-content?limit=1'),
  ])
  const data = { site: sites.docs[0] ?? null, content: contents.docs[0] ?? null }
  cache = { at: Date.now(), data }
  return data
})
