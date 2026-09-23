<template>
  <div class="rt" v-html="html" />
</template>
<script setup lang="ts">
import { lexicalToHtml } from '~/utils/lexical-to-html'
const props = defineProps<{ value: any }>()
const html = computed(() => lexicalToHtml(props.value))
</script>
<style>
.rt > :first-child { margin-top: 0; }
.rt > :last-child { margin-bottom: 0; }
</style>
