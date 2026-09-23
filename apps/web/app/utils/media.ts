export function mediaUrl(id?: string | null): string | null {
  if (!id) return null
  const base = useRuntimeConfig().public.MEDIA_BASE
  return `${base}/api/media/${id}`
}
