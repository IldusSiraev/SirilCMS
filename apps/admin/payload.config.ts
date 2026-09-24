import { postgresAdapter } from '@payloadcms/db-postgres'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'

import { Categories } from './src/collections/categories'
import { FormSubmissions } from './src/collections/form-submissions'
import { Forms } from './src/collections/forms'
import { Media } from './src/collections/media'
import { Pages } from './src/collections/pages'
import { Posts } from './src/collections/posts'
import { Sites } from './src/collections/sites'
import { SiteContent } from './src/collections/site-content'
import { Users } from './src/collections/users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

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
  plugins: [],
})
