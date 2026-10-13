import { registerExtensions } from '@siril/contracts'
import type { SirilExtensions } from '@siril/contracts'
import extensions from '#siril-registry'

// SSR и клиент: у каждого свой экземпляр @siril/contracts в бандле — регистрируем в обоих до рендера.
export default defineNuxtPlugin(() => {
  registerExtensions(extensions as unknown as SirilExtensions)
})
