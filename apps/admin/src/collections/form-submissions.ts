import type { CollectionConfig } from 'payload'
import { canScope } from '../access/site-scope'
import { notifySubmission } from '../utils/notify'

export const FormSubmissions: CollectionConfig = {
  slug: 'form-submissions',
  labels: {
    singular: { ru: 'Заявка', en: 'Submission' },
    plural: { ru: 'Заявки', en: 'Submissions' },
  },
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
    { name: 'site', type: 'relationship', relationTo: 'sites', label: { ru: 'Сайт', en: 'Site' }, required: true },
    { name: 'form', type: 'relationship', relationTo: 'forms', label: { ru: 'Форма', en: 'Form' }, required: true },
    { name: 'values', type: 'array', label: { ru: 'Значения', en: 'Values' }, fields: [
      { name: 'name', type: 'text', label: { ru: 'Имя', en: 'Name' } },
      { name: 'value', type: 'text', label: { ru: 'Значение', en: 'Value' } },
    ] },
    { name: 'ip', type: 'text', label: { ru: 'IP', en: 'IP' } },
    {
      name: 'notifications',
      type: 'array',
      label: { ru: 'Уведомления', en: 'Notifications' },
      admin: { readOnly: true, description: 'Статус доставки уведомлений (заполняется автоматически)' },
      fields: [
        { name: 'channel', type: 'select', label: { ru: 'Канал', en: 'Channel' }, options: ['email', 'telegram'], required: true },
        { name: 'recipient', type: 'text', label: { ru: 'Получатель', en: 'Recipient' }, required: true },
        { name: 'status', type: 'select', label: { ru: 'Статус', en: 'Status' }, options: ['sent', 'failed'], required: true },
        { name: 'error', type: 'text', label: { ru: 'Ошибка', en: 'Error' } },
      ],
    },
  ],
}
