import { payloadGet } from '../../utils/payload'
import { resolveSite } from '../../utils/site-resolve'

export default defineEventHandler(async (event) => {
  const slug = String(event.context.params?.slug ?? '')
  const host = String(getQuery(event).host ?? getRequestHost(event) ?? '')
  if (!slug) return { post: null }
  const site = await resolveSite(host)
  if (!site) return { post: null }
  const r = await payloadGet<{ docs: any[] }>(
    `posts?where[slug][equals]=${encodeURIComponent(slug)}&where[site][equals]=${site.id}&depth=1`,
  )
  return { post: r.docs[0] ?? null }
})
