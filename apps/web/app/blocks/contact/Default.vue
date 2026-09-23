<template>
  <section class="contact-block" :style="tokens">
    <h2 class="contact-title">{{ block.title }}</h2>
    <ul class="contact-list">
      <li v-if="block.email"><a :href="'mailto:' + block.email">{{ block.email }}</a></li>
      <li v-if="block.phone"><a :href="'tel:' + block.phone">{{ block.phone }}</a></li>
      <li v-if="block.address">{{ block.address }}</li>
      <li v-if="block.workHours">{{ block.workHours }}</li>
      <li v-if="block.mapLink"><a :href="block.mapLink" target="_blank" rel="noopener">Открыть на карте</a></li>
    </ul>
  </section>
</template>
<script setup lang="ts">
import { getTheme } from '@siril/blocks-definitions'
const props = defineProps<{ block: any; themeId: string }>()
const theme = getTheme(props.themeId)
const tokens = Object.fromEntries(Object.entries(theme.tokens))
</script>
<style>
.contact-block { padding: 2rem; max-width: 72rem; margin: 0 auto; }
.contact-title { text-align: center; margin-bottom: 1.5rem; color: var(--c-primary, #111); }
.contact-list { list-style: none; padding: 0; max-width: 32rem; margin: 0 auto; display: flex; flex-direction: column; gap: .5rem; }
</style>
