import { payloadGet } from '../utils/payload'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const slug = String(q.slug ?? '')
  if (!slug) return { page: null }
  const r = await payloadGet<{ docs: any[] }>(
    `pages?where[slug][equals]=${encodeURIComponent(slug)}&depth=1`,
  )
  return { page: r.docs[0] ?? null }
})
