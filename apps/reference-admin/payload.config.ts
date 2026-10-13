import { postgresAdapter } from '@payloadcms/db-postgres'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { en } from '@payloadcms/translations/languages/en'
import { ru } from '@payloadcms/translations/languages/ru'

import { bootstrapOwner, sirilAdminConfig, sirilEditor } from '@siril/admin'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

try {
  process.loadEnvFile(path.resolve(dirname, '../../.env'))
} catch {
  // no root .env (e.g. prod containers get env vars injected directly) — ignore
}

// Reference app: all core collections/endpoints come from the @siril/admin package.
// S0.2: admin UI components live in the package — baseDir points there, contract
// strings are `./admin-ui/*` (adminUiBase) and resolve to packages/admin/src/admin-ui/*.
const { collections, endpoints } = sirilAdminConfig({ adminUiBase: './admin-ui' })

export default buildConfig({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname, '../../packages/admin/src'),
    },
  },
  collections,
  // Отложенная публикация (versions.drafts.schedulePublish у pages/posts) исполняется очередью jobs:
  // раз в минуту Payload сам запускает воркер в процессе admin (admin — один долгоживущий node-процесс).
  jobs: {
    autoRun: [{ cron: '* * * * *', limit: 10, queue: 'default' }],
  },
  // Prod: первый owner создаётся из INITIAL_OWNER_EMAIL/PASSWORD (infra/scripts/init-env.sh), анонимная
  // самрегистрация выключена DISABLE_FIRST_USER_SIGNUP=true (docker-compose.prod.yml).
  onInit: async (payload) => {
    await bootstrapOwner(payload)
  },
  // Дефолт для всех richText-полей (posts.body, richtext-поля блоков) — реальный WYSIWYG
  // вместо MVP-заглушки (см. docs/developer.md §rich text). Явный editor на поле не задаём —
  // используют этот дефолт.
  editor: sirilEditor(),
  db: postgresAdapter({
    // Canonical migrations live in @siril/admin — pinned explicitly because Payload's default
    // dir is CWD-relative and the app-local dir is git-ignored.
    migrationDir: path.resolve(dirname, '../../packages/admin/src/migrations'),
    pool: {
      connectionString: process.env.PAYLOAD_DB_URI ?? '',
    },
  }),
  sharp, // ресайз/WebP для media.imageSizes
  secret: process.env.PAYLOAD_SECRET ?? 'dev-secret',
  serverURL: process.env.PAYLOAD_URL ?? 'http://localhost:3001',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  // Payload 3.90: custom REST endpoints — top-level `endpoints` (config.endpoints, dist: utilities/handleEndpoints.js).
  // НЕ `custom: { endpoints }` — в маршрутизации custom.* не читается.
  endpoints,
  plugins: [],
  i18n: {
    fallbackLanguage: 'en',
    supportedLanguages: { en, ru },
  },
})
