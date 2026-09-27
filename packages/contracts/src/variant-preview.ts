import type { VariantLayout } from './types'

const BG = '#f3f4f6'
const ACCENT = '#94a3b8'
const DARK = '#475569'

function wrap(inner: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 72">${inner}</svg>`
}

function bgRect(fill = BG): string {
  return `<rect width="120" height="72" fill="${fill}"/>`
}

function imageRect(x: number, y: number, w: number, h: number): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${ACCENT}"/>`
}

function textLines(x: number, y: number, w: number, color = DARK): string {
  return (
    `<rect x="${x}" y="${y}" width="${w}" height="8" fill="${color}"/>` +
    `<rect x="${x}" y="${y + 14}" width="${w}" height="4" fill="${color}" opacity="0.6"/>` +
    `<rect x="${x}" y="${y + 22}" width="${w * 0.7}" height="4" fill="${color}" opacity="0.6"/>`
  )
}

function centerContent(color = DARK): string {
  return (
    `<rect x="35" y="18" width="50" height="8" fill="${color}"/>` +
    `<rect x="25" y="32" width="70" height="4" fill="${color}" opacity="0.6"/>` +
    `<rect x="35" y="40" width="50" height="4" fill="${color}" opacity="0.6"/>` +
    `<rect x="45" y="52" width="30" height="8" rx="4" fill="${color}"/>`
  )
}

function gridSquares(): string {
  return [
    [8, 8],
    [64, 8],
    [8, 40],
    [64, 40],
  ]
    .map(([x, y]) => `<rect x="${x}" y="${y}" width="48" height="24" rx="2" fill="${ACCENT}"/>`)
    .join('')
}

function listRows(): string {
  return [10, 26, 42, 58]
    .map((y) => `<rect x="8" y="${y}" width="104" height="10" rx="2" fill="${ACCENT}"/>`)
    .join('')
}

/** Абстрактная wireframe-картинка варианта блока для визуального пикера в админке (превью, не рендер реального блока). */
export function variantPreviewSvg(layout: VariantLayout): string {
  switch (layout) {
    case 'center':
      return wrap(bgRect() + centerContent())
    case 'split-left':
      return wrap(bgRect() + imageRect(6, 10, 48, 52) + textLines(62, 18, 50))
    case 'split-right':
      return wrap(bgRect() + textLines(8, 18, 50) + imageRect(66, 10, 48, 52))
    case 'banner':
      return wrap(bgRect(ACCENT) + centerContent('#ffffff'))
    case 'grid':
      return wrap(bgRect() + gridSquares())
    case 'list':
      return wrap(bgRect() + listRows())
  }
}
