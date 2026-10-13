import { lexicalEditor } from '@payloadcms/richtext-lexical'

// Фичи, чьи узлы lexicalHTMLField не умеет сериализовать: на публичном сайте они превращаются
// в буквальный текст «unknown node». Проверено вживую (см. CHANGELOG): relationship-embed.
// Остальные дефолтные фичи (upload, ссылки, списки/чек-листы, quote, hr, форматирование, выравнивание)
// рендерятся корректно; `javascript:`-ссылки нейтрализуются в `#`.
export const UNRENDERABLE_FEATURE_KEYS = ['relationship'] as const

export const omitUnrenderable = <T extends { key: string }>(features: T[]): T[] =>
  features.filter(f => !(UNRENDERABLE_FEATURE_KEYS as readonly string[]).includes(f.key))

/** Дефолтный rich-text редактор движка: lexicalEditor() без фич, ломающих публичный рендер. */
export const sirilEditor = () =>
  lexicalEditor({ features: ({ defaultFeatures }) => omitUnrenderable(defaultFeatures) })
