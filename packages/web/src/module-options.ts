import { BLOCKS, THEMES, mergeBlockRegistry, mergeThemeRegistry } from '@sirilcms/contracts'
import type { SirilModuleOptions } from './module'

/** Смерженный (core + проект) реестр из опций модуля — для проверок/превью; рантайм использует registerExtensions. */
export function mergeOptions(options: SirilModuleOptions) {
  return {
    blocks: mergeBlockRegistry(BLOCKS, options.blocks ?? []),
    themes: mergeThemeRegistry(THEMES, options.themes ?? []),
  }
}
