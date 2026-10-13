import type { BlockDef, ThemeDef } from './types'

/** Override по `type`: запись проекта заменяет core целиком; новые типы — в конец. Порядок core сохраняется. */
export function mergeBlockRegistry(core: BlockDef[], extra: BlockDef[]): BlockDef[] {
  if (extra.length === 0) return core
  const map = new Map(core.map((b) => [b.type, b] as const))
  for (const b of extra) map.set(b.type, b)
  return Array.from(map.values())
}

/** Override по `id` (полная замена темы — путь «1:1 по верстке клиента»); новые — в конец. */
export function mergeThemeRegistry(coreThemeDecls: ThemeDef[], extraThemes: ThemeDef[]): ThemeDef[] {
  if (extraThemes.length === 0) return coreThemeDecls
  const map = new Map(coreThemeDecls.map((t) => [t.id, t] as const))
  for (const t of extraThemes) map.set(t.id, t)
  return Array.from(map.values())
}
