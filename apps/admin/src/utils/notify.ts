import type { BasePayload } from 'payload'
import type { Form, FormSubmission, Site } from '../../payload-types'

export function buildNotificationText(formName: string, values: { name?: string | null; value?: string | null }[]): string {
  return `Заявка (${formName}): ${values.map((v) => `${v.name}: ${v.value}`).join(' | ')}`
}

export async function notifySubmission(payload: BasePayload, doc: FormSubmission): Promise<void> {
  const siteId = typeof doc.site === 'object' ? doc.site.id : doc.site
  const formId = typeof doc.form === 'object' ? doc.form.id : doc.form
  const [site, form] = await Promise.all([
    payload.findByID({ collection: 'sites', id: siteId, overrideAccess: true }) as Promise<Site>,
    payload.findByID({ collection: 'forms', id: formId, overrideAccess: true }) as Promise<Form>,
  ])
  const text = buildNotificationText(form.name, doc.values ?? [])

  if (site.settings?.smtpHost) {
    const { default: nodemailer } = await import('nodemailer')
    const smtp = nodemailer.createTransport({
      host: site.settings.smtpHost,
      port: Number(site.settings.smtpPort) || 587,
      auth: site.settings.smtpUser ? { user: site.settings.smtpUser, pass: site.settings.smtpPass ?? undefined } : undefined,
    })
    if (site.contacts?.email) {
      await smtp.sendMail({ from: site.settings.smtpUser ?? undefined, to: site.contacts.email, subject: `Заявка: ${form.name}`, text })
    }
  }

  const tgToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = site.contacts?.telegram
  if (tgToken && chatId) {
    await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    }).catch(() => {})
  }
}
