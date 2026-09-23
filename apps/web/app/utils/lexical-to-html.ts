function collect(node: any, out: string[]): void {
  if (node == null) return
  if (Array.isArray(node)) {
    for (const n of node) collect(n, out)
    return
  }
  if (typeof node === 'object') {
    if (typeof node.text === 'string') {
      out.push(node.text)
      return
    }
    if (typeof node.value === 'string') {
      out.push(node.value)
      return
    }
    if (Array.isArray(node.children)) {
      for (const c of node.children) collect(c, out)
    }
    return
  }
  out.push(String(node))
}

function escape(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function lexicalToHtml(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  const out: string[] = []
  collect(value, out)
  return out.map(escape).join('\n')
}
