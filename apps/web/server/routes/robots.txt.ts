import { resolveSite } from '../utils/site-resolve'

export default defineEventHandler(async (event) => {
  const host = getRequestHost(event) ?? ''
  const site = await resolveSite(host)
  const sitemap = site ? `Sitemap: https://${(site.domain as string | undefined) || host}/sitemap.xml\n` : ''
  event.node.res.setHeader('content-type', 'text/plain; charset=utf-8')
  return `User-agent: *\nAllow: /\nDisallow: /api/\n${sitemap}`
})
