import config from '@payload-config'
import { getPayload } from 'payload'
import DesignClient, { type DesignInitial } from './design-client'

// Server component: первичное состояние — локальным API Payload (без self-HTTP,
// без хардкода порта). SSR рендерит радиокнопки + свотчи, клиент синхронизируется
// fetch-ом. Запрос sites — read public, overrideAccess не нужен.
export default async function DesignPage() {
  let initial: DesignInitial
  try {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({ collection: 'sites', limit: 1 })
    const doc = docs[0]
    initial = doc
      ? { kind: 'site', id: doc.id as number, theme: doc.theme as string }
      : { kind: 'empty' }
  } catch (e) {
    initial = { kind: 'error', message: (e as Error).message }
  }
  return <DesignClient initial={initial} />
}
