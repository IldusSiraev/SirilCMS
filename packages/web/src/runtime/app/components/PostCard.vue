<template>
  <NuxtLink :to="`/blog/${post.slug}`" class="post-card">
    <img v-if="cover" :src="cover" :alt="post.title || ''" loading="lazy" class="post-card-cover">
    <div class="post-card-body">
      <h3 class="post-card-title">{{ post.title }}</h3>
      <p v-if="post.excerpt" class="post-card-excerpt">{{ post.excerpt }}</p>
    </div>
  </NuxtLink>
</template>
<script setup lang="ts">
const props = defineProps<{ post: any }>()
const cover = computed(() => mediaUrl(props.post?.cover))
</script>
<style>
.post-card { display: block; border-radius: .5rem; overflow: hidden; background: var(--c-surface, #f5f5f5); color: inherit; }
.post-card-cover { width: 100%; aspect-ratio: 16/9; object-fit: cover; }
.post-card-body { padding: 1rem; }
.post-card-title { font-size: 1.125rem; margin-bottom: .25rem; color: var(--c-primary, #111); }
.post-card-excerpt { font-size: .875rem; opacity: .8; }
</style>
