import { registerExtensions } from '@sirilcms/contracts'
import type { SirilExtensions } from '@sirilcms/contracts'
import extensions from '#siril-registry'

// SSR и клиент: у каждого свой экземпляр @sirilcms/contracts в бандле — регистрируем в обоих до рендера.
export default defineNuxtPlugin(() => {
  registerExtensions(extensions as unknown as SirilExtensions)
})
