import type { CollectionConfig, Field } from 'payload'
import { toPayloadFormFields } from '@siril/blocks-definitions'

export const Forms: CollectionConfig = {
  slug: 'forms',
  admin: {
    defaultColumns: ['name', 'slug'],
    description: 'Определение формы. Конструктор: /form-builder?form=<id>',
  },
  access: {
    read: () => true, // T13 ruling: определение формы публичное (web SSR анонимный); заявки — T14, scoped
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  fields: [
    { name: 'site', type: 'relationship', relationTo: 'sites', required: true },
    {
      name: 'name',
      type: 'text',
      required: true,
      // cell получает rowData (весь doc) → id для ссылки на конструктор
      admin: { components: { Cell: './src/admin-ui/form-builder-link' } },
    },
    { name: 'slug', type: 'text', unique: true, admin: { description: 'POST /api/forms/<slug>/submit (T14)' } },
    { name: 'successMessage', type: 'text', defaultValue: 'Спасибо! Заявка отправлена.' },
    {
      name: 'notifyEmails',
      type: 'array',
      admin: { description: 'Доп. получатели уведомлений о заявках (в дополнение к Sites → Contacts → Email)' },
      fields: [{ name: 'email', type: 'email', required: true }],
    },
    { name: 'fields', type: 'array', fields: toPayloadFormFields() as Field[] },
  ],
}
