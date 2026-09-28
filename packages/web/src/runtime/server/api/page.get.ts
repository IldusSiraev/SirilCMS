import { payloadGet } from '../utils/payload'
import { resolveSite } from '../utils/site-resolve'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const slug = String(q.slug ?? '')
  const host = String(q.host ?? getRequestHost(event) ?? '')
  if (!slug) return { page: null }
  const site = await resolveSite(host)
  if (!site) return { page: null }
  const r = await payloadGet<{ docs: any[] }>(
    `pages?where[slug][equals]=${encodeURIComponent(slug)}&where[site][equals]=${site.id}&depth=1`,
  )
  return { page: r.docs[0] ?? null }
})
