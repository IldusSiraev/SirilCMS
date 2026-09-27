import { BLOCKS } from './registry'
import type { BlockDef, ThemeDef } from './types'

export function allowedVariants(theme: ThemeDef, block: BlockDef): string[] {
  const cfg = theme.blocks[block.type]
  const all = block.variants.map(v => v.id)
  if (!cfg) return [all[0]!]
  const set = cfg.variants ?? all
  const filtered = set.length ? set.filter(id => all.includes(id)) : []
  // set may name variant ids that don't exist on this block (theme misconfiguration) —
  // never return empty, or resolveVariant below would resolve to an undefined variant.
  return filtered.length ? filtered : [all[0]!]
}

export function resolveVariant(theme: ThemeDef, block: BlockDef, variantId: string | null | undefined): { variant: string; fallback: boolean } {
  const cfg = theme.blocks[block.type]
  const allowed = allowedVariants(theme, block)
  const preferred = cfg?.defaultVariant ?? block.variants[0]!.id
  const firstOk = allowed.includes(preferred) ? preferred : allowed[0]!
  if (!cfg?.enabled) return { variant: firstOk, fallback: true }
  if (variantId && allowed.includes(variantId)) return { variant: variantId, fallback: false }
  return { variant: firstOk, fallback: true }
}

export function paletteForTheme(theme: ThemeDef) {
  return BLOCKS.filter(b => theme.blocks[b.type]?.enabled)
}
