export const RELEASE_PACKAGES: string[]
export function nextVersion(current: string, kind: string): string
export function assertLockstep(versions: Record<string, string>): string
export function unreleasedBody(changelog: string): string | null
export function rollChangelog(changelog: string, version: string, date: string): string
export function assertTagMatches(tag: string, version: string): void
export function highestReleased(changelog: string): string | null
export function assertGreaterThanReleased(version: string, changelog: string): void
