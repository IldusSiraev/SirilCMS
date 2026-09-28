// Payload 3: бинарник файла отдаётся по /api/media/file/{filename} (НЕ /api/media/{id} — это JSON)
export function mediaUrl(media: unknown): string | null {
  if (media == null || typeof media !== 'object') return null
  const filename = (media as { filename?: string | null }).filename
  if (!filename) return null
  const base = useRuntimeConfig().public.MEDIA_BASE
  return `${base}/api/media/file/${encodeURIComponent(filename)}`
}
