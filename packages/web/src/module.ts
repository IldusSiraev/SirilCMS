import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { addTemplate, defineNuxtModule } from '@nuxt/kit'
import type { BlockDef, ThemeDef } from '@siril/contracts'

export type SirilModuleOptions = { blocks?: Record<string, BlockDef>; themes?: ThemeDef[] }

export default defineNuxtModule<SirilModuleOptions>({
  meta: { name: 'siril-web', configKey: 'siril' },
  setup(_options, nuxt) {
    const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))
    // `_layers` is typed `readonly NuxtConfigLayer[]` — reassign (append module layer last so the app layer keeps precedence, per S0.1)
    nuxt.options._layers = [
      ...nuxt.options._layers,
      {
        config: {
          rootDir: runtimeDir,
          srcDir: join(runtimeDir, 'app'),
        },
        cwd: runtimeDir,
        configFile: '',
      },
    ]
    nuxt.options.alias['#siril'] = runtimeDir
    addTemplate({
      filename: 'siril/theme-styles.gen.mjs',
      write: true,
      getContents: () => themeStylesContents(runtimeDir),
    })
  },
})

function themeStylesContents(runtimeDir: string): string {
  const moduleThemes: Record<string, string> = {}
  const themesDir = join(runtimeDir, 'themes')
  if (existsSync(themesDir)) {
    for (const entry of readdirSync(themesDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const css = join(themesDir, entry.name, 'tokens.css')
      if (existsSync(css)) moduleThemes[entry.name] = readFileSync(css, 'utf-8')
    }
  }
  return [
    '// moduleThemes is fs-embedded from the module runtime dir; projectThemes is globbed from the app root (project > module precedence is a T10/T11 runtime concern)',
    `export const moduleThemes = ${JSON.stringify(moduleThemes)}`,
    "export const projectThemes = import.meta.glob('/themes/*/tokens.css', { query: '?raw', import: 'default' })",
    '',
  ].join('\n')
}
