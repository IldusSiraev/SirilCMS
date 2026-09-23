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
it('string input is escaped (array-text items)', () => {
  expect(lexicalToHtml('<img src=x onerror=alert(1)>')).toBe('&lt;img src=x onerror=alert(1)&gt;')
})
it('string input with entities', () => {
  expect(lexicalToHtml('a < b & c > d')).toBe('a &lt; b &amp; c &gt; d')
})
it('multi-paragraph join', () => {
  expect(lexicalToHtml([
    { type: 'paragraph', children: [{ type: 'text', text: 'a' }] },
    { type: 'paragraph', children: [{ type: 'text', text: 'b' }] },
  ])).toBe('a\nb')
})
