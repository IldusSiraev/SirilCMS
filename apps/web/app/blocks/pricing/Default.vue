<template>
  <section class="pricing-block" :style="tokens">
    <h2 class="pricing-title">{{ block.title }}</h2>
    <div class="pricing-grid">
      <div v-for="(p, idx) in plans" :key="idx" class="pricing-card" :class="{ 'pricing-card-featured': p.featured }">
        <div class="pricing-plan-title">{{ p.title }}</div>
        <div class="pricing-price">{{ p.price }}</div>
        <div class="pricing-desc"><RichText :value="p.description" /></div>
        <NuxtLink v-if="p.buttonText && p.buttonLink" class="pricing-btn" :to="p.buttonLink" :target="isExternal(p.buttonLink) ? '_blank' : undefined">{{ p.buttonText }}</NuxtLink>
      </div>
    </div>
  </section>
</template>
<script setup lang="ts">
import { getTheme } from '@siril/blocks-definitions'
const props = defineProps<{ block: any; themeId: string }>()
const theme = getTheme(props.themeId)
const tokens = Object.fromEntries(Object.entries(theme.tokens))
const plans = computed(() => (props.block.plans ?? []))
const isExternal = (l: string) => typeof l === 'string' && l.startsWith('http')
</script>
<style>
.pricing-block { padding: 2rem; max-width: 72rem; margin: 0 auto; }
.pricing-title { text-align: center; margin-bottom: 1.5rem; color: var(--c-primary, #111); }
.pricing-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
.pricing-card { padding: 1.25rem; border-radius: .5rem; background: var(--c-surface, #f5f5f5); }
.pricing-card-featured { border: 2px solid var(--c-primary, #111); background: #fff; }
.pricing-plan-title { font-weight: 600; margin-bottom: .5rem; }
.pricing-price { font-size: 1.75rem; font-weight: 700; margin-bottom: .5rem; color: var(--c-primary, #111); }
.pricing-desc { margin-bottom: .75rem; }
.pricing-btn { display: inline-block; padding: .5rem 1rem; border-radius: .5rem; background: var(--c-primary, #111); color: #fff; text-decoration: none; }
@media (max-width: 640px) { .pricing-grid { grid-template-columns: 1fr; } }
</style>
