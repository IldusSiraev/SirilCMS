import { payloadGet } from '../../utils/payload'

export default defineEventHandler(async (event) => {
  const slug = String(event.context.params?.slug ?? '')
  if (!slug) return { post: null }
  const r = await payloadGet<{ docs: any[] }>(
    `posts?where[slug][equals]=${encodeURIComponent(slug)}&depth=1`,
  )
  return { post: r.docs[0] ?? null }
})
