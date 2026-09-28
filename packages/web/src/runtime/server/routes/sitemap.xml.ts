import { payloadGet } from '../utils/payload'
import { resolveSite } from '../utils/site-resolve'

export default defineEventHandler(async (event) => {
  const host = getRequestHost(event) ?? ''
  const site = await resolveSite(host)
  if (!site) throw createError({ statusCode: 404 })
  const base = `https://${(site.domain as string | undefined) || host}`
  const [pages, posts] = await Promise.all([
    payloadGet<{ docs: any[] }>(`pages?where[site][equals]=${site.id}&limit=500&depth=1`),
    payloadGet<{ docs: any[] }>(`posts?where[site][equals]=${site.id}&limit=500`),
  ])
  const urls = [
    ...pages.docs.map(p => `<url><loc>${p.slug === 'home' ? base : `${base}/${p.slug}`}</loc></url>`),
    ...posts.docs.map(p => `<url><loc>${base}/blog/${p.slug}</loc></url>`),
  ].join('')
  event.node.res.setHeader('content-type', 'application/xml; charset=utf-8')
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`
})
