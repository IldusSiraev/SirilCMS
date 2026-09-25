import { readBody } from 'h3'
import { validateSubmission } from '@siril/blocks-definitions'
import { payloadGet } from '../../../utils/payload'
import { rateLimit } from '../../../utils/rate-limit'

export default defineEventHandler(async (event) => {
  const slug = String(event.context.params?.slug ?? '')
  const forwarded = event.headers.get('x-forwarded-for')
  const ip = (forwarded ? forwarded.split(',')[0]?.trim() : '') || (event.node.req.socket.remoteAddress ?? 'unknown')
  if (!rateLimit(`form:${slug}:${ip}`)) throw createError({ statusCode: 429, message: 'Too many requests' })
  const body: Record<string, unknown> = await readBody(event)
  const { docs } = await payloadGet<{ docs: any[] }>(`forms?where[slug][equals]=${encodeURIComponent(slug!)}&depth=2`)
  const form = docs[0]
  if (!form) throw createError({ statusCode: 404, message: 'Form not found' })
  const honeypot = form.fields.find((f: any) => f.type === 'honeypot')
  if (honeypot && body[honeypot.name]) return { ok: true }
  const values = form.fields
    .filter((f: any) => ['text', 'email', 'tel', 'textarea', 'select', 'checkbox', 'checkbox-group', 'date', 'consent'].includes(f.type))
    .map((f: any) => ({ name: f.name, value: body[f.name] }))
  const fields = form.fields
    .filter((f: any) => f.type !== 'file')
    .map((f: any) => ({ id: f.id ?? f.name, name: f.name, label: f.label, required: !!f.required, options: f.options ? String(f.options).split('\n') : undefined }))
  const v = validateSubmission(fields, Object.fromEntries(values.map((p: any) => [p.name, p.value])), {})
  if (!v.ok) return { ok: false, errors: v.errors }
  const siteId = typeof form.site === 'object' ? form.site.id : form.site
  try {
    await $fetch(`${useRuntimeConfig().PAYLOAD_URL}/api/form-submissions`, {
      method: 'POST',
      body: { site: siteId, form: form.id, values, ip },
    })
  } catch {
    throw createError({ statusCode: 422, message: 'Не удалось сохранить заявку' })
  }
  return { ok: true }
})
