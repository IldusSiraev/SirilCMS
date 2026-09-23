<template>
  <section class="cta-block" :style="tokens">
    <h2 class="cta-title">{{ block.title }}</h2>
    <div class="cta-body"><RichText :value="block.body" /></div>
    <NuxtLink v-if="block.buttonText" :to="block.buttonLink || '/'" class="btn" :target="isExternal(block.buttonLink) ? '_blank' : undefined" :rel="isExternal(block.buttonLink) ? 'noopener' : undefined">{{ block.buttonText }}</NuxtLink>
  </section>
</template>
<script setup lang="ts">
import { getTheme } from '@siril/blocks-definitions'
const props = defineProps<{ block: any; themeId: string }>()
const theme = getTheme(props.themeId)
const tokens = Object.fromEntries(Object.entries(theme.tokens))
const isExternal = (l: string) => typeof l === 'string' && l.startsWith('http')
</script>
<style>
.cta-block { padding: 3rem 2rem; text-align: center; max-width: 72rem; margin: 0 auto; }
.cta-title { font-size: 1.75rem; margin-bottom: .5rem; color: var(--c-primary, #111); }
.btn { display: inline-block; padding: .75rem 1.5rem; border-radius: .5rem; background: var(--c-primary, #0f766e); color: #fff; margin-top: 1rem; }
</style>
