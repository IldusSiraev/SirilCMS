<template>
  <section class="features" :style="tokens">
    <h2>{{ block.title }}</h2>
    <div class="features-grid">
      <div v-for="(item, idx) in items" :key="idx" class="feature-card">
        <RichText :value="item" />
      </div>
    </div>
  </section>
</template>
<script setup lang="ts">
import { getTheme } from '@siril/blocks-definitions'
const props = defineProps<{ block: any; themeId: string }>()
const theme = getTheme(props.themeId)
const tokens = Object.fromEntries(Object.entries(theme.tokens))
const items = computed(() => (props.block.items ?? []).map((i: any) => i.value))
</script>
<style>
.features { padding: 2rem; max-width: 72rem; margin: 0 auto; }
.features h2 { text-align: center; margin-bottom: 1.5rem; color: var(--c-primary, #111); }
.features-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
.feature-card { padding: 1.25rem; border-radius: .5rem; background: var(--c-surface, #f5f5f5); }
@media (max-width: 640px) { .features-grid { grid-template-columns: 1fr; } }
</style>
