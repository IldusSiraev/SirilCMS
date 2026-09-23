<template>
  <section class="hero" :style="tokens">
    <h1>{{ block.title }}</h1>
    <div class="hero-sub"><RichText :value="block.subtitle" /></div>
    <NuxtLink v-if="block.buttonText" :to="block.buttonLink || '/contact'" class="btn">{{ block.buttonText }}</NuxtLink>
  </section>
</template>
<script setup lang="ts">
import { getTheme } from '@siril/blocks-definitions'
const props = defineProps<{ block: any; themeId: string }>()
const theme = getTheme(props.themeId)
const tokens = Object.fromEntries(Object.entries(theme.tokens))
</script>
<style>
.hero { padding: 4rem 2rem; text-align: center; max-width: 72rem; margin: 0 auto; }
.hero h1 { font-size: 2.5rem; margin-bottom: .5rem; color: var(--c-primary, #111); }
.btn { display: inline-block; padding: .75rem 1.5rem; border-radius: .5rem; background: var(--c-primary, #0f766e); color: #fff; margin-top: 1rem; }
</style>
