<template>
  <section class="cases-block" :style="tokens">
    <h2 class="cases-title">{{ block.title }}</h2>
    <ul class="cases-list">
      <li v-for="(item, i) in block.items ?? []" :key="i" class="cases-card">{{ item.value ?? item }}</li>
    </ul>
  </section>
</template>
<script setup lang="ts">
import { getTheme } from '@siril/contracts'
const props = defineProps<{ block: any; themeId: string }>()
const tokens = Object.fromEntries(Object.entries(getTheme(props.themeId).tokens))
</script>
<style>
.cases-block { padding: 2rem; max-width: 72rem; margin: 0 auto; }
.cases-title { color: var(--c-primary, #111); }
.cases-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; list-style: none; padding: 0; }
.cases-card { padding: 1rem; border-radius: var(--radius, .5rem); border: 1px solid var(--c-primary, #111); }
</style>
