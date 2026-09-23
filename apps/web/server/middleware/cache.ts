import { getCache, setCache } from '../utils/page-cache'

function toBuf(v: unknown): Buffer {
  if (Buffer.isBuffer(v)) return v
  if (v instanceof Uint8Array) return Buffer.from(v)
  if (typeof v === 'string') return Buffer.from(v, 'utf8')
  return Buffer.alloc(0)
}

export default defineEventHandler(async (event) => {
  const url = event.path
  if (event.method !== 'GET' || url.startsWith('/api') || url.startsWith('/media')) return
  const key = `${event.node.req.headers.host}:${url}`
  const ttl = Number(process.env.ROUTE_TTL ?? 300_000)
  const cached = getCache(key)
  if (cached) {
    setHeader(event, 'content-type', 'text/html; charset=utf-8')
    setHeader(event, 'x-siril-cache', 'HIT')
    return cached
  }
  setHeader(event, 'x-siril-cache', 'MISS')
  const res = event.node.res as unknown as {
    statusCode: number
    getHeader: (name: string) => string | string[] | undefined
    write: (chunk: unknown, ...args: unknown[]) => boolean
    end: (chunk?: unknown, ...args: unknown[]) => unknown
  }
  const chunks: Buffer[] = []
  const origWrite = res.write.bind(res)
  const origEnd = res.end.bind(res)
  res.write = (chunk: unknown, ...args: unknown[]) => {
    chunks.push(toBuf(chunk))
    return origWrite(chunk, ...args)
  }
  res.end = (chunk?: unknown, ...args: unknown[]) => {
    if (chunk != null) chunks.push(toBuf(chunk))
    const html = Buffer.concat(chunks)
    const contentType = String(res.getHeader('content-type') || '')
    if (res.statusCode === 200 && html.length > 0 && contentType.includes('text/html')) {
      setCache(key, html.toString('utf8'), ttl)
    }
    return origEnd(chunk, ...args)
  }
})
