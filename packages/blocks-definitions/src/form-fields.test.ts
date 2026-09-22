import { describe, expect, it } from 'vitest'
import { FORM_FIELD_TYPES, validateSubmission } from './form-fields'
import type { FormFieldDef } from './types'

const email: FormFieldDef = { id: '1', name: 'email', type: 'email', label: 'Email', required: true }

it('нет обязательного поля → ошибка', () => {
  const r = validateSubmission([email], { email: '' }, {})
  expect(r.ok).toBe(false)
  if (!r.ok) expect(r.errors).toEqual(['Email — обязательно'])
})
it('неверный email → ошибка', () => {
  const r = validateSubmission([email], { email: 'not-an-email' }, {})
  expect(r.ok).toBe(false)
  if (!r.ok) expect(r.errors).toEqual(['Email — неверный email'])
})
it('honeypot пропускается даже если пустой и обязательный', () => {
  const hp: FormFieldDef = { id: '2', name: 'website', type: 'honeypot', label: 'Website', required: true }
  expect(validateSubmission([hp], { website: '' }, {})).toEqual({ ok: true })
})
it('consent обязателен и только truthy проходит', () => {
  const c: FormFieldDef = { id: '3', name: 'agree', type: 'consent', label: 'Согласие', required: true }
  expect(validateSubmission([c], { agree: false }, {}).ok).toBe(false)
  expect(validateSubmission([c], { agree: 'on' }, {})).toEqual({ ok: true })
  expect(validateSubmission([c], { agree: true }, {})).toEqual({ ok: true })
})
it('телефон короче 6 цифр → ошибка', () => {
  const tel: FormFieldDef = { id: '4', name: 'phone', type: 'tel', label: 'Телефон', required: true }
  expect(validateSubmission([tel], { phone: '123' }, {}).ok).toBe(false)
  expect(validateSubmission([tel], { phone: '+7 900 123-45-67' }, {})).toEqual({ ok: true })
})
it('FORM_FIELD_TYPES — 11 типов', () => {
  expect(FORM_FIELD_TYPES).toHaveLength(11)
})
