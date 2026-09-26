import type { BlockDef, ThemeBlockConfig, ThemeDef } from './types'

// Заполняется в T9–T12 (append-only). Точка расширения — только этот файл.
export const BLOCKS: BlockDef[] = [
  { type: 'hero', name: 'Hero', description: 'Первый экран', variants: [
    { id: 'default', name: 'Центр', layout: 'center', fields: [
      { name: 'title', type: 'text', label: { ru: 'Заголовок', en: 'Title' }, required: true },
      { name: 'subtitle', type: 'richtext', label: { ru: 'Подзаголовок', en: 'Subtitle' } },
      { name: 'buttonText', type: 'text', label: { ru: 'Кнопка', en: 'Button' } },
      { name: 'buttonLink', type: 'link', label: { ru: 'Ссылка кнопки', en: 'Button link' } },
    ] },
    { id: 'split', name: 'Сплит', layout: 'split-right', fields: [
      { name: 'title', type: 'text', label: { ru: 'Заголовок', en: 'Title' }, required: true },
      { name: 'subtitle', type: 'richtext', label: { ru: 'Подзаголовок', en: 'Subtitle' } },
      { name: 'image', type: 'image', label: { ru: 'Изображение', en: 'Image' } },
    ] },
  ] },
  { type: 'text-image', name: 'Текст + изображение', variants: [
    { id: 'default', name: 'Справа', layout: 'split-right', fields: [
      { name: 'title', type: 'text', label: { ru: 'Заголовок', en: 'Title' } },
      { name: 'body', type: 'richtext', label: { ru: 'Текст', en: 'Text' } },
      { name: 'image', type: 'image', label: { ru: 'Изображение', en: 'Image' } },
    ] },
    { id: 'split', name: 'Слева', layout: 'split-left', fields: [
      { name: 'title', type: 'text', label: { ru: 'Заголовок', en: 'Title' } },
      { name: 'body', type: 'richtext', label: { ru: 'Текст', en: 'Text' } },
      { name: 'image', type: 'image', label: { ru: 'Изображение', en: 'Image' } },
    ] },
  ] },
  { type: 'features', name: 'Возможности', variants: [
    { id: 'default', name: 'Сетка', layout: 'grid', fields: [
      { name: 'title', type: 'text', label: { ru: 'Заголовок', en: 'Title' } },
      { name: 'items', type: 'array-text', label: { ru: 'Пункты', en: 'Items' }, maxItems: 12 },
    ] },
  ] },
  { type: 'pricing', name: 'Цены', variants: [
    { id: 'default', name: 'Сетка', layout: 'grid', fields: [
      { name: 'title', type: 'text', label: { ru: 'Заголовок', en: 'Title' } },
      { name: 'plans', type: 'object-array', label: { ru: 'Тарифы', en: 'Plans' }, maxItems: 6, subfields: [
        { name: 'title', type: 'text', label: { ru: 'Тариф', en: 'Plan' } },
        { name: 'price', type: 'text', label: { ru: 'Цена', en: 'Price' } },
        { name: 'description', type: 'richtext', label: { ru: 'Описание', en: 'Description' } },
        { name: 'buttonText', type: 'text', label: { ru: 'Кнопка (необяз.)', en: 'Button (optional)' } },
        { name: 'buttonLink', type: 'link', label: { ru: 'Ссылка кнопки', en: 'Button link' } },
        { name: 'featured', type: 'boolean', label: { ru: 'Выделенный', en: 'Featured' } },
      ] },
    ] },
  ]},
  { type: 'gallery', name: 'Галерея', variants: [
    { id: 'default', name: 'Сетка', layout: 'grid', fields: [
      { name: 'title', type: 'text', label: { ru: 'Заголовок', en: 'Title' } },
      { name: 'images', type: 'image-array', label: { ru: 'Картинки', en: 'Images' }, maxItems: 12 },
    ] },
  ]},
  { type: 'faq', name: 'FAQ', variants: [
    { id: 'default', name: 'Список', layout: 'list', fields: [
      { name: 'title', type: 'text', label: { ru: 'Заголовок', en: 'Title' } },
      { name: 'items', type: 'object-array', label: { ru: 'Вопросы', en: 'Questions' }, maxItems: 20, subfields: [
        { name: 'question', type: 'text', label: { ru: 'Вопрос', en: 'Question' }, required: true },
        { name: 'answer', type: 'richtext', label: { ru: 'Ответ', en: 'Answer' }, required: true },
      ] },
    ] },
  ]},
  { type: 'testimonials', name: 'Отзывы', variants: [
    { id: 'default', name: 'Сетка карточек', layout: 'grid', fields: [
      { name: 'title', type: 'text', label: { ru: 'Заголовок', en: 'Title' } },
      { name: 'items', type: 'object-array', label: { ru: 'Отзывы', en: 'Testimonials' }, maxItems: 9, subfields: [
        { name: 'quote', type: 'richtext', label: { ru: 'Цитата', en: 'Quote' } },
        { name: 'author', type: 'text', label: { ru: 'Автор', en: 'Author' } },
        { name: 'role', type: 'text', label: { ru: 'Роль/компания', en: 'Role/company' } },
        { name: 'avatar', type: 'image', label: { ru: 'Фото', en: 'Photo' } },
      ] },
    ] },
  ]},
  { type: 'team', name: 'Команда', variants: [
    { id: 'default', name: 'Сетка', layout: 'grid', fields: [
      { name: 'title', type: 'text', label: { ru: 'Заголовок', en: 'Title' } },
      { name: 'members', type: 'object-array', label: { ru: 'Люди', en: 'People' }, maxItems: 12, subfields: [
        { name: 'name', type: 'text', label: { ru: 'Имя', en: 'Name' }, required: true },
        { name: 'role', type: 'text', label: { ru: 'Роль', en: 'Role' } },
        { name: 'photo', type: 'image', label: { ru: 'Фото', en: 'Photo' } },
        { name: 'link', type: 'link', label: { ru: 'Ссылка (сайт/LinkedIn)', en: 'Link (website/LinkedIn)' } },
      ] },
    ] },
  ]},
  { type: 'portfolio-grid', name: 'Портфолио', variants: [
    { id: 'default', name: 'Сетка', layout: 'grid', fields: [
      { name: 'title', type: 'text', label: { ru: 'Заголовок', en: 'Title' } },
      { name: 'items', type: 'object-array', label: { ru: 'Работы', en: 'Works' }, maxItems: 24, subfields: [
        { name: 'title', type: 'text', label: { ru: 'Название', en: 'Name' }, required: true },
        { name: 'image', type: 'image', label: { ru: 'Обложка', en: 'Cover' } },
        { name: 'link', type: 'link', label: { ru: 'Ссылка (необяз.)', en: 'Link (optional)' } },
      ] },
    ] },
  ]},
  { type: 'cta', name: 'CTA', variants: [
    { id: 'default', name: 'Центр', layout: 'center', fields: [
      { name: 'title', type: 'text', label: { ru: 'Заголовок', en: 'Title' }, required: true },
      { name: 'body', type: 'richtext', label: { ru: 'Текст', en: 'Text' } },
      { name: 'buttonText', type: 'text', label: { ru: 'Кнопка', en: 'Button' } },
      { name: 'buttonLink', type: 'link', label: { ru: 'Ссылка кнопки', en: 'Button link' } },
    ] },
    { id: 'banner', name: 'Баннер с фоном', layout: 'banner', fields: [
      { name: 'title', type: 'text', label: { ru: 'Заголовок', en: 'Title' }, required: true },
      { name: 'body', type: 'richtext', label: { ru: 'Текст', en: 'Text' } },
      { name: 'image', type: 'image', label: { ru: 'Фоновое изображение', en: 'Background image' } },
      { name: 'buttonText', type: 'text', label: { ru: 'Кнопка', en: 'Button' } },
      { name: 'buttonLink', type: 'link', label: { ru: 'Ссылка кнопки', en: 'Button link' } },
    ] },
  ]},
  { type: 'contact', name: 'Контакты', variants: [
    { id: 'default', name: 'Карточка', layout: 'list', fields: [
      { name: 'title', type: 'text', label: { ru: 'Заголовок', en: 'Title' } },
      { name: 'email', type: 'email', label: { ru: 'Email', en: 'Email' } },
      { name: 'phone', type: 'text', label: { ru: 'Телефон', en: 'Phone' } },
      { name: 'address', type: 'text', label: { ru: 'Адрес', en: 'Address' } },
      { name: 'workHours', type: 'text', label: { ru: 'Часы работы', en: 'Working hours' } },
      { name: 'mapLink', type: 'link', label: { ru: 'Ссылка на карту', en: 'Map link' } },
    ] },
  ]},
  { type: 'post-list', name: 'Посты: список', variants: [
    { id: 'default', name: 'Список', layout: 'list', fields: [
      { name: 'title', type: 'text', label: { ru: 'Заголовок', en: 'Title' } },
      { name: 'limit', type: 'number', label: { ru: 'Сколько', en: 'Count' }, placeholder: '6' },
    ] },
  ]},
  { type: 'post-grid', name: 'Посты: сетка', variants: [
    { id: 'default', name: 'Сетка', layout: 'grid', fields: [
      { name: 'title', type: 'text', label: { ru: 'Заголовок', en: 'Title' } },
      { name: 'limit', type: 'number', label: { ru: 'Сколько', en: 'Count' }, placeholder: '9' },
    ] },
  ]},
  { type: 'form-block', name: 'Форма', variants: [
    { id: 'default', name: 'Форма обратной связи', layout: 'list', fields: [
      { name: 'form', type: 'form', label: { ru: 'Форма', en: 'Form' }, required: true },
    ] },
  ]},
]
// Явные темы (T12): default — текущий вид (teal); mono — ч/б, serif, часть вариантов недоступна → fallback.
const all = (): Record<string, ThemeBlockConfig> => Object.fromEntries(BLOCKS.map(b => [b.type, { enabled: true } as ThemeBlockConfig]))
const defaultTheme: ThemeDef = {
  id: 'default', name: 'Default (teal)',
  tokens: { '--c-primary': '#0f766e', '--c-bg': '#ffffff', '--c-text': '#111827', '--radius': '.5rem' },
  blocks: { ...all(), 'form-block': { enabled: true } }, // form-block — forward-compat (T13)
}
const mono: ThemeDef = {
  id: 'mono', name: 'Mono (ч/б, serif)',
  tokens: { '--c-primary': '#111111', '--c-bg': '#ffffff', '--c-text': '#111111', '--radius': '0' },
  blocks: {
    ...all(), 'form-block': { enabled: false },
    hero: { enabled: true, variants: ['default'] },
    'text-image': { enabled: true, variants: ['default'] },
    cta: { enabled: true, variants: ['default'] },
  },
}
export const THEMES: ThemeDef[] = [defaultTheme, mono]
export const getBlock = (type: string): BlockDef | undefined => BLOCKS.find(b => b.type === type)
export const getTheme = (id: string): ThemeDef => THEMES.find(t => t.id === id) ?? defaultTheme
