import type { CollectionConfig, Endpoint } from 'payload'

// payload@3.90 не экспортирует общий тип Hook (hook-типы per-operation,
// например CollectionAfterChangeHook) — либеральный alias, чтобы контракт
// merge оставался присваиваемым для хук-мап Task 7.
type Hook = (args: never) => unknown

type SirilProject = {
  collections?: CollectionConfig[]
  endpoints?: Endpoint[]
  hooks?: Record<string, Hook | Hook[]>
}

export function sirilAdminConfig(_project: SirilProject = {}): {
  collections: CollectionConfig[]
  endpoints: Endpoint[]
  hooks: Record<string, Hook | Hook[]>
} {
  // Core-списки — добавляются Task 7 (import из ./*.ts)
  const coreCollections: CollectionConfig[] = []
  const coreEndpoints: Endpoint[] = []
  const coreHooks: Record<string, Hook | Hook[]> = {}

  const { collections = [], endpoints = [], hooks = {} } = _project
  return {
    collections: [...coreCollections, ...collections],
    endpoints: [...coreEndpoints, ...endpoints],
    hooks: { ...coreHooks, ...hooks },
  }
}
