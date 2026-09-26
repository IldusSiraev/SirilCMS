<template>
  <section class="postlist-block" :style="tokens">
    <h2 class="postlist-title">{{ block.title }}</h2>
    <div class="postlist-list">
      <PostCard v-for="p in posts" :key="p.id" :post="p" />
    </div>
  </section>
</template>
<script setup lang="ts">
import { getTheme } from '@siril/blocks-definitions'
const props = defineProps<{ block: any; themeId: string }>()
const theme = getTheme(props.themeId)
const tokens = Object.fromEntries(Object.entries(theme.tokens))
const limit = Math.max(1, Number(props.block.limit) || 6)
const host = useRequestURL().host
const { data } = await useAsyncData(`posts-block:list:${host}:${limit}`, () =>
  $fetch<{ docs: any[] }>('/api/posts', { query: { limit, host } }))
const posts = computed(() => data.value?.docs ?? [])
</script>
<style>
.postlist-block { padding: 2rem; max-width: 72rem; margin: 0 auto; }
.postlist-title { text-align: center; margin-bottom: 1.5rem; color: var(--c-primary, #111); }
.postlist-list { display: grid; grid-template-columns: 1fr; gap: 1rem; max-width: 40rem; margin: 0 auto; }
</style>
