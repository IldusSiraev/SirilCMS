import { readBody } from 'h3'
import { clearCache, clearCacheForHost } from '../utils/page-cache'
import { clearSiteCache, clearSiteCacheForHost } from './site.get'
import { payloadGet } from '../utils/payload'

export default defineEventHandler(async (event) => {
  const { PURGE_TOKEN } = useRuntimeConfig()
  const auth = getHeader(event, 'authorization')
  if (auth !== `Bearer ${PURGE_TOKEN}`) throw createError({ statusCode: 401 })

  const body = await readBody<{ siteId?: number }>(event).catch(() => undefined)
  const siteId = body?.siteId
  if (siteId) {
    const site = await payloadGet<{ domain?: string }>(`sites/${siteId}`).catch(() => null)
    if (site?.domain) {
      clearCacheForHost(site.domain)
      clearSiteCacheForHost(site.domain)
      return { ok: true, scope: site.domain }
    }
  }
  // Без siteId или домен сайта не резолвится (ещё не задан) — безопасный дефолт: чистим всё.
  clearCache()
  clearSiteCache()
  return { ok: true, scope: 'all' }
})
