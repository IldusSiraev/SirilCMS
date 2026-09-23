<template>
  <section class="text-image text-image--split" :style="tokens">
    <img :src="imgSrc" v-if="imgSrc" class="text-image-img">
    <div class="text-image-copy">
      <h2>{{ block.title }}</h2>
      <div class="text-image-body"><RichText :value="block.body" /></div>
    </div>
  </section>
</template>
<script setup lang="ts">
import { getTheme } from '@siril/blocks-definitions'
const props = defineProps<{ block: any; themeId: string }>()
const theme = getTheme(props.themeId)
const tokens = Object.fromEntries(Object.entries(theme.tokens))
const imgSrc = computed(() => mediaUrl(props.block.image))
</script>
<style>
.text-image { display: flex; gap: 2rem; align-items: center; padding: 2rem; max-width: 72rem; margin: 0 auto; }
.text-image--split .text-image-img { order: -1; }
.text-image-copy { flex: 1 1 50%; }
.text-image-copy h2 { margin-bottom: .75rem; color: var(--c-primary, #111); }
.text-image-img { flex: 1 1 50%; width: 100%; height: auto; border-radius: .5rem; object-fit: cover; }
@media (max-width: 640px) { .text-image { flex-direction: column; } .text-image--split .text-image-img { order: 0; } }
</style>
