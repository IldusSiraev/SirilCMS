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

it('size preset -> resized file URL', () => {
  const m = { filename: '2/a.png', sizes: { sm: { filename: 'a-480x270.webp' }, md: { filename: null } } }
  expect(mediaUrl(m, 'sm')).toBe('http://localhost:3001/api/media/file/a-480x270.webp')
})
it('missing/empty size falls back to original', () => {
  const m = { filename: '2/a.png', sizes: { sm: { filename: 'a-480x270.webp' }, md: { filename: null } } }
  expect(mediaUrl(m, 'md')).toBe('http://localhost:3001/api/media/file/2%2Fa.png')
  expect(mediaUrl(m, 'lg')).toBe('http://localhost:3001/api/media/file/2%2Fa.png')
  expect(mediaUrl({ filename: '2/a.png' }, 'sm')).toBe('http://localhost:3001/api/media/file/2%2Fa.png')
})
