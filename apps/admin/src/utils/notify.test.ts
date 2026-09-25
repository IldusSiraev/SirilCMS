import { describe, expect, it } from 'vitest'
import { buildNotificationText } from './notify'

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
