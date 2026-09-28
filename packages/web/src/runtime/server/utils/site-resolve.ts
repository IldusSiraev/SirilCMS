import { payloadGet } from './payload'

/**
 * Picks the Site matching the request Host (case-insensitive). Falls back to
 * the only Site when nothing matches — keeps today's single-site deployments
 * working even if `Sites.domain` is left blank/mismatched, since `domain`
 * isn't required/unique at the schema level yet.
 */
export function pickSiteByHost<T extends { domain?: string | null }>(sites: T[], host: string): T | null {
  const h = host.toLowerCase()
  const exact = sites.find(s => s.domain?.toLowerCase() === h)
  if (exact) return exact
  if (sites.length === 1) return sites[0]!
  return null
}

export async function resolveSite(host: string): Promise<{ id: number; [key: string]: unknown } | null> {
  const { docs } = await payloadGet<{ docs: { id: number; domain?: string | null }[] }>('sites?limit=100')
  return pickSiteByHost(docs, host)
}
