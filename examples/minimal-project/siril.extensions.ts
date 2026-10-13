// Единый источник расширений проекта: его импортируют и web (nuxt.config.ts), и admin (payload.config.ts).
// Контракты — чистые данные (формат BlockDef/ThemeDef из @siril/contracts).
import type { BlockDef, ThemeDef } from '@siril/contracts'

// Новый тип блока. Vue-компонент — web/app/blocks/cases/Card.vue (файл = PascalCase id варианта).
export const casesBlock: BlockDef = {
  type: 'cases',
  name: 'Кейсы',
  variants: [
    {
      id: 'card',
      name: 'Карточка',
      layout: 'grid',
      fields: [
        { name: 'title', type: 'text', label: { ru: 'Заголовок', en: 'Title' }, required: true },
        { name: 'items', type: 'array-text', label: { ru: 'Кейсы', en: 'Cases' }, maxItems: 12 },
      ],
    },
  ],
}

// Клиентская тема: токены (inline в блоках) + web/themes/client/tokens.css (CSS-переменные в <head>).
export const clientTheme: ThemeDef = {
  id: 'client',
  name: 'Client (example)',
  tokens: { '--c-primary': '#b91c1c', '--c-bg': '#fffbeb', '--c-text': '#1c1917', '--radius': '1rem' },
  blocks: {
    hero: { enabled: true },
    'text-image': { enabled: true },
    cta: { enabled: true },
    cases: { enabled: true },
  },
}

export const blocks = [casesBlock]
export const themes = [clientTheme]
