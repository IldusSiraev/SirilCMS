import { postgresAdapter } from '@payloadcms/db-postgres'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import { en } from '@payloadcms/translations/languages/en'
import { ru } from '@payloadcms/translations/languages/ru'

import { Categories } from './src/collections/categories'
import { FormSubmissions } from './src/collections/form-submissions'
import { Forms } from './src/collections/forms'
import { Media } from './src/collections/media'
import { Pages } from './src/collections/pages'
import { Posts } from './src/collections/posts'
import { Sites } from './src/collections/sites'
import { SiteContent } from './src/collections/site-content'
import { Users } from './src/collections/users'
import { submissionsCsv } from './src/endpoints/submissions-csv'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

try {
  process.loadEnvFile(path.resolve(dirname, '../../.env'))
} catch {
  // no root .env (e.g. prod containers get env vars injected directly) — ignore
}

export default buildConfig({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Sites, Media, Users, Pages, Posts, Categories, SiteContent, Forms, FormSubmissions],
  db: postgresAdapter({
    pool: {
      connectionString: process.env.PAYLOAD_DB_URI ?? '',
    },
  }),
  secret: process.env.PAYLOAD_SECRET ?? 'dev-secret',
  serverURL: process.env.PAYLOAD_URL ?? 'http://localhost:3001',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  // Payload 3.90: custom REST endpoints — top-level `endpoints` (config.endpoints, dist: utilities/handleEndpoints.js).
  // НЕ `custom: { endpoints }` — в маршрутизации custom.* не читается.
  endpoints: [submissionsCsv],
  plugins: [],
  i18n: {
    fallbackLanguage: 'en',
    supportedLanguages: { en, ru },
  },
})
