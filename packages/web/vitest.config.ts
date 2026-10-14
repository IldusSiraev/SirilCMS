import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    alias: { '#imports': fileURLToPath(new URL('./test/imports-stub.ts', import.meta.url)) },
  },
})
