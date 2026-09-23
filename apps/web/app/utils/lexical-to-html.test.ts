import { it, expect } from 'vitest'
import { lexicalToHtml } from './lexical-to-html'

it('escaped text', () => {
  expect(lexicalToHtml({ children: [{ type: 'text', text: 'Hello <World> & Co' }] })).toBe('Hello &lt;World&gt; &amp; Co')
})
it('nested paragraph', () => {
  expect(lexicalToHtml([{ type: 'paragraph', children: [{ type: 'text', text: 'a' }] }])).toBe('a')
})
it('null-safe', () => {
  expect(lexicalToHtml(null)).toBe('')
})
it('multi-paragraph join', () => {
  expect(lexicalToHtml([
    { type: 'paragraph', children: [{ type: 'text', text: 'a' }] },
    { type: 'paragraph', children: [{ type: 'text', text: 'b' }] },
  ])).toBe('a\nb')
})
