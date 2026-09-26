export function buildPreviewURL(
  nuxtUrl: string,
  kind: 'page' | 'post',
  slug: string | undefined,
  token: string | null,
): string | null {
  if (!slug || !token) return null
  return `${nuxtUrl}/preview/${kind}/${encodeURIComponent(slug)}?token=${encodeURIComponent(token)}`
}
