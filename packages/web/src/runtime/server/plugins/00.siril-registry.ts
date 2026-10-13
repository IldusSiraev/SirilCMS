import { registerExtensions } from '@siril/contracts'
import extensions from '#siril-registry'

// Nitro (API-роуты, submit): реестр блоков/тем проекта нужен и вне Vue-рендера.
export default defineNitroPlugin(() => {
  registerExtensions(extensions)
})
