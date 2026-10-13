import type { CollectionConfig } from 'payload'
import { isOwner } from '../access/site-scope'
import { forceOwnerForFirstUser } from '../utils/first-user'
import { canWriteRoleFields, firstUserSignupAllowed, userUpdateAccess } from '../utils/user-access'

const countUsers = async (req: { payload: { count: (a: { collection: 'users'; overrideAccess: boolean }) => Promise<{ totalDocs: number }> } }) =>
  (await req.payload.count({ collection: 'users', overrideAccess: true })).totalDocs

// Role/site меняет только owner; исключение — самрегистрация первого юзера (hook форсит owner).
const roleFieldAccess = {
  create: async ({ req }: { req: Parameters<typeof countUsers>[0] & { user?: { id?: number | string; role?: 'owner' | 'editor' | null } | null } }) =>
    canWriteRoleFields(req.user, await countUsers(req), process.env),
  update: ({ req }: { req: { user?: { role?: 'owner' | 'editor' | null } | null } }) => isOwner(req.user),
}

export const Users: CollectionConfig = {
  slug: 'users',
  // Brute-force защита логина: 5 неудачных попыток → блок на 10 минут (Payload хранит счётчик в users).
  auth: { maxLoginAttempts: 5, lockTime: 10 * 60 * 1000 },
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
      return firstUserSignupAllowed(await countUsers(req), process.env)
    },
    update: ({ req: { user } }) => userUpdateAccess(user),
    delete: ({ req: { user } }) => isOwner(user),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: { ru: 'Имя', en: 'Name' },
    },
    {
      name: 'role',
      type: 'select',
      label: { ru: 'Роль', en: 'Role' },
      options: [
        { value: 'owner', label: { ru: 'Владелец', en: 'Owner' } },
        { value: 'editor', label: { ru: 'Клиент', en: 'Client' } },
      ],
      defaultValue: 'editor',
      access: roleFieldAccess,
    },
    {
      name: 'site',
      type: 'relationship',
      relationTo: 'sites',
      label: { ru: 'Сайт', en: 'Site' },
      access: roleFieldAccess,
    },
  ],
}
