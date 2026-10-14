import { defineEventHandler, createError, getHeader, readBody, useRuntimeConfig } from '#imports'
import { clearCache, clearCacheForHost } from '../utils/page-cache'
import { clearSiteCache, clearSiteCacheForHost } from './site.get'
import { payloadGet } from '../utils/payload'
import { bearerMatches } from '../utils/bearer'
import { rateLimit } from '../utils/rate-limit'

export default defineEventHandler(async (event) => {
  const { PURGE_TOKEN } = useRuntimeConfig()
  const auth = getHeader(event, 'authorization')
  if (!bearerMatches(auth, PURGE_TOKEN)) {
    // Лимит только на неудачные попытки: легитимный publish-hook не страдает, перебор токена — да.
    const forwarded = event.headers.get('x-forwarded-for')
    const ip = (forwarded ? forwarded.split(',')[0]?.trim() : '') || (event.node.req.socket.remoteAddress ?? 'unknown')
    if (!rateLimit(`purge-fail:${ip}`, 10, 60_000)) throw createError({ statusCode: 429 })
    throw createError({ statusCode: 401 })
  }

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
