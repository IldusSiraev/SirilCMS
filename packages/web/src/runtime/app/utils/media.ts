// Payload 3: бинарник файла отдаётся по /api/media/file/{filename} (НЕ /api/media/{id} — это JSON)
// Размеры (imageSizes в collections/media.ts): sm 480w, md 960w, lg 1600w — WebP. Старые файлы без
// сгенерированных размеров (и svg/pdf/видео) отдаются оригиналом — фолбэк, контент не ломается.
export type MediaSize = 'sm' | 'md' | 'lg'

type SizeEntry = { filename?: string | null } | null | undefined

export function mediaUrl(media: unknown, size?: MediaSize): string | null {
  if (media == null || typeof media !== 'object') return null
  const m = media as { filename?: string | null; sizes?: Record<string, SizeEntry> }
  const filename = (size ? m.sizes?.[size]?.filename : null) || m.filename
  if (!filename) return null
  const base = useRuntimeConfig().public.MEDIA_BASE
  return `${base}/api/media/file/${encodeURIComponent(filename)}`
}
