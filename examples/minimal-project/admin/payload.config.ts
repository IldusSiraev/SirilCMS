import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import { en } from '@payloadcms/translations/languages/en'
import { ru } from '@payloadcms/translations/languages/ru'
import sharp from 'sharp'

import { sirilAdminConfig } from '@sirilcms/admin'
import { blocks, themes } from '../siril.extensions'
import { Cases } from './src/collections/cases'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const { collections, endpoints } = sirilAdminConfig({
  adminUiBase: './admin-ui',
  blocks,
  themes,
  collections: [Cases],
})

export default buildConfig({
  admin: {
    importMap: { baseDir: path.resolve(dirname, 'node_modules/@sirilcms/admin/dist') },
  },
  collections,
  endpoints,
  editor: lexicalEditor(),
  db: postgresAdapter({
    // Единый каталог миграций проекта: core-файлы копирует `pnpm migrations:sync`, проектные генерирует `migrate:generate`.
    migrationDir: path.resolve(dirname, 'src/migrations'),
    pool: { connectionString: process.env.PAYLOAD_DB_URI ?? '' },
  }),
  secret: process.env.PAYLOAD_SECRET ?? 'dev-secret',
  serverURL: process.env.PAYLOAD_URL ?? 'http://localhost:3001',
  sharp,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  i18n: { fallbackLanguage: 'en', supportedLanguages: { en, ru } },
})
