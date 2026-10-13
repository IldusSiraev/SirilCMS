import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { mergeOptions } from './module-options'
import { blockRegistryContents } from './module'

describe('module options', () => {
  it('пустые опции — core', () => {
    const r = mergeOptions({})
    expect(r.blocks).toBeDefined()
    expect(r.blocks.length).toBeGreaterThan(0)
  })
})

describe('block registry template', () => {
  const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))

  it('fs-embed модульных блоков как absolute imports (forward slashes)', () => {
    const src = blockRegistryContents(runtimeDir)
    expect(src).toContain('hero/Default')
    expect(src).toContain('() => import(')
    // путь в import() — absolute, forward slashes (никаких backslashes)
    for (const line of src.split('\n').filter((l) => l.includes('() => import('))) {
      expect(line).not.toContain('\\')
    }
    // Placeholder — явный import, не glob
    expect(src).toMatch(/import Placeholder from '[^']+(\/|\\)Placeholder\.vue'/)
  })

  it('project-glob root-relative + merge с приоритетом проекта + контракт getBlockComponent', () => {
    const src = blockRegistryContents(runtimeDir)
    expect(src).toContain("import.meta.glob('/app/blocks/**/*.vue')")
    // rekey к форме <type>/<Variant>.vue + spread-порядок: проект РАСШИРЯЕТ module (project wins)
    expect(src).toContain('const rekeyProject = (k) => k.replace(')
    expect(src).toContain("app\\/blocks\\/")
    expect(src.indexOf('...moduleBlocks,')).toBeLessThan(
      src.indexOf('Object.fromEntries(Object.entries(projectBlocks)'),
    )
    expect(src).toContain('export function getBlockComponent(type, variant)')
  })

  it('project filter: Placeholder.vue и ключи без "/" (не <type>/...) вырезаются из registry (T10 review)', () => {
    const src = blockRegistryContents(runtimeDir)
    // rekey-результат эквивалентен Placeholder.vue (fallback, не block type) или без "/" — entry пропускается
    expect(src).toContain("k !== 'Placeholder.vue'")
    expect(src).toContain("k.includes('/')")
    expect(src).toContain('isBlockKey(rekeyProject(path))')
  })
})

describe('registry template', () => {
  it('сериализует блоки и темы проекта в типизированный default export', async () => {
    const { registryContents } = await import('./module')
    const src = registryContents({ blocks: [{ type: 'cases', name: 'Cases', variants: [] }], themes: [{ id: 'c', name: 'C', tokens: {}, blocks: {} }] })
    expect(src).toContain('export default {"blocks":[{"type":"cases"')
    expect(src).toContain('"themes":[{"id":"c"')
  })
  it('пустые опции — пустые массивы', async () => {
    const { registryContents } = await import('./module')
    expect(registryContents({})).toContain('export default {"blocks":[],"themes":[]}')
  })
})
