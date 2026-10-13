export function forceOwnerForFirstUser<T extends { role?: string | null }>(data: T, existingUserCount: number): T {
  if (existingUserCount === 0) return { ...data, role: 'owner' }
  return data
}
