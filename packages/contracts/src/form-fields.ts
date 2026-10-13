import type { FormFieldDef, FormFieldType } from './types'

export const FORM_FIELD_TYPES: FormFieldType[] = ['text', 'email', 'tel', 'textarea', 'select', 'checkbox', 'checkbox-group', 'date', 'file', 'consent', 'honeypot']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateSubmission(fields: FormFieldDef[], values: Record<string, unknown>, files: Record<string, boolean>): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = []
  for (const f of fields) {
    if (f.type === 'honeypot') continue
    const v = values[f.name]
    const empty = v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)
    if (f.required && empty) { errors.push(`${f.label} — обязательно`); continue }
    if (empty) continue
    if (f.type === 'email' && !EMAIL_RE.test(String(v))) errors.push(`${f.label} — неверный email`)
    if (f.type === 'tel' && String(v).replace(/[^\d]/g, '').length < 6) errors.push(`${f.label} — неверный телефон`)
    if (f.type === 'date' && isNaN(Date.parse(String(v))) && String(v).length === 0) errors.push(`${f.label} — неверная дата`)
    if (f.type === 'file' && !files[f.name]) errors.push(`${f.label} — файл не найден`)
    if (f.type === 'consent' && v !== true && v !== 'on' && String(v) !== 'true') errors.push(`${f.label} — подтвердите`)
  }
  return errors.length ? { ok: false, errors } : { ok: true }
}
