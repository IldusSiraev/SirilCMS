<template>
  <section class="testimonials-block" :style="tokens">
    <h2 class="testimonials-title">{{ block.title }}</h2>
    <div class="testimonials-grid">
      <div v-for="(i, idx) in items" :key="idx" class="testimonial-card">
        <div class="testimonial-quote"><RichText :value="i.quote" /></div>
        <div class="testimonial-author">
          <img v-if="i.avatar" :src="mediaUrl(i.avatar)" :alt="i.author || ''" class="testimonial-avatar">
          <div>
            <div class="testimonial-name">{{ i.author }}</div>
            <div v-if="i.role" class="testimonial-role">{{ i.role }}</div>
          </div>
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
const items = computed(() => (props.block.items ?? []))
</script>
<style>
.testimonials-block { padding: 2rem; max-width: 72rem; margin: 0 auto; }
.testimonials-title { text-align: center; margin-bottom: 1.5rem; color: var(--c-primary, #111); }
.testimonials-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
.testimonial-card { padding: 1.25rem; border-radius: .5rem; background: var(--c-surface, #f5f5f5); }
.testimonial-author { display: flex; align-items: center; gap: .75rem; margin-top: .75rem; }
.testimonial-avatar { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; }
.testimonial-name { font-weight: 600; }
.testimonial-role { font-size: .875rem; opacity: .8; }
@media (max-width: 640px) { .testimonials-grid { grid-template-columns: 1fr; } }
</style>
