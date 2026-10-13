import { blocks, themes } from '../siril.extensions'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: ['@siril/web'],
  siril: { blocks, themes },
  runtimeConfig: {
    PAYLOAD_URL: process.env.PAYLOAD_URL ?? 'http://localhost:3001',
    PURGE_TOKEN: process.env.PURGE_TOKEN ?? 'dev-purge-token',
    public: {
      SITE_DOMAIN: process.env.NUXT_PUBLIC_SITE_DOMAIN ?? 'localhost:3000',
      MEDIA_BASE: process.env.NUXT_PUBLIC_MEDIA_BASE ?? 'http://localhost:3001',
    },
  },
  build: { transpile: ['@siril/web', '@siril/contracts'] },
  vite: { server: { allowedHosts: true } },
})
