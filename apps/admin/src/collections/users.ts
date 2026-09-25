import type { CollectionConfig } from 'payload'
import { isOwner } from '../access/site-scope'
import { forceOwnerForFirstUser } from '../utils/first-user'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    group: 'Authentication',
    hidden: true,
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation !== 'create') return data
        const { totalDocs } = await req.payload.count({ collection: 'users', overrideAccess: true })
        return forceOwnerForFirstUser(data, totalDocs)
      },
    ],
  },
  access: {
    read: ({ req: { user }, id }) => {
      if (!user) return false
      if (isOwner(user)) return true
      return id != null && user.id === id
    },
    create: async ({ req }) => {
      if (req.user && isOwner(req.user)) return true
      const { totalDocs } = await req.payload.count({
        collection: 'users',
      })
      return totalDocs === 0
    },
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => isOwner(user),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'role',
      type: 'select',
      options: [
        { value: 'owner', label: 'Владелец' },
        { value: 'editor', label: 'Клиент' },
      ],
      defaultValue: 'editor',
    },
    {
      name: 'site',
      type: 'relationship',
      relationTo: 'sites',
    },
  ],
}
