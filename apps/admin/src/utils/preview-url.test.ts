import { describe, expect, it } from 'vitest'
import { buildPreviewURL } from './preview-url'

describe('buildPreviewURL', () => {
  it('builds a page preview URL with the token', () => {
    expect(buildPreviewURL('http://localhost:3000', 'page', 'about', 'abc.def')).toBe(
      'http://localhost:3000/preview/page/about?token=abc.def',
    )
  })

  it('builds a post preview URL', () => {
    expect(buildPreviewURL('http://localhost:3000', 'post', 'hello-world', 'tok')).toBe(
      'http://localhost:3000/preview/post/hello-world?token=tok',
    )
  })

  it('returns null without a slug', () => {
    expect(buildPreviewURL('http://localhost:3000', 'page', undefined, 'tok')).toBeNull()
  })

  it('returns null without a token', () => {
    expect(buildPreviewURL('http://localhost:3000', 'page', 'about', null)).toBeNull()
  })

  it('encodes special characters in slug and token', () => {
    expect(buildPreviewURL('http://localhost:3000', 'page', 'a b', 'tok en')).toBe(
      'http://localhost:3000/preview/page/a%20b?token=tok%20en',
    )
  })
})
