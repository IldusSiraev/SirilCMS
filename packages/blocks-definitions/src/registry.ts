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
  { type: 'pricing', name: 'Цены', variants: [
    { id: 'default', name: 'Сетка', fields: [
      { name: 'title', type: 'text', label: 'Заголовок' },
      { name: 'plans', type: 'object-array', label: 'Тарифы', maxItems: 6, subfields: [
        { name: 'title', type: 'text', label: 'Тариф' },
        { name: 'price', type: 'text', label: 'Цена' },
        { name: 'description', type: 'richtext', label: 'Описание' },
        { name: 'buttonText', type: 'text', label: 'Кнопка (необяз.)' },
        { name: 'buttonLink', type: 'link', label: 'Ссылка кнопки' },
        { name: 'featured', type: 'boolean', label: 'Выделенный' },
      ] },
    ] },
  ]},
  { type: 'gallery', name: 'Галерея', variants: [
    { id: 'default', name: 'Сетка', fields: [
      { name: 'title', type: 'text', label: 'Заголовок' },
      { name: 'images', type: 'image-array', label: 'Картинки', maxItems: 12 },
    ] },
  ]},
  { type: 'faq', name: 'FAQ', variants: [
    { id: 'default', name: 'Список', fields: [
      { name: 'title', type: 'text', label: 'Заголовок' },
      { name: 'items', type: 'object-array', label: 'Вопросы', maxItems: 20, subfields: [
        { name: 'question', type: 'text', label: 'Вопрос', required: true },
        { name: 'answer', type: 'richtext', label: 'Ответ', required: true },
      ] },
    ] },
  ]},
  { type: 'testimonials', name: 'Отзывы', variants: [
    { id: 'default', name: 'Сетка карточек', fields: [
      { name: 'title', type: 'text', label: 'Заголовок' },
      { name: 'items', type: 'object-array', label: 'Отзывы', maxItems: 9, subfields: [
        { name: 'quote', type: 'richtext', label: 'Цитата' },
        { name: 'author', type: 'text', label: 'Автор' },
        { name: 'role', type: 'text', label: 'Роль/компания' },
        { name: 'avatar', type: 'image', label: 'Фото' },
      ] },
    ] },
  ]},
  { type: 'team', name: 'Команда', variants: [
    { id: 'default', name: 'Сетка', fields: [
      { name: 'title', type: 'text', label: 'Заголовок' },
      { name: 'members', type: 'object-array', label: 'Люди', maxItems: 12, subfields: [
        { name: 'name', type: 'text', label: 'Имя', required: true },
        { name: 'role', type: 'text', label: 'Роль' },
        { name: 'photo', type: 'image', label: 'Фото' },
        { name: 'link', type: 'link', label: 'Ссылка (сайт/LinkedIn)' },
      ] },
    ] },
  ]},
  { type: 'portfolio-grid', name: 'Портфолио', variants: [
    { id: 'default', name: 'Сетка', fields: [
      { name: 'title', type: 'text', label: 'Заголовок' },
      { name: 'items', type: 'object-array', label: 'Работы', maxItems: 24, subfields: [
        { name: 'title', type: 'text', label: 'Название', required: true },
        { name: 'image', type: 'image', label: 'Обложка' },
        { name: 'link', type: 'link', label: 'Ссылка (необяз.)' },
      ] },
    ] },
  ]},
  { type: 'cta', name: 'CTA', variants: [
    { id: 'default', name: 'Центр', fields: [
      { name: 'title', type: 'text', label: 'Заголовок', required: true },
      { name: 'body', type: 'richtext', label: 'Текст' },
      { name: 'buttonText', type: 'text', label: 'Кнопка' },
      { name: 'buttonLink', type: 'link', label: 'Ссылка кнопки' },
    ] },
    { id: 'banner', name: 'Баннер с фоном', fields: [
      { name: 'title', type: 'text', label: 'Заголовок', required: true },
      { name: 'body', type: 'richtext', label: 'Текст' },
      { name: 'image', type: 'image', label: 'Фоновое изображение' },
      { name: 'buttonText', type: 'text', label: 'Кнопка' },
      { name: 'buttonLink', type: 'link', label: 'Ссылка кнопки' },
    ] },
  ]},
  { type: 'contact', name: 'Контакты', variants: [
    { id: 'default', name: 'Карточка', fields: [
      { name: 'title', type: 'text', label: 'Заголовок' },
      { name: 'email', type: 'email', label: 'Email' },
      { name: 'phone', type: 'text', label: 'Телефон' },
      { name: 'address', type: 'text', label: 'Адрес' },
      { name: 'workHours', type: 'text', label: 'Часы работы' },
      { name: 'mapLink', type: 'link', label: 'Ссылка на карту' },
    ] },
  ]},
  { type: 'post-list', name: 'Посты: список', variants: [
    { id: 'default', name: 'Список', fields: [
      { name: 'title', type: 'text', label: 'Заголовок' },
      { name: 'limit', type: 'number', label: 'Сколько', placeholder: '6' },
    ] },
  ]},
  { type: 'post-grid', name: 'Посты: сетка', variants: [
    { id: 'default', name: 'Сетка', fields: [
      { name: 'title', type: 'text', label: 'Заголовок' },
      { name: 'limit', type: 'number', label: 'Сколько', placeholder: '9' },
    ] },
  ]},
  { type: 'form-block', name: 'Форма', variants: [
    { id: 'default', name: 'Форма обратной связи', fields: [
      { name: 'form', type: 'form', label: 'Форма', required: true },
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
