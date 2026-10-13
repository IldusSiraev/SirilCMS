import { createHash, timingSafeEqual } from 'node:crypto'

/** Constant-time проверка `Authorization: Bearer <token>`; пустой/незаданный токен никогда не проходит. */
export function bearerMatches(header: string | undefined, token: string | undefined): boolean {
  if (!token || !header) return false
  const digest = (v: string) => createHash('sha256').update(v).digest()
  return timingSafeEqual(digest(header), digest(`Bearer ${token}`))
}
