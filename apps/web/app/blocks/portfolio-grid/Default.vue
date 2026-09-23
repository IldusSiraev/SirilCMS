<template>
  <section class="portfolio-block" :style="tokens">
    <h2 class="portfolio-title">{{ block.title }}</h2>
    <div class="portfolio-grid">
      <div v-for="(i, idx) in items" :key="idx" class="portfolio-card">
        <img v-if="i.imageSrc" :src="i.imageSrc" :alt="i.title || ''" loading="lazy" class="portfolio-img">
        <div class="portfolio-name">
          <a v-if="i.link" :href="i.link" :target="isExternal(i.link) ? '_blank' : undefined" :rel="isExternal(i.link) ? 'noopener' : undefined">{{ i.title }}</a>
          <span v-else>{{ i.title }}</span>
        </div>
      </div>
    </div>
  </section>
</template>
<script setup lang="ts">
import { getTheme } from '@siril/blocks-definitions'
const props = defineProps<{ block: any; themeId: string }>()
const theme = getTheme(props.themeId)
const tokens = Object.fromEntries(Object.entries(theme.tokens))
const items = computed(() =>
  (props.block.items ?? []).map((i: any) => ({
    ...i,
    imageSrc: mediaUrl(i.image),
  })),
)
const isExternal = (l: string) => typeof l === 'string' && l.startsWith('http')
</script>
<style>
.portfolio-block { padding: 2rem; max-width: 72rem; margin: 0 auto; }
.portfolio-title { text-align: center; margin-bottom: 1.5rem; color: var(--c-primary, #111); }
.portfolio-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
.portfolio-card { border-radius: .5rem; overflow: hidden; background: var(--c-surface, #f5f5f5); }
.portfolio-img { width: 100%; aspect-ratio: 4/3; object-fit: cover; }
.portfolio-name { padding: .75rem; font-weight: 600; }
@media (max-width: 640px) { .portfolio-grid { grid-template-columns: 1fr; } }
</style>
