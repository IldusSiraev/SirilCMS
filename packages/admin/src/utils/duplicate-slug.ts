/**
 * Payload's own default beforeDuplicate hook for a unique text field appends
 * " - Copy" (spaces + uppercase) — invalid as a URL path segment. This
 * produces a clean, unique kebab-case slug instead.
 */
export function makeDuplicateSlug(value: string | null | undefined): string | undefined {
  if (!value) return undefined
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${value}-copy-${suffix}`
}
