import type { Payload } from 'payload'

type Env = Record<string, string | undefined>

/**
 * Создаёт первого owner из env, если в БД ещё нет пользователей. Вызывать из payload `onInit`.
 * Вместе с DISABLE_FIRST_USER_SIGNUP=true закрывает окно анонимной самрегистрации в проде.
 * Идемпотентно: при любом существующем юзере ничего не делает.
 */
export async function bootstrapOwner(payload: Pick<Payload, 'count' | 'create' | 'logger'>, env: Env = process.env): Promise<boolean> {
  const email = env.INITIAL_OWNER_EMAIL?.trim()
  const password = env.INITIAL_OWNER_PASSWORD
  if (!email || !password) return false
  const { totalDocs } = await payload.count({ collection: 'users', overrideAccess: true })
  if (totalDocs > 0) return false
  await payload.create({
    collection: 'users',
    overrideAccess: true,
    data: { email, password, role: 'owner', name: 'Owner' },
  })
  payload.logger.info(`bootstrap: owner ${email} created from INITIAL_OWNER_* env`)
  return true
}
