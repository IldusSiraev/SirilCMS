import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { mergeOptions } from './module-options'
import { blockRegistryContents, projectBlocksMap, projectThemesMap, themeStylesContents } from './module'

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

  it('проектные блоки (fs-scan) + merge с приоритетом проекта + контракт getBlockComponent', () => {
    const src = blockRegistryContents(runtimeDir)
    expect(src).toContain('const projectBlocks = {}')
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

describe('project fs-scan (блоки и темы проекта)', () => {
  const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))
  const root = mkdtempSync(join(tmpdir(), 'siril-proj-'))
  const srcDir = join(root, 'app')
  mkdirSync(join(srcDir, 'blocks', 'cases'), { recursive: true })
  writeFileSync(join(srcDir, 'blocks', 'cases', 'Card.vue'), '<template><div/></template>')
  writeFileSync(join(srcDir, 'blocks', 'Placeholder.vue'), '<template><div/></template>')
  mkdirSync(join(root, 'themes', 'client'), { recursive: true })
  writeFileSync(join(root, 'themes', 'client', 'tokens.css'), ':root{}')
  mkdirSync(join(root, 'themes', 'empty'), { recursive: true })
  afterAll(() => rmSync(root, { recursive: true, force: true }))

  it('блоки: ключ app/blocks/<type>/<Variant>.vue → absolute import; файлы в корне blocks игнорируются', () => {
    const map = projectBlocksMap(srcDir)
    expect(map).toContain('"app/blocks/cases/Card.vue": () => import(')
    expect(map).not.toContain('Placeholder')
    expect(map).not.toContain('\\')
  })
  it('блоки: нет каталога — пустой объект', () => {
    expect(projectBlocksMap(join(root, 'nope'))).toBe('{}')
    expect(projectBlocksMap(undefined)).toBe('{}')
  })
  it('темы: /themes/<id>/tokens.css → ?raw-загрузчик; каталог без tokens.css пропущен', () => {
    const map = projectThemesMap(root)
    expect(map).toContain('"/themes/client/tokens.css": () => import(')
    expect(map).toContain('tokens.css?raw')
    expect(map).not.toContain('/themes/empty')
  })
  it('собранный registry содержит проектные блоки', () => {
    const src = blockRegistryContents(runtimeDir, srcDir)
    expect(src).toContain('"app/blocks/cases/Card.vue"')
    expect(themeStylesContents(runtimeDir, root)).toContain('"/themes/client/tokens.css"')
  })
})
