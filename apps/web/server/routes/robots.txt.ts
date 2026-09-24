export default defineEventHandler((event) => {
  event.node.res.setHeader('content-type', 'text/plain; charset=utf-8')
  return `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: https://${useRuntimeConfig().public.SITE_DOMAIN}/sitemap.xml\n`
})
