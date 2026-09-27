import type { CollectionConfig, Field } from 'payload'
import { toPayloadFormFields } from '@siril/blocks-definitions'

export const Forms: CollectionConfig = {
  slug: 'forms',
  labels: {
    singular: { ru: 'Форма', en: 'Form' },
    plural: { ru: 'Формы', en: 'Forms' },
  },
  indexes: [{ unique: true, fields: ['site', 'slug'] }],
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
    { name: 'site', type: 'relationship', relationTo: 'sites', label: { ru: 'Сайт', en: 'Site' }, required: true },
    {
      name: 'name',
      type: 'text',
      label: { ru: 'Название', en: 'Name' },
      required: true,
      // cell получает rowData (весь doc) → id для ссылки на конструктор
      admin: { components: { Cell: './src/admin-ui/form-builder-link' } },
    },
    // Уникальность — составной индекс (site, slug) на уровне коллекции (см. `indexes` выше).
    { name: 'slug', type: 'text', label: { ru: 'Слаг', en: 'Slug' }, admin: { description: 'POST /api/forms/<slug>/submit (T14)' } },
    { name: 'successMessage', type: 'text', label: { ru: 'Сообщение об успехе', en: 'Success message' }, defaultValue: 'Спасибо! Заявка отправлена.' },
    {
      name: 'notifyEmails',
      type: 'array',
      label: { ru: 'Доп. получатели', en: 'Notify emails' },
      admin: { description: 'Доп. получатели уведомлений о заявках (в дополнение к Sites → Contacts → Email)' },
      fields: [{ name: 'email', type: 'email', label: { ru: 'Email', en: 'Email' }, required: true }],
    },
    { name: 'fields', type: 'array', label: { ru: 'Поля', en: 'Fields' }, fields: toPayloadFormFields() as Field[] },
  ],
}
