import type { BlockDef, ThemeDef } from './types'

export function mergeBlockRegistry(core: Record<string, BlockDef>, extra: Record<string, BlockDef>): Record<string, BlockDef> {
  if (Object.keys(extra).length === 0) return core
  return { ...core, ...extra }
}

export function mergeThemeRegistry(coreThemeDecls: ThemeDef[], extraThemes: ThemeDef[]): ThemeDef[] {
  if (extraThemes.length === 0) return coreThemeDecls
  const map = new Map(coreThemeDecls.map((t) => [t.id, t] as const))
  for (const t of extraThemes) map.set(t.id, t)
  const out = Array.from(map.values())
  return out
}
