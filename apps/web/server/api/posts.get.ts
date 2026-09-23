import { payloadGet } from '../utils/payload'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const raw = Number(q.limit ?? 12)
  const limit = Math.min(50, Math.max(1, Number.isFinite(raw) ? Math.floor(raw) : 12))
  const r = await payloadGet<{ docs: any[]; total?: number }>(
    `posts?limit=${limit}&sort=-createdAt&depth=1`,
  )
  return { docs: r.docs ?? [], total: r.total ?? (r.docs ?? []).length }
})
