import type { BasePayload } from 'payload'
import type { Form, FormSubmission, Site } from '../../payload-types'

export function buildNotificationText(formName: string, values: { name?: string | null; value?: string | null }[]): string {
  return `Заявка (${formName}): ${values.map((v) => `${v.name}: ${v.value}`).join(' | ')}`
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function buildNotificationEmailHtml(formName: string, values: { name?: string | null; value?: string | null }[]): string {
  const rows = values
    .map(
      (v) =>
        `<tr><td style="padding:4px 8px;font-weight:600">${escapeHtml(String(v.name ?? ''))}</td>` +
        `<td style="padding:4px 8px">${escapeHtml(String(v.value ?? ''))}</td></tr>`,
    )
    .join('')
  return `<h2>Заявка: ${escapeHtml(formName)}</h2><table style="border-collapse:collapse">${rows}</table>`
}

/** Объединяет доп. получателей формы и дефолтный email сайта, убирает пустые/дубликаты (регистронезависимо). */
export function resolveNotifyRecipients(
  siteEmail: string | null | undefined,
  formEmails: (string | null | undefined)[] | null | undefined,
): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const raw of [...(formEmails ?? []), siteEmail]) {
    const email = raw?.trim()
    if (!email) continue
    const key = email.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(email)
  }
  return result
}

export type NotificationResult = {
  channel: 'email' | 'telegram'
  recipient: string
  status: 'sent' | 'failed'
  error?: string
}

export async function notifySubmission(payload: BasePayload, doc: FormSubmission): Promise<void> {
  const siteId = typeof doc.site === 'object' ? doc.site.id : doc.site
  const formId = typeof doc.form === 'object' ? doc.form.id : doc.form
  const [site, form] = await Promise.all([
    payload.findByID({ collection: 'sites', id: siteId, overrideAccess: true }) as Promise<Site>,
    payload.findByID({ collection: 'forms', id: formId, overrideAccess: true }) as Promise<Form>,
  ])
  const text = buildNotificationText(form.name, doc.values ?? [])
  const html = buildNotificationEmailHtml(form.name, doc.values ?? [])
  const results: NotificationResult[] = []

  const recipients = resolveNotifyRecipients(site.contacts?.email, (form.notifyEmails ?? []).map((r) => r.email))

  if (site.settings?.smtpHost && recipients.length > 0) {
    const { default: nodemailer } = await import('nodemailer')
    const smtp = nodemailer.createTransport({
      host: site.settings.smtpHost,
      port: Number(site.settings.smtpPort) || 587,
      auth: site.settings.smtpUser ? { user: site.settings.smtpUser, pass: site.settings.smtpPass ?? undefined } : undefined,
    })
    for (const recipient of recipients) {
      try {
        await smtp.sendMail({ from: site.settings.smtpUser ?? undefined, to: recipient, subject: `Заявка: ${form.name}`, text, html })
        results.push({ channel: 'email', recipient, status: 'sent' })
      } catch (err) {
        results.push({ channel: 'email', recipient, status: 'failed', error: err instanceof Error ? err.message : String(err) })
      }
    }
  }

  const tgToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = site.contacts?.telegram
  if (tgToken && chatId) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text }),
      })
      if (!res.ok) throw new Error(`telegram ${res.status}`)
      results.push({ channel: 'telegram', recipient: chatId, status: 'sent' })
    } catch (err) {
      results.push({ channel: 'telegram', recipient: chatId, status: 'failed', error: err instanceof Error ? err.message : String(err) })
    }
  }

  if (results.length > 0) {
    await payload.update({ collection: 'form-submissions', id: doc.id, data: { notifications: results }, overrideAccess: true })
  }
}
