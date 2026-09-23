<template>
  <section class="hero hero--split" :style="tokens">
    <div class="hero-copy">
      <h1>{{ block.title }}</h1>
      <div class="hero-sub"><RichText :value="block.subtitle" /></div>
    </div>
    <img :src="mediaUrl(block.image)" v-if="block.image" class="hero-img">
  </section>
</template>
<script setup lang="ts">
import { getTheme } from '@siril/blocks-definitions'
const props = defineProps<{ block: any; themeId: string }>()
const theme = getTheme(props.themeId)
const tokens = Object.fromEntries(Object.entries(theme.tokens))
</script>
<style>
.hero--split { display: flex; gap: 2rem; align-items: center; padding: 4rem 2rem; max-width: 72rem; margin: 0 auto; }
.hero--split .hero-copy { flex: 1 1 50%; }
.hero--split h1 { font-size: 2.5rem; margin-bottom: .5rem; color: var(--c-primary, #111); text-align: left; }
.hero-img { flex: 1 1 50%; width: 100%; height: auto; border-radius: .5rem; object-fit: cover; }
@media (max-width: 640px) { .hero--split { flex-direction: column; } }
</style>
