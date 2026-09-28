<template>
  <div class="rt" v-html="value ?? ''" />
</template>
<script setup lang="ts">
// value — готовый HTML из <name>Html-поля (см. apps/admin/src/utils/with-richtext-html.ts,
// lexicalHTMLField): Payload сам сериализует lexical-документ, web ничего не парсит.
defineProps<{ value?: string | null }>()
</script>
<style>
.rt > :first-child { margin-top: 0; }
.rt > :last-child { margin-bottom: 0; }
</style>
