import { payloadGet } from '../utils/payload'
import { resolveSite } from '../utils/site-resolve'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const raw = Number(q.limit ?? 12)
  const limit = Math.min(50, Math.max(1, Number.isFinite(raw) ? Math.floor(raw) : 12))
  const host = String(q.host ?? getRequestHost(event) ?? '')
  const site = await resolveSite(host)
  if (!site) return { docs: [], total: 0 }
  const r = await payloadGet<{ docs: any[]; total?: number }>(
    `posts?where[site][equals]=${site.id}&limit=${limit}&sort=-createdAt&depth=1`,
  )
  return { docs: r.docs ?? [], total: r.total ?? (r.docs ?? []).length }
})
