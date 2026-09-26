import { payloadGet } from '../../utils/payload'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const slug = String(q.slug ?? '')
  const token = String(q.token ?? '')
  if (!slug || !token) return { page: null }
  const r = await payloadGet<{ docs: any[] }>(
    `pages?where[slug][equals]=${encodeURIComponent(slug)}&depth=1&draft=true`,
    { token },
  )
  return { page: r.docs[0] ?? null }
})
