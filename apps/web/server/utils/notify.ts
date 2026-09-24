import nodemailer from 'nodemailer'
import { payloadGet } from './payload'

export async function notifyNewSubmission(p: { formName: string; values: Record<string, unknown> }) {
  const { docs } = await payloadGet<{ docs: any[] }>('sites?limit=1')
  const site = docs[0]
  const text = `Заявка (${p.formName}): ${Object.entries(p.values).map(([k, v]) => `${k}: ${v}`).join(' | ')}`
  console.log('[notify]', text)
  if (site?.settings?.smtpHost) {
    const smtp = nodemailer.createTransport({
      host: site.settings.smtpHost,
      port: Number(site.settings.smtpPort) || 587,
      auth: site.settings.smtpUser ? { user: site.settings.smtpUser, pass: site.settings.smtpPass } : undefined,
    })
    if (site.contacts?.email) await smtp.sendMail({ from: site.settings.smtpUser, to: site.contacts.email, subject: `Заявка: ${p.formName}`, text })
  }
  const tgToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = site?.contacts?.telegram
  if (tgToken && chatId) await $fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, { method: 'POST', body: { chat_id: chatId, text } }).catch(() => {})
}
