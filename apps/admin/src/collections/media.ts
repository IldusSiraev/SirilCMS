import { access, mkdir, rename } from 'fs/promises'
import path from 'path'
import type { CollectionConfig } from 'payload'
import { isOwner } from '../access/site-scope'

const staticDir = path.resolve(process.cwd(), 'media')

async function fileExistsOnDisk(p: string): Promise<boolean> {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

// повторяет incrementName из payload/uploads/getSafeFilename.js
function incrementName(name: string): string {
  const dot = name.lastIndexOf('.')
  if (dot <= 0) {
    return `${name}-1`
  }
  const base = name.slice(0, dot)
  const ext = name.slice(dot)
  const m = /^(.*)-(\d+)$/.exec(base)
  if (!m) {
    return `${base}-1${ext}`
  }
  return `${m[1]}-${Number(m[2]) + 1}${ext}`
}

function resolveSiteId(site: unknown): number | string {
  if (site == null) {
    return 'default'
  }
  if (typeof site === 'object') {
    return (site as { id: number }).id
  }
  return site as number | string
}

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
    readVersions: () => false,
    create: ({ req: { user } }) => isOwner(user) || !!user,
    update: ({ req: { user } }) => isOwner(user),
    delete: ({ req: { user } }) => isOwner(user),
  },
  admin: {
    defaultColumns: ['name', 'alt'],
  },
  upload: {
    // v3: статический URL = `/{slug}` → /media
    staticDir,
    mimeTypes: ['image/*', 'video/mp4', 'application/pdf'],
  },
  fields: [
    {
      name: 'site',
      type: 'relationship',
      relationTo: 'sites',
      required: true,
    },
    {
      name: 'alt',
      type: 'text',
    },
    {
      name: 'caption',
      type: 'text',
    },
  ],
  hooks: {
    beforeOperation: [
      async (opCtx) => {
        // локальная dedup'а Payload смотрит RAW-имя без префикса, а UNIQUE
        // constraint на префиксированном — гоняем свою проверку по <site>/<имя>
        // до generateFileData и при необходимости переименовываем файл
        const ctx = opCtx as unknown as {
          args: {
            req: {
              file: { name: string } | null
              data: Record<string, unknown> | null
              payload: {
                find: (opts: {
                  collection: string
                  where: Record<string, unknown>
                  limit?: number
                  pagination?: boolean
                }) => Promise<{ docs: unknown[] }>
                findByID: (opts: {
                  collection: string
                  id: number | string
                  depth?: number
                }) => Promise<{ site?: number | null }>
              }
            }
            id?: number | string
          }
          collection: { slug: string }
          operation: string
        }
        const { args, collection, operation } = ctx
        const req = args.req
        const rawName = req.file?.name
        if (!rawName || collection.slug !== 'media') {
          return
        }
        let site = req.data?.site
        if (site == null && operation === 'update' && args.id != null) {
          const current = await req.payload.findByID({
            collection: 'media',
            id: args.id,
            depth: 0,
          })
          site = current.site
        }
        const siteId = resolveSiteId(site)
        let candidate = rawName
        for (let i = 0; i < 20; i++) {
          const [docTaken, diskTaken] = await Promise.all([
            req.payload.find({
              collection: 'media',
              where: { filename: { equals: `${siteId}/${candidate}` } },
              limit: 1,
              pagination: false,
            }),
            fileExistsOnDisk(path.join(staticDir, candidate)),
          ]).then(([res, disk]) => [res.docs.length > 0, disk])
          if (!docTaken && !diskTaken) {
            if (candidate !== rawName) {
              req.file = { ...req.file, name: candidate }
            }
            break
          }
          candidate = incrementName(candidate)
        }
      },
    ],
    beforeChange: [
      async (args) => {
        // префикс <site>/ — v2-ready
        const data = args.data as unknown as {
          site?: number | { id: number }
          filename?: string
        } | null
        const site = data?.site
        const siteId = resolveSiteId(site)
        const filename = data?.filename
        if (filename && !filename.startsWith(`${siteId}/`)) {
          data.filename = `${siteId}/${filename}`
        }
        return args.data
      },
    ],
    afterChange: [
      async ({ doc, req }) => {
        // v3 пишет файл по имени без префикса — переносим его в <site>/
        const filename = (doc as unknown as { filename?: string })?.filename
        if (!filename || !filename.includes('/')) {
          return doc
        }
        const base = filename.slice(filename.lastIndexOf('/') + 1)
        const src = path.join(staticDir, base)
        const dest = path.join(staticDir, filename)
        if (!(await fileExistsOnDisk(src))) {
          return doc
        }
        try {
          await mkdir(path.dirname(dest), { recursive: true })
          await rename(src, dest)
        } catch (err) {
          req.payload.logger.error({
            err,
            msg: 'media: failed to move uploaded file into site directory',
          })
          throw err
        }
        return doc
      },
    ],
  },
}
