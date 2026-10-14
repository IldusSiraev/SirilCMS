import { defineBuildConfig } from 'unbuild'

// Компилируем src → dist (ESM .js + .d.ts), включая admin-ui (.tsx) и core-миграции.
// Пакет раньше шёл TS-исходниками, но из node_modules их не загружает ни Payload CLI (Node отказывается
// стрипать типы в node_modules), ни Next без transpilePackages — см. CHANGELOG 0.6.
export default defineBuildConfig({
  clean: true,
  declaration: true,
  entries: [
    {
      builder: 'mkdist',
      input: 'src',
      outDir: 'dist',
      format: 'esm',
      ext: 'js',
      declaration: true,
      pattern: ['**/*.{ts,tsx,json,mjs}', '!**/*.test.ts', '!**/*.test.tsx'],
      esbuild: { jsx: 'automatic' },
    },
  ],
})
