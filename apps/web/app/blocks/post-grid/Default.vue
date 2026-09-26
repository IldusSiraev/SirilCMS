<template>
  <section class="postgrid-block" :style="tokens">
    <h2 class="postgrid-title">{{ block.title }}</h2>
    <div class="postgrid-grid">
      <PostCard v-for="p in posts" :key="p.id" :post="p" />
    </div>
  </section>
</template>
<script setup lang="ts">
import { getTheme } from '@siril/blocks-definitions'
const props = defineProps<{ block: any; themeId: string }>()
const theme = getTheme(props.themeId)
const tokens = Object.fromEntries(Object.entries(theme.tokens))
const limit = Math.max(1, Number(props.block.limit) || 9)
const host = useRequestURL().host
const { data } = await useAsyncData(`posts-block:grid:${host}:${limit}`, () =>
  $fetch<{ docs: any[] }>('/api/posts', { query: { limit, host } }))
const posts = computed(() => data.value?.docs ?? [])
</script>
<style>
.postgrid-block { padding: 2rem; max-width: 72rem; margin: 0 auto; }
.postgrid-title { text-align: center; margin-bottom: 1.5rem; color: var(--c-primary, #111); }
.postgrid-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
@media (max-width: 640px) { .postgrid-grid { grid-template-columns: 1fr; } }
</style>
