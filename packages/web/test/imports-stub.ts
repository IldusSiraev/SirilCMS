// Юнит-тесты (vitest) не имеют Nitro/Nuxt `#imports`: заглушка пробрасывает на globalThis (vi.stubGlobal в тестах).
const g = globalThis as Record<string, unknown>
const pass = (name: string) => (...args: unknown[]) => (g[name] as (...a: unknown[]) => unknown)(...args)
export const useRuntimeConfig = pass('useRuntimeConfig')
export const defineEventHandler = pass('defineEventHandler')
export const createError = pass('createError')
export const getHeader = pass('getHeader')
export const getRequestHost = pass('getRequestHost')
export const getQuery = pass('getQuery')
export const readBody = pass('readBody')
export const setHeader = pass('setHeader')
export const defineNitroPlugin = pass('defineNitroPlugin')
