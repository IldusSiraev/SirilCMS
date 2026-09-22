import type { BlockDef, ThemeBlockConfig, ThemeDef } from './types'

// Заполняется в T9–T12 (append-only). Точка расширения — только этот файл.
export const BLOCKS: BlockDef[] = []
const defaultThemeFrom = (blocks: BlockDef[]): ThemeDef => ({
  id: 'default', name: 'Default', tokens: { '--c-primary': '#0f766e' },
  blocks: Object.fromEntries(blocks.map(b => [b.type, { enabled: true }] as [string, ThemeBlockConfig])),
})
export const THEMES: ThemeDef[] = [defaultThemeFrom(BLOCKS)]
export const getBlock = (type: string): BlockDef | undefined => BLOCKS.find(b => b.type === type)
export const getTheme = (id: string): ThemeDef => THEMES.find(t => t.id === id) ?? THEMES[0]
