import { it, expect, vi } from 'vitest'
import { mediaUrl } from './media'

vi.stubGlobal('useRuntimeConfig', () => ({ public: { MEDIA_BASE: 'http://localhost:3001' } }))

it('hydrated media object -> static file URL', () => {
  expect(mediaUrl({ id: 1, filename: '2/probe.png' })).toBe('http://localhost:3001/api/media/file/2%2Fprobe.png')
})
it('null/undefined/number -> null', () => {
  expect(mediaUrl(null)).toBe(null)
  expect(mediaUrl(undefined)).toBe(null)
  expect(mediaUrl(1)).toBe(null)
})
it('object without filename -> null', () => {
  expect(mediaUrl({ id: 1 })).toBe(null)
})
