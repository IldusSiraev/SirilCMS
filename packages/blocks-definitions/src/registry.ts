import type { BlockDef, ThemeBlockConfig, ThemeDef } from './types'

// Заполняется в T9–T12 (append-only). Точка расширения — только этот файл.
export const BLOCKS: BlockDef[] = [
  { type: 'hero', name: 'Hero', description: 'Первый экран', variants: [
    { id: 'default', name: 'Центр', fields: [
      { name: 'title', type: 'text', label: 'Заголовок', required: true },
      { name: 'subtitle', type: 'richtext', label: 'Подзаголовок' },
      { name: 'buttonText', type: 'text', label: 'Кнопка' },
      { name: 'buttonLink', type: 'link', label: 'Ссылка кнопки' },
    ] },
    { id: 'split', name: 'Сплит', fields: [
      { name: 'title', type: 'text', label: 'Заголовок', required: true },
      { name: 'subtitle', type: 'richtext', label: 'Подзаголовок' },
      { name: 'image', type: 'image', label: 'Изображение' },
    ] },
  ] },
  { type: 'text-image', name: 'Текст + изображение', variants: [
    { id: 'default', name: 'Справа', fields: [
      { name: 'title', type: 'text', label: 'Заголовок' },
      { name: 'body', type: 'richtext', label: 'Текст' },
      { name: 'image', type: 'image', label: 'Изображение' },
    ] },
    { id: 'split', name: 'Слева', fields: [
      { name: 'title', type: 'text', label: 'Заголовок' },
      { name: 'body', type: 'richtext', label: 'Текст' },
      { name: 'image', type: 'image', label: 'Изображение' },
    ] },
  ] },
  { type: 'features', name: 'Возможности', variants: [
    { id: 'default', name: 'Сетка', fields: [
      { name: 'title', type: 'text', label: 'Заголовок' },
      { name: 'items', type: 'array-text', label: 'Пункты', maxItems: 12 },
    ] },
  ] },
]
const defaultThemeFrom = (blocks: BlockDef[]): ThemeDef => ({
  id: 'default', name: 'Default', tokens: { '--c-primary': '#0f766e' },
  blocks: Object.fromEntries(blocks.map(b => [b.type, { enabled: true }] as [string, ThemeBlockConfig])),
})
export const THEMES: ThemeDef[] = [defaultThemeFrom(BLOCKS)]
export const getBlock = (type: string): BlockDef | undefined => BLOCKS.find(b => b.type === type)
export const getTheme = (id: string): ThemeDef => THEMES.find(t => t.id === id) ?? THEMES[0]
