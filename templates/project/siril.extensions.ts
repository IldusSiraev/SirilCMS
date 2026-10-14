// Единый источник расширений проекта: его импортируют и web (web/nuxt.config.ts), и admin (admin/payload.config.ts).
// Контракты — чистые данные (формат BlockDef/ThemeDef из @sirilcms/contracts). Руководство: docs/extension-api.md движка.
import type { BlockDef, ThemeDef } from '@sirilcms/contracts'

// Новый тип блока: контракт здесь + Vue-компонент web/app/blocks/<type>/<Variant>.vue (Variant = PascalCase id варианта).
export const blocks: BlockDef[] = []

// Клиентская тема: ThemeDef здесь + web/themes/<id>/tokens.css (CSS-переменные темы).
// Добавление/удаление темы меняет enum в БД → `pnpm migrate:generate` и коммит миграции.
export const themes: ThemeDef[] = []
