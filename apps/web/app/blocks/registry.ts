import type { Component } from 'vue'
import { defineAsyncComponent } from 'vue'
import Placeholder from './Placeholder.vue'

const pascal = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const modules = import.meta.glob('./**/*.vue') as Record<string, () => Promise<any>>
const blockModules = Object.fromEntries(
  Object.entries(modules).filter(([k]) => !k.endsWith('Placeholder.vue')),
)

export function getBlockComponent(type: string, variant: string): Component {
  const key = `./${type}/${pascal(variant)}.vue`
  const mod = blockModules[key]
  if (!mod) return Placeholder
  return defineAsyncComponent(mod)
}
