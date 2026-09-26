import { describe, expect, it } from 'vitest'
import { buildNotificationEmailHtml, buildNotificationText, resolveNotifyRecipients } from './notify'

describe('buildNotificationText', () => {
  it('joins form name and values into one line', () => {
    const text = buildNotificationText('Обратная связь', [
      { name: 'name', value: 'Иван' },
      { name: 'email', value: 'ivan@example.com' },
    ])
    expect(text).toBe('Заявка (Обратная связь): name: Иван | email: ivan@example.com')
  })

  it('handles no values', () => {
    expect(buildNotificationText('Форма', [])).toBe('Заявка (Форма): ')
  })
})

describe('buildNotificationEmailHtml', () => {
  it('renders form name and values as a table', () => {
    const html = buildNotificationEmailHtml('Обратная связь', [
      { name: 'name', value: 'Иван' },
      { name: 'email', value: 'ivan@example.com' },
    ])
    expect(html).toContain('Обратная связь')
    expect(html).toContain('<td style="padding:4px 8px;font-weight:600">name</td>')
    expect(html).toContain('<td style="padding:4px 8px">Иван</td>')
  })

  it('escapes HTML in field values', () => {
    const html = buildNotificationEmailHtml('Форма', [{ name: 'comment', value: '<script>alert(1)</script>' }])
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).toContain('&lt;script&gt;')
  })
})

describe('resolveNotifyRecipients', () => {
  it('combines form and site emails', () => {
    expect(resolveNotifyRecipients('site@example.com', ['form@example.com'])).toEqual([
      'form@example.com',
      'site@example.com',
    ])
  })

  it('dedupes case-insensitively', () => {
    expect(resolveNotifyRecipients('Same@Example.com', ['same@example.com'])).toEqual(['same@example.com'])
  })

  it('drops blank entries', () => {
    expect(resolveNotifyRecipients('  ', ['', undefined, null, 'a@example.com'])).toEqual(['a@example.com'])
  })

  it('returns empty array when nothing configured', () => {
    expect(resolveNotifyRecipients(undefined, undefined)).toEqual([])
  })
})
