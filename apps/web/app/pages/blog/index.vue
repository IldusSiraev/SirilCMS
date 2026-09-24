<template>
  <div class="blog-index">
    <h1 class="blog-index-title">Блог</h1>
    <div class="blog-index-grid">
      <PostCard v-for="p in posts" :key="p.id" :post="p" />
    </div>
  </div>
</template>
<script setup lang="ts">
const { data } = await useAsyncData('posts-index', () =>
  $fetch<{ docs: any[] }>('/api/posts?limit=50'))
const posts = computed(() => data.value?.docs ?? [])
useSeoMeta({
  title: 'Блог',
  description: 'Посты',
})
</script>
<style>
.blog-index { padding: 2rem; max-width: 72rem; margin: 0 auto; }
.blog-index-title { text-align: center; margin-bottom: 1.5rem; color: var(--c-primary, #111); }
.blog-index-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
@media (max-width: 640px) { .blog-index-grid { grid-template-columns: 1fr; } }
</style>
