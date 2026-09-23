<template>
  <section class="cta-banner" :style="bannerStyle">
    <div class="cta-banner-inner">
      <h2 class="cta-title">{{ block.title }}</h2>
      <div class="cta-body"><RichText :value="block.body" /></div>
      <NuxtLink v-if="block.buttonText" :to="block.buttonLink || '/'" class="btn" :target="isExternal(block.buttonLink) ? '_blank' : undefined" :rel="isExternal(block.buttonLink) ? 'noopener' : undefined">{{ block.buttonText }}</NuxtLink>
    </div>
  </section>
</template>
<script setup lang="ts">
import { getTheme } from '@siril/blocks-definitions'
const props = defineProps<{ block: any; themeId: string }>()
const theme = getTheme(props.themeId)
const tokens = Object.fromEntries(Object.entries(theme.tokens))
const imgSrc = computed(() => mediaUrl(props.block.image))
const bannerStyle = computed(() => ({
  ...tokens,
  backgroundImage: imgSrc.value ? `url(${imgSrc.value})` : undefined,
}))
const isExternal = (l: string) => typeof l === 'string' && l.startsWith('http')
</script>
<style>
.cta-banner { position: relative; padding: 4rem 2rem; text-align: center; color: #fff; background-size: cover; background-position: center; }
.cta-banner::before { content: ''; position: absolute; inset: 0; background: linear-gradient(rgba(0, 0, 0, .55), rgba(0, 0, 0, .55)); }
.cta-banner-inner { position: relative; max-width: 48rem; margin: 0 auto; }
.cta-title { font-size: 1.75rem; margin-bottom: .5rem; }
.btn { display: inline-block; padding: .75rem 1.5rem; border-radius: .5rem; background: var(--c-primary, #0f766e); color: #fff; margin-top: 1rem; }
</style>
