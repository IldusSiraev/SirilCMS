import { BLOCKS, THEMES, mergeBlockRegistry, mergeThemeRegistry } from '@siril/contracts'
import type { BlockDef } from '@siril/contracts'
import type { SirilModuleOptions } from './module'

export function mergeOptions(options: SirilModuleOptions) {
  return {
    blocks: mergeBlockRegistry(BLOCKS as unknown as Record<string, BlockDef>, options.blocks ?? {}),
    themes: mergeThemeRegistry(THEMES, options.themes ?? []),
  }
}
