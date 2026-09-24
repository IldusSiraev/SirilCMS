import type { Endpoint } from 'payload'
import type { Form, FormSubmission } from '../../payload-types'

// Экспорт заявок в CSV: BOM + UTF-8, CRLF, экранирование ", колонки = label'ы полей формы.
// Контракт Payload 3.90 (проверено в dist): Web Request/Response, req.payload — local API, req.user — через auth стратегии.
export const submissionsCsv: Endpoint = {
  path: '/submissions-csv',
  method: 'get',
  handler: async (req) => {
    if (!req.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      })
    }
    const { payload } = req
    const formId = Number(req.searchParams.get('form') ?? 0)

    const { docs } = await payload.find({
      collection: 'form-submissions',
      ...(formId ? { where: { form: { equals: formId } } } : {}),
      limit: -1,
      depth: 1,
    })
    const submissions = (docs ?? []) as unknown as FormSubmission[]

    const form: Form | null = formId
      ? ((await payload.findByID({ collection: 'forms', id: formId })) as unknown as Form)
      : null
    const fields = form?.fields ?? []

    const headers = ['Дата', ...fields.map((f) => f.label ?? f.name), 'IP']
    const rows = submissions.map((d) =>
      [
        new Date(d.createdAt).toISOString(),
        ...fields.map((f) => (d.values ?? []).find((v) => v.name === f.name)?.value ?? ''),
        d.ip,
      ]
        .map(csvEscape)
        .join(','),
    )
    const csv = '\uFEFF' + [headers.map(csvEscape).join(','), ...rows].join('\r\n')

    return new Response(csv, {
      status: 200,
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="submissions-${formId || 'all'}.csv"`,
      },
    })
  },
}

const csvEscape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`
