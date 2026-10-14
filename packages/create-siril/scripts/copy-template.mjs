// prepack: кладёт templates/project рядом с пакетом (в tarball шаблон лежит в template/).
import { cpSync, existsSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const here = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const src = resolve(here, '../../templates/project')
const dest = resolve(here, 'template')
if (!existsSync(src)) throw new Error(`нет шаблона: ${src}`)
rmSync(dest, { recursive: true, force: true })
cpSync(src, dest, { recursive: true, filter: (p) => !/[\\/](node_modules|\.nuxt|\.output|\.next)([\\/]|$)/.test(p) })
console.log(`copy-template: ${src} -> ${dest}`)
