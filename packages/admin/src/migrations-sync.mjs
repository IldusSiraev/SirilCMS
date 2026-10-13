// Копирует core-миграции @siril/admin в каталог миграций проекта (spike S0.1b: copy-sync).
// Идемпотентно: файл с тем же содержимым не трогается; разный — перезаписывается (core — источник правды);
// index.ts не копируется (у проекта свой). Файлы проекта (с другими именами) не удаляются.
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

export function syncCoreMigrations(coreDir, projectDir) {
  mkdirSync(projectDir, { recursive: true })
  const copied = []
  for (const name of readdirSync(coreDir).sort()) {
    if (name.startsWith('index.') || !/\.(ts|json)$/.test(name)) continue
    const src = join(coreDir, name)
    const dest = join(projectDir, name)
    if (existsSync(dest) && readFileSync(dest).equals(readFileSync(src))) continue
    copyFileSync(src, dest)
    copied.push(name)
  }
  return copied
}
