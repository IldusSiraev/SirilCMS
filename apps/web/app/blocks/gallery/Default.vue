<template>
  <section class="gallery-block" :style="tokens">
    <h2 class="gallery-title">{{ block.title }}</h2>
    <div class="gallery-grid">
      <img v-for="(img, idx) in images" :key="idx" :src="mediaUrl(img)" loading="lazy" class="gallery-img">
    </div>
  </section>
</template>
<script setup lang="ts">
import { getTheme } from '@siril/blocks-definitions'
const props = defineProps<{ block: any; themeId: string }>()
const theme = getTheme(props.themeId)
const tokens = Object.fromEntries(Object.entries(theme.tokens))
const images = computed(() => (props.block.images ?? []))
</script>
<style>
.gallery-block { padding: 2rem; max-width: 72rem; margin: 0 auto; }
.gallery-title { text-align: center; margin-bottom: 1.5rem; color: var(--c-primary, #111); }
.gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }
.gallery-img { width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: .5rem; }
@media (max-width: 640px) { .gallery-grid { grid-template-columns: 1fr; } }
</style>
