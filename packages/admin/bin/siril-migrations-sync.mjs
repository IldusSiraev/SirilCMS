#!/usr/bin/env node
// Использование (из корня admin-приложения проекта): siril-migrations-sync [projectMigrationsDir]
// По умолчанию — ./src/migrations.
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { syncCoreMigrations } from '../dist/migrations-sync.js'

const coreDir = fileURLToPath(new URL('../dist/migrations', import.meta.url))
const projectDir = resolve(process.argv[2] ?? 'src/migrations')
const copied = syncCoreMigrations(coreDir, projectDir)
console.log(copied.length ? `siril-migrations-sync: copied ${copied.length} file(s) into ${projectDir}` : 'siril-migrations-sync: up to date')
