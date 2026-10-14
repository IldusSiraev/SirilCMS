// После nuxt-module-build: удаляем декларации внутри dist/runtime.
// Runtime модуля подключается как Nuxt-layer: Nuxt/Nitro сканируют plugins/, composables/, pages/ … по маске *.ts,
// и `00.siril-registry.d.ts` загружается как плагин → «does not provide an export named default» → приложение
// не гидрируется (SSR при этом работает — поэтому SSR-проверка это не ловила). Типы runtime-внутренностей потребителям не нужны.
import { readdirSync, rmSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '../dist/runtime')
let removed = 0
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p)
    else if (/\.d\.(ts|mts|cts|vue\.ts)$/.test(name) || name.endsWith('.vue.d.ts')) { rmSync(p); removed++ }
  }
}
walk(root)
console.log(`clean-runtime-dts: removed ${removed} declaration file(s) from dist/runtime`)
