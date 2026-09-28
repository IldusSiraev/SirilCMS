import { beforeEach, describe, expect, it, vi } from 'vitest'
import { decryptField, encryptField } from './field-encryption'

beforeEach(() => {
  vi.stubEnv('PAYLOAD_SECRET', 'test-secret-at-least-32-characters-long')
})

describe('encryptField / decryptField', () => {
  it('round-trips a plaintext value', () => {
    const stored = encryptField('smtp-app-password')
    expect(stored).not.toBe('smtp-app-password')
    expect(decryptField(stored)).toBe('smtp-app-password')
  })

  it('produces a different ciphertext each time (random IV)', () => {
    const a = encryptField('same-password')
    const b = encryptField('same-password')
    expect(a).not.toBe(b)
    expect(decryptField(a)).toBe('same-password')
    expect(decryptField(b)).toBe('same-password')
  })

  it('rejects a tampered ciphertext', () => {
    const stored = encryptField('smtp-app-password')
    const parts = stored.split(':')
    const tampered = [parts[0], parts[1], parts[2], Buffer.from('not the real ciphertext').toString('base64')].join(':')
    expect(() => decryptField(tampered)).toThrow()
  })

  it('passes through legacy plaintext values unchanged (pre-encryption data)', () => {
    expect(decryptField('an-old-plaintext-password')).toBe('an-old-plaintext-password')
  })

  it('cannot be decrypted with the wrong secret', () => {
    const stored = encryptField('smtp-app-password')
    vi.stubEnv('PAYLOAD_SECRET', 'a-completely-different-secret-value')
    expect(() => decryptField(stored)).toThrow()
  })
})
