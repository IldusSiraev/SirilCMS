import { clearCache } from '../utils/page-cache'

export default defineEventHandler((event) => {
  const { PURGE_TOKEN } = useRuntimeConfig()
  const auth = getHeader(event, 'authorization')
  if (auth !== `Bearer ${PURGE_TOKEN}`) throw createError({ statusCode: 401 })
  clearCache()
  return { ok: true }
})
