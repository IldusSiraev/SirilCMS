<template>
  <section class="faq-block" :style="tokens">
    <h2 class="faq-title">{{ block.title }}</h2>
    <div class="faq-list">
      <details v-for="(i, idx) in items" :key="idx" class="faq-item">
        <summary class="faq-question">{{ i.question }}</summary>
        <div class="faq-answer"><RichText :value="i.answer" /></div>
      </details>
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
.faq-block { padding: 2rem; max-width: 72rem; margin: 0 auto; }
.faq-title { text-align: center; margin-bottom: 1.5rem; color: var(--c-primary, #111); }
.faq-list { display: flex; flex-direction: column; gap: .75rem; }
.faq-item { padding: 1rem 1.25rem; border-radius: .5rem; background: var(--c-surface, #f5f5f5); }
.faq-question { font-weight: 600; cursor: pointer; }
.faq-answer { margin-top: .5rem; }
@media (max-width: 640px) { .faq-list { flex-direction: column; } }
</style>
