import type { CollectionConfig } from 'payload'
import { canScope } from '../access/site-scope'
import { notifySubmission } from '../utils/notify'

export const FormSubmissions: CollectionConfig = {
  slug: 'form-submissions',
  admin: {
    defaultColumns: ['form', 'ip', 'createdAt'],
    description: 'Заявки: read-only (создаёт web)',
  },
  access: {
    read: ({ req: { user }, data }) => canScope(user, data?.site ?? 1) || !!user,
    create: () => true,
    update: () => false,
    delete: () => false,
  },
  hooks: {
    afterChange: [
      ({ doc, req, operation }) => {
        if (operation !== 'create') return
        notifySubmission(req.payload, doc).catch((err) => console.error('[notify] failed', err))
      },
    ],
  },
  fields: [
    { name: 'site', type: 'relationship', relationTo: 'sites', required: true },
    { name: 'form', type: 'relationship', relationTo: 'forms', required: true },
    { name: 'values', type: 'array', fields: [
      { name: 'name', type: 'text' },
      { name: 'value', type: 'text' },
    ] },
    { name: 'ip', type: 'text' },
  ],
}
