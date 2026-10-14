import { registerExtensions } from '@sirilcms/contracts'
import type { SirilExtensions } from '@sirilcms/contracts'
import extensions from '#siril-registry'

// Nitro (API-роуты, submit): реестр блоков/тем проекта нужен и вне Vue-рендера.
export default defineNitroPlugin(() => {
  registerExtensions(extensions as unknown as SirilExtensions)
})
